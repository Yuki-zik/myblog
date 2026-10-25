#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { runTranslation,translateDocument } from './translation-core.mjs';
import { createProvider } from './provider.mjs';
import { createCodexProvider } from './codex-provider.mjs';
export async function main(args=process.argv.slice(2)) {
  const allowed=new Set(['--status','--bootstrap','--fixture-probe','--dry-run','--force','--semantic-review','--help']);
  if(args.some(arg=>!allowed.has(arg))) throw new Error('unknown-option');
  if(args.includes('--help')) {console.log('node scripts/i18n/translate.mjs [--status|--bootstrap|--fixture-probe] [--dry-run] [--force] [--semantic-review]');return;}
  if(args.filter(x=>['--status','--bootstrap','--fixture-probe'].includes(x)).length>1) throw new Error('incompatible-options');
  const glossary=JSON.parse(await readFile(new URL('./glossary.json',import.meta.url),'utf8'));
  if(args.includes('--fixture-probe')) {
    const provider={name:'fixture',model:'deterministic',translate:async items=>Object.fromEntries(items.map(x=>[x.id,x.text.replace(/\p{Script=Han}+/gu,'English')]))};
    const fixture='---\ntitle: 中文\n---\n## 标题\n\n中文 42 `code` $x=2$[^note-a]\n\n:spoiler[秘密]\n\n[^note-a]: 脚注\n';
    const result=await translateDocument(fixture,{provider,glossary});
    console.log(JSON.stringify({ok:true,itemCount:result.itemCount,headingMap:result.headingMap,modelCalled:false}));return;
  }
  const readonly=args.includes('--dry-run')||args.includes('--status');
  const bootstrap=args.includes('--bootstrap');
  // Credentials are not required or even read for read-only/adoption operations.
  let provider;
  if(!readonly && !bootstrap) {
    // Lazy provider initialization keeps unchanged runs true no-ops without keys.
    let real; const get=()=>real??=(process.env.TRANSLATION_ENDPOINT ? createProvider() : createCodexProvider({maxRequests: Number(process.env.TRANSLATION_MAX_REQUESTS || 24)}));
    provider={get name(){return get().name;},get model(){return get().model;},translate:(...v)=>get().translate(...v),review:(...v)=>get().review(...v)};
  }
  const result=await runTranslation({provider,glossary,dryRun:readonly,status:args.includes('--status'),bootstrap,force:args.includes('--force'),semanticReview:args.includes('--semantic-review')});
  console.log(JSON.stringify({ok:result.ok,results:result.results},null,2));
  if(!result.ok) process.exitCode=1;
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) main().catch(()=>{console.error(JSON.stringify({ok:false,errors:[{code:'translation-command-failed'}]}));process.exitCode=1;});
