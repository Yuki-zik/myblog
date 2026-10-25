import {mkdtemp,cp,symlink,readFile,writeFile,rm,access} from 'node:fs/promises';
import {execFile} from 'node:child_process';import {promisify} from 'node:util';
import {tmpdir} from 'node:os';import {join,resolve} from 'node:path';import assert from 'node:assert/strict';
const run=promisify(execFile),source=process.cwd(),root=await mkdtemp(join(tmpdir(),'blog-lifecycle-build-'));
try {
  for(const item of ['src','public','scripts','astro.config.mjs','tsconfig.json','package.json'])await cp(resolve(source,item),join(root,item),{recursive:true});
  await symlink(resolve(source,'node_modules'),join(root,'node_modules'),'dir');
  const edit=async(file,fn)=>writeFile(join(root,file),fn(await readFile(join(root,file),'utf8')));
  await edit('src/content/posts/why-topic-first.md',s=>s+'\n中文原稿增加一段，英文应显示待同步提示。\n');
  await edit('src/content/posts/ant-ai-coding-review.md',s=>s.replace(/^---\n/,'---\ndraft: true\n'));
  await rm(join(root,'src/content/concepts/optimistic-ui.md'));
  await writeFile(join(root,'src/content/posts/source-only-check.md'),'---\ntitle: "仅中文的新文章"\ndate: "2026-10-25T00:00:00Z"\ntopics: [knowledge-network]\nsummary: "用于验证中文发布不会等待英文。"\n---\n\n中文先发布，译文通过检查后再加入英文页面。\n');
  await run('pnpm',['exec','astro','build'],{cwd:root,env:{...process.env,SITE_URL:'https://lifecycle.example'},maxBuffer:8*1024*1024,timeout:120000});
  const read=file=>readFile(join(root,'dist',file),'utf8');
  const english=await read('en/posts/why-topic-first/index.html');
  assert(english.includes('data-translation-state="stale"'));assert(english.includes('data-translation-notice'));assert(english.includes('English update pending'));
  for(const route of ['en/posts/ant-ai-coding-review/index.html','en/posts/ant-ai-coding-review.md','en/concepts/optimistic-ui/index.html','en/posts/source-only-check/index.html'])await assert.rejects(access(join(root,'dist',route)),route);
  assert((await read('posts/source-only-check/index.html')).includes('仅中文的新文章'));
  const index=JSON.parse(await read('en/search-index.json'));
  const fallback=index.find(item=>item.url==='/posts/source-only-check');assert(fallback?.languageLabel,'untranslated search result must be labelled');
  assert(!index.some(item=>/ant-ai-coding-review|concepts\/optimistic-ui/.test(item.url)));
  const sitemap=await read('sitemap.xml');assert(!sitemap.includes('/en/posts/ant-ai-coding-review'));
  console.log('Translation lifecycle build passed: Chinese-only publication, stale notice, draft withdrawal, deleted-source filtering, raw mirrors and labelled search fallback.');
} finally {await rm(root,{recursive:true,force:true});}
