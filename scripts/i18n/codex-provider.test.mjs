import test from 'node:test';
import assert from 'node:assert/strict';
import {codexArguments,safeCodexEnvironment,createCodexProvider} from './codex-provider.mjs';
test('model subprocess cannot inherit repository or API credentials',()=>{
 const clean=safeCodexEnvironment({PATH:'/bin',HOME:'/home/local',GITHUB_TOKEN:'do-not-copy',GH_TOKEN:'do-not-copy',TRANSLATION_API_KEY:'private',OPENAI_API_KEY:'private'});
 assert.deepEqual(clean,{PATH:'/bin',HOME:'/home/local'});
});
test('Codex adapter is read-only and disables execution/network/plugin tools',()=>{
 const args=codexArguments({cwd:'/tmp/isolated',schemaFile:'/tmp/schema',outputFile:'/tmp/output',model:'test'});
 assert(args.includes('read-only'));assert(args.includes('--ignore-user-config'));assert(args.includes('--ephemeral'));
 for(const name of ['shell_tool','unified_exec','plugins','hooks','browser_use','apps','computer_use','multi_agent']) assert(args.includes(name));
 assert(args.includes('web_search="disabled"'));assert(args.includes('project_doc_max_bytes=0'));
 assert(!args.includes('--dangerously-bypass-approvals-and-sandbox'));
});
test('quota limits fail closed before starting any model',()=>{
 for(const maxRequests of [0,-1,NaN,101])assert.throws(()=>createCodexProvider({maxRequests}),/invalid-limits/);
});
