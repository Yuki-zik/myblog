import { createHash, randomUUID } from 'node:crypto';
import { readFile, writeFile, mkdir, readdir, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import gfm from 'remark-gfm';
import math from 'remark-math';
import directive from 'remark-directive';
import GithubSlugger from 'github-slugger';
import { validateMapping } from './provider.mjs';
import { unified } from 'unified';
import parse from 'remark-parse';
import { parseDocument } from 'yaml';
export const PROMPT_VERSION='zh-source-text-v1';
export const COLLECTIONS=['posts','papers','topics','concepts'];
export const canonicalSource=text=>text.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n');
export const sourceHash=text=>createHash('sha256').update(canonicalSource(text)).digest('hex');
export const targetHash=text=>createHash('sha256').update(text).digest('hex');
export class ValidationError extends Error {
  constructor(code,details=[]) { super(`validation: ${code}`); this.code=code; this.details=details; }
}
const parser=()=>unified().use(parse).use(gfm).use(math).use(directive);
function walk(node,fn,ancestors=[]) {fn(node,ancestors); for(const child of node.children||[]) walk(child,fn,[...ancestors,node]);}
function parseSource(text) {
  const match=/^(?:\uFEFF)?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
  if(!match) throw new ValidationError('frontmatter-required');
  const doc=parseDocument(match[1]);
  if(doc.errors.length) throw new ValidationError('invalid-yaml');
  const data=doc.toJS({maxAliasCount:0});
  if(!data || Array.isArray(data) || typeof data!=='object') throw new ValidationError('invalid-frontmatter');
  return {doc,data,body:text.slice(match[0].length),bodyOffset:match[0].length,yamlOffset:match[0].indexOf('\n')+1};
}
const translatable=new Set(['title','summary','subtitle','abstract','why','alt','caption','description','label']);
const structural=new Set(['authors','author','venue','identifiers','citation','bibtex','topics','concepts','related','relatedTopics','relatedPosts','entryPosts','tags','sourceRefIds']);
const hasChinese=text=>/\p{Script=Han}/u.test(text);
const escaped=text=>text.replace(/[&<>\\`*_[\]{}()!|#$~:.+\-=]/g,c=>`&#${c.codePointAt(0)};`).replace(/\r?\n/g,' ');
// Protected literals are restored by the engine, never rewritten by the model.
const literals=/(?:https?:\/\/[^\s<>]+|[+\-−±]?\d+(?:[.,]\d+)*(?:[eE][+\-]?\d+)?(?:%|‰)?|\[@[^\]]+\]|ZXQPH\w*)/g;
function mask(text) {
  const values=[];
  const masked=text.replace(literals,value=>{const token=`ZXQPH${values.length}QXZ`;values.push(value);return token;});
  return {text:masked,values};
}
function restore(value,original,{escape=false}={}) {
  const expected=original.values.map((_,i)=>`ZXQPH${i}QXZ`);
  const actual=value.match(/ZXQPH\d+QXZ/g)||[];
  if(JSON.stringify(expected)!==JSON.stringify(actual)) throw new ValidationError('placeholder-mismatch');
  const bare=value.replace(/ZXQPH\d+QXZ/g,'');
  if(/\d/.test(bare) || /https?:\/\//.test(bare)) throw new ValidationError('introduced-number-or-url');
  const safe=escape?escaped(value):value;
  return safe.replace(/ZXQPH(\d+)QXZ/g,(_,i)=>escape?escaped(original.values[Number(i)]):original.values[Number(i)]);
}
function patch(text,patches) {
  const sorted=[...patches].sort((a,b)=>a.start-b.start);
  for(let i=1;i<sorted.length;i++) if(sorted[i].start<sorted[i-1].end) throw new ValidationError('overlapping-patches');
  for(const p of sorted.reverse()) text=text.slice(0,p.start)+p.value+text.slice(p.end);
  return text;
}
function headingIds(tree,paragraphs=false) {
  const slugger=new GithubSlugger(); const result=[];
  walk(tree,node=>{if(node.type==='heading' && (!paragraphs || [2,3].includes(node.depth))) {
    let text='';walk(node,n=>{if(['text','inlineCode','inlineMath'].includes(n.type)) text+=n.value; if(n.type==='image') text+=n.alt||'';});
    result.push(slugger.slug(text.trim()));
  }}); return result;
}
function rebase(value,sourcePath,targetPath) {
  if(!sourcePath || !targetPath || !/^\.\.?\//.test(value)) return value;
  const rebased=path.relative(path.dirname(targetPath),path.resolve(path.dirname(sourcePath),value)).split(path.sep).join('/');
  return rebased.startsWith('.')?rebased:`./${rebased}`;
}
function replaceDestination(raw,old,value) {
  if(old===value) return raw;
  const index=raw.lastIndexOf(old);
  if(index<0) throw new ValidationError('unsupported-link-encoding');
  return raw.slice(0,index)+value+raw.slice(index+old.length);
}
function fingerprint(body) {
 const values=[];walk(parser().parse(body),(n)=>{
   if(['code','inlineCode','math','inlineMath','footnoteReference','footnoteDefinition'].includes(n.type)) values.push([n.type,['footnoteReference','footnoteDefinition'].includes(n.type)?n.identifier:body.slice(n.position.start.offset,n.position.end.offset)]);
   if(n.type==='html') values.push(['html-tags',n.value.match(/<!--[\s\S]*?-->|<(?:(?:"[^"]*")|(?:'[^']*')|[^'">])*>/g)||[]]);
 }); return values;
}
/** Translate only allowlisted prose, with offsets retaining original syntax. */
export async function translateDocument(text,{provider,glossary={version:'none',terms:{}},sourcePath,targetPath,semanticReview=false,maxChunkChars=4500}={}) {
  const parsed=parseSource(text); const tree=parser().parse(parsed.body);
  const items=[]; const patches=[]; const yamlPatches=[];
  function add(value,start,end,kind='markdown') {
    if(!hasChinese(value)) return;
    // Large individual nodes fail closed instead of exceeding the request budget.
    const protectedText=mask(value); if(protectedText.text.length>maxChunkChars) throw new ValidationError('text-node-too-large');
    items.push({id:`t${items.length}`,text:protectedText.text,original:protectedText,sourceValue:value,start,end,kind});
  }
  function yamlWalk(node,keys=[],blocked=false) {
    if(!node) return;
    if(node.items) {
      for(let i=0;i<node.items.length;i++) {const item=node.items[i];
        if(item?.key) {const key=String(item.key.value);yamlWalk(item.value,[...keys,key],blocked||structural.has(key));}
        else yamlWalk(item,[...keys,i],blocked);
      }
    } else if(typeof node.value==='string' && node.range) {
      const key=keys.at(-1); const value=node.value;
      if(!blocked && (translatable.has(key) || (keys[0]==='keywords'))) add(value,node.range[0]+parsed.yamlOffset,node.range[1]+parsed.yamlOffset,'yaml');
      if(key==='src') { const next=rebase(value,sourcePath,targetPath); if(next!==value) yamlPatches.push({start:node.range[0]+parsed.yamlOffset,end:node.range[1]+parsed.yamlOffset,value:JSON.stringify(next)}); }
    }
  }
  yamlWalk(parsed.doc.contents);
  walk(tree,(node,ancestors)=>{
    const start=node.position?.start.offset,end=node.position?.end.offset;
    // Bibliographic source citations remain verbatim, including author/title spelling.
    if(ancestors.some(n=>n.type==='footnoteDefinition' && n.identifier.startsWith('ref-'))) return;
    if(node.type==='text' && !ancestors.some(n=>['code','math','inlineMath','inlineCode'].includes(n.type))) {
      // Autolink and GFM URL text also carries its destination: preserve it whole.
      if(ancestors.some(n=>n.type==='link' && (n.url===node.value || /^<https?:/.test(parsed.body.slice(n.position.start.offset,n.position.end.offset))))) return;
      add(node.value,start,end);
    }
    if(node.type==='image' && node.alt && hasChinese(node.alt)) {
      const raw=parsed.body.slice(start,end);const close=raw.indexOf(']');
      if(close>1) add(node.alt,start+2,start+close);
    }
    if(node.type==='html' && hasChinese(node.value)) {
      if(/<(?:script|style|pre|code)\b/i.test(node.value)) throw new ValidationError('unsupported-html-text');
      const raw=parsed.body.slice(start,end);
      // Tokenize comments/tags as opaque; only visible text is eligible.
      const tokens=raw.matchAll(/<!--[\s\S]*?-->|<(?:(?:"[^"]*")|(?:'[^']*')|[^'">])*>|[^<]+/g);
      for(const token of tokens) if(!token[0].startsWith('<')) add(token[0],start+token.index,start+token.index+token[0].length,'html');
    }
  });
  let chunk=[];let length=0;const translated={}; const reviewPairs=[];
  async function flush() {
    if(!chunk.length) return;
    const response=validateMapping(await provider.translate(chunk.map(({id,text})=>({id,text})),{glossary:glossary.terms}),chunk);
    for(const item of chunk) {
      let plain=restore(response[item.id],item.original);
      if(item.kind!=='yaml') plain=(item.sourceValue.match(/^\s*/)?.[0]||'')+plain.trim()+(item.sourceValue.match(/\s*$/)?.[0]||'');
      if(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(plain)) throw new ValidationError('invalid-control-character');
      if(hasChinese(plain)) throw new ValidationError('untranslated-chinese',[{id:item.id}]);
      translated[item.id]=plain;
      reviewPairs.push({id:item.id,source:restore(item.text,item.original),target:plain});
    }
    if(semanticReview) {
      if(typeof provider.review!=='function') throw new ValidationError('review-unavailable');
      const review=await provider.review(reviewPairs.splice(0));
      if(review?.approved!==true || !Array.isArray(review.issues) || review.issues.length) throw new ValidationError('semantic-review-required');
    }
    chunk=[];length=0;
  }
  for(const item of items) {if(length+item.text.length>maxChunkChars) await flush();chunk.push(item);length+=item.text.length;}
  await flush();
  for(const item of items) {
    const value=item.kind==='yaml'?JSON.stringify(translated[item.id]):escaped(translated[item.id]);
    (item.kind==='yaml'?yamlPatches:patches).push({start:item.start,end:item.end,value:value+(item.kind==='yaml' && text.slice(item.start,item.end).endsWith('\n')?'\n':'')});
  }
  let body=patch(parsed.body,patches);
  const originalIds=headingIds(tree),newIds=headingIds(parser().parse(body));
  if(originalIds.length!==newIds.length) throw new ValidationError('heading-count');
  const headingMap=Object.fromEntries(originalIds.map((id,i)=>[id,newIds[i]]));
  const paragraphIds=headingIds(tree,true),newParagraphIds=headingIds(parser().parse(body),true);
  const paragraphMap=Object.fromEntries(paragraphIds.map((id,i)=>[id,newParagraphIds[i]]));
  function mapAnchor(anchor) {
    const prefix=anchor.startsWith('c-')?'c-':''; const raw=prefix?anchor.slice(2):anchor;
    const [section,...rest]=raw.split('::');
    const mapping=rest.length?paragraphMap:headingMap;
    if(Object.hasOwn(mapping,section)) return prefix+mapping[section]+(rest.length?'::'+rest.join('::'):'');
    if(section==='root' || /^\^|^(?:note|ref|fn|fnref)-/.test(section)) return anchor;
    throw new ValidationError('unresolved-anchor');
  }
  const bodyTree=parser().parse(body);const urlPatches=[];
  walk(bodyTree,node=>{
    if(!['link','image','definition'].includes(node.type)) return;
    let next=node.url;
    if(node.url.startsWith('#')) {let decoded;try {decoded=decodeURIComponent(node.url.slice(1));}catch{throw new ValidationError('invalid-anchor');}next='#'+mapAnchor(decoded);}
    else if(node.type==='image' || node.type==='definition') {
      // Definition targets may serve links or images; all relative files need
      // the same source-relative resolution in the deeper English directory.
      next=rebase(node.url,sourcePath,targetPath);
    }
    if(next!==node.url) {const start=node.position.start.offset,end=node.position.end.offset;urlPatches.push({start,end,value:replaceDestination(body.slice(start,end),node.url,next)});}
  });
  body=patch(body,urlPatches);
  function anchorWalk(node,key) {
    if(node?.items) for(const item of node.items) {if(item?.key) anchorWalk(item.value,String(item.key.value));else anchorWalk(item);}
    else if(key==='anchorId' && typeof node?.value==='string') yamlPatches.push({start:node.range[0]+parsed.yamlOffset,end:node.range[1]+parsed.yamlOffset,value:JSON.stringify(mapAnchor(node.value))});
  }
  anchorWalk(parsed.doc.contents);
  const header=patch(text.slice(0,parsed.bodyOffset),yamlPatches);
  const output=header+body; parseSource(output);
  if(JSON.stringify(fingerprint(parsed.body))!==JSON.stringify(fingerprint(body))) throw new ValidationError('protected-structure-changed');
  return {text:output,headingMap,itemCount:items.length,semanticReview:semanticReview?'passed':'not-requested'};
}
async function readOptional(file) {try{return await readFile(file,'utf8');}catch(error){if(error.code==='ENOENT')return null;throw error;}}
async function contentFiles(directory,prefix='') {
  let entries;try{entries=await readdir(directory,{withFileTypes:true});}catch(error){if(error.code==='ENOENT')return [];throw error;}
  const files=[];for(const entry of entries.sort((a,b)=>a.name.localeCompare(b.name))) {
    if(entry.isSymbolicLink()) throw new ValidationError('symlink-content');
    const relative=prefix+entry.name;
    if(entry.isDirectory()) files.push(...await contentFiles(path.join(directory,entry.name),relative+'/'));
    else if(/\.md$/.test(entry.name)) files.push(relative);
    else if(/\.mdx$/.test(entry.name)) throw new ValidationError('mdx-unsupported');
  }return files;
}
export async function atomicWrite(file,text) {
  await mkdir(path.dirname(file),{recursive:true});const temp=`${file}.${randomUUID()}.tmp`;
  try {await writeFile(temp,text,{flag:'wx'});await rename(temp,file);}finally{await rm(temp,{force:true});}
}
export function entryStatus({source,target,entry,glossaryVersion,promptVersion=PROMPT_VERSION}) {
  if(source===null) return 'removed';
  if(parseSource(source).data.draft===true) return 'draft';
  if(target!==null && (!entry?.targetHash || targetHash(target)!==entry.targetHash)) return 'conflict';
  if(entry?.failedSourceHash===sourceHash(source)) return entry.state==='review'?'review':'failed';
  if(target===null && entry?.retiredManualTargetHash) return 'conflict';
  if(target===null) return 'missing';
  if(entry.sourceHash!==sourceHash(source)) return 'changed';
  if(entry.provider!=='existing-reviewed' && (entry.promptVersion!==promptVersion || entry.glossaryVersion!==glossaryVersion)) return 'stale';
  return 'current';
}
/** Worktree-local single writer; targets are committed only after validation. */
async function runUnlocked({root=process.cwd(),provider,glossary={version:'none',terms:{}},dryRun=false,status=false,bootstrap=false,force=false,semanticReview=false,maxRequests=100,now=()=>new Date().toISOString()}={}) {
  const manifestPath=path.join(root,'src/data/translation-state.json');
  const oldManifest=await readOptional(manifestPath);
  let manifest;try{manifest=oldManifest?JSON.parse(oldManifest):{version:1,entries:{}};}catch{throw new ValidationError('invalid-manifest');}
  if(manifest.version!==1 || !manifest.entries || Array.isArray(manifest.entries)) throw new ValidationError('invalid-manifest');
  const keys=new Set(Object.keys(manifest.entries));
  for(const collection of COLLECTIONS) for(const language of ['', 'en/']) {
    for(const file of await contentFiles(path.join(root,'src/content',language,collection))) keys.add(collection+'/'+file);
  }
  const results=[]; const readonly=dryRun||status;
  let requests=0;
  const boundedProvider=provider && {
    get name(){return provider.name;},get model(){return provider.model;},
    async translate(...args){if(++requests>maxRequests) throw new ValidationError('request-limit');return provider.translate(...args);},
    async review(...args){if(++requests>maxRequests) throw new ValidationError('request-limit');if(!provider.review)throw new ValidationError('review-unavailable');return provider.review(...args);}
  };
  for(const key of [...keys].sort()) {
    if(!/^(posts|papers|topics|concepts)\/(?!.*(?:^|\/)\.\.?\/)[^\\]+\.md$/.test(key) || key.split('/').includes('..')) throw new ValidationError('invalid-manifest-key');
    const sourcePath=path.join(root,'src/content',key),targetPath=path.join(root,'src/content/en',key);
    const source=await readOptional(sourcePath),target=await readOptional(targetPath),entry=manifest.entries[key];
    let state;
    try {state=entryStatus({source,target,entry,glossaryVersion:glossary.version});}
    catch {
      results.push({key,state:'failed',action:'invalid-source',errors:[{code:'invalid-source'}]});
      if(!readonly) manifest.entries[key]={sourceHash:null,targetHash:null,translatedAt:null,provider:null,model:null,promptVersion:null,glossaryVersion:null,...entry,state:'failed',failedSourceHash:sourceHash(source),failedAt:now(),errors:[{code:'invalid-source'}]};
      continue;
    }
    if(state==='current' && semanticReview && entry?.semanticReview!=='passed' && entry?.provider!=='existing-reviewed') state='stale';
    const result={key,state,action:'noop'};results.push(result);
    if(readonly) {result.action=state==='current'?'noop':'pending';continue;}
    if(state==='removed' || state==='draft') {
      // Retire out of Astro's content tree. Preserve manual edits, including
      // untracked targets, without leaving old English public after a draft.
      if(target!==null) {
        const archive=path.join(root,'.translation-retired',key+'.'+targetHash(target)+'.txt');
        await atomicWrite(archive,target);await rm(targetPath);result.action='retired';
      }
      const next={sourceHash:null,targetHash:null,translatedAt:null,provider:null,model:null,promptVersion:null,glossaryVersion:null,...entry,state};
      if(target!==null && (!entry?.targetHash || targetHash(target)!==entry.targetHash)) next.retiredManualTargetHash=targetHash(target);
      if(source!==null) next.retiredSourceHash=sourceHash(source);
      if(JSON.stringify(entry)!==JSON.stringify(next)) manifest.entries[key]=next;
      continue;
    }
    if(bootstrap) {
      if(!entry && target!==null) {
        manifest.entries[key]={sourceHash:sourceHash(source),targetHash:targetHash(target),translatedAt:now(),provider:'existing-reviewed',model:null,promptVersion:null,glossaryVersion:null,state:'current',provenance:'existing-reviewed',semanticReview:'human-adopted'};
        result.state='current';result.action='adopted';
      }continue;
    }
    if(state==='conflict' && !force) {result.action='blocked';continue;}
    if(state==='current') continue;
    if(!provider) throw new ValidationError('provider-required');
    try {
      const translated=await translateDocument(source,{provider:boundedProvider,glossary,sourcePath,targetPath,semanticReview});
      // Detect concurrent edits before committing the candidate.
      if(await readOptional(sourcePath)!==source || await readOptional(targetPath)!==target) throw new ValidationError('concurrent-edit');
      await atomicWrite(targetPath,translated.text);
      manifest.entries[key]={sourceHash:sourceHash(source),targetHash:targetHash(translated.text),translatedAt:now(),provider:provider.name,model:provider.model,promptVersion:PROMPT_VERSION,glossaryVersion:glossary.version,state:'current',semanticReview:translated.semanticReview,headingMap:translated.headingMap};
      result.state='current';result.action='translated';
    } catch(error) {
      const code=error instanceof ValidationError || error?.name==='ProviderError'?error.code:'translation-failed';
      state=code==='semantic-review-required'?'review':'failed';
      manifest.entries[key]={sourceHash:null,targetHash:null,translatedAt:null,provider:null,model:null,promptVersion:null,glossaryVersion:null,...entry,state,failedSourceHash:sourceHash(source),failedAt:now(),errors:[{code}]};
      result.state=state;result.action='preserved';result.errors=[{code}];
    }
    // Checkpoint each successful/failed document. If interrupted between target
    // and manifest rename, next run detects a conflict and never overwrites it.
    await atomicWrite(manifestPath,JSON.stringify(manifest,null,2)+'\n');
  }
  const serialized=JSON.stringify(manifest,null,2)+'\n';
  if(!readonly && serialized!==oldManifest) await atomicWrite(manifestPath,serialized);
  return {manifest,results,ok:!results.some(r=>['failed','review','conflict'].includes(r.state))};
}

/** A stale lock after a killed process must be removed by the operator. */
export async function runTranslation(options={}) {
  if(options.dryRun || options.status) return runUnlocked(options);
  const lock=path.join(options.root||process.cwd(),'.translation-engine.lock');
  try {await mkdir(lock);}catch(error){if(error.code==='EEXIST')throw new ValidationError('translation-locked');throw error;}
  try {return await runUnlocked(options);}finally{await rm(lock,{recursive:true,force:true});}
}
