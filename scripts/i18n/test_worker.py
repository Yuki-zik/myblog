import importlib.util, pathlib, tempfile, unittest
SPEC=importlib.util.spec_from_file_location('sync_worker', pathlib.Path(__file__).with_name('sync-worker.py'))
MODULE=importlib.util.module_from_spec(SPEC);SPEC.loader.exec_module(MODULE)

class PublicationGuards(unittest.TestCase):
    def worker(self):
        temp=tempfile.TemporaryDirectory();self.addCleanup(temp.cleanup)
        return MODULE.Worker({'gh':'unused','node':'unused','codex':'unused','translator':'unused'},pathlib.Path(temp.name))
    def pending_worker(self):
        worker=self.worker();worker.state['pending']={'pr':7,'headSha':'expected','sourceSha':'source'}
        return worker
    def test_allowlist_never_writes_source_code_secrets_or_traversal(self):
        for path in ['src/content/en/posts/a.md', 'src/content/en/topics/nested/a.md',MODULE.MANIFEST]:self.assertTrue(MODULE.allowed_path(path))
        for path in ['src/content/posts/a.md','.github/workflows/run.yml','src/content/en/posts/../../x.md','/tmp/secret','src/content/en/posts/x.mdx','src/content/en/posts/x\\a.md']:
            self.assertFalse(MODULE.allowed_path(path),path)
    def test_missing_ci_never_merges(self):
        worker=self.pending_worker()
        def api(endpoint,*args):
            if endpoint=='commits/main':return {'sha':'source'}
            if endpoint=='pulls/7':return {'state':'open','merged':False,'base':{'ref':'main','sha':'source','repo':{'full_name':'Yuki-zik/myblog'}},'head':{'sha':'expected'}}
            if 'check-runs' in endpoint:return {'check_runs':[]}
            raise AssertionError(endpoint)
        worker.api=api;worker.gh_command=lambda *args,**kwargs:self.fail('must not merge')
        self.assertTrue(worker.pending('source'));self.assertEqual(worker.state['status'],'awaiting-ci')
    def test_manual_head_change_blocks_automatic_merge(self):
        worker=self.pending_worker();worker.api=lambda *args:{'state':'open','merged':False,'base':{'ref':'main','sha':'source','repo':{'full_name':'Yuki-zik/myblog'}},'head':{'sha':'manual'}}
        alerts=[];worker.notify_failure=lambda *args:alerts.append(args)
        self.assertTrue(worker.pending('source'));self.assertEqual(worker.state['status'],'manual-pr-takeover');self.assertTrue(alerts)
    def test_advanced_source_requeues_without_force_push(self):
        worker=self.pending_worker();writes=[]
        def api(endpoint,payload=None,method=None):
            if payload:writes.append((endpoint,payload,method));return {}
            return {'state':'open','merged':False,'base':{'ref':'main','sha':'source','repo':{'full_name':'Yuki-zik/myblog'}},'head':{'sha':'expected'}}
        worker.api=api;self.assertFalse(worker.pending('new-source'));self.assertNotIn('pending',worker.state)
        self.assertEqual(writes,[('pulls/7',{'state':'closed'},'PATCH')])
    def test_exact_successful_ci_and_preview_required_to_merge(self):
        worker=self.pending_worker();commands=[]
        def api(endpoint,*args):
            if endpoint=='commits/main':return {'sha':'source'}
            if endpoint=='pulls/7':return {'state':'open','merged':False,'base':{'ref':'main','sha':'source','repo':{'full_name':'Yuki-zik/myblog'}},'head':{'sha':'expected'}}
            if 'check-runs' in endpoint:return {'check_runs':[{'id':i,'name':name,'conclusion':'success','app':{'slug':'github-actions'}} for i,name in enumerate(MODULE.REQUIRED_CHECKS)]}
            if endpoint.endswith('/status'):return {'statuses':[{'context':'Vercel – myblog','state':'success'}]}
            if '/files?' in endpoint:return [{'filename':MODULE.MANIFEST}]
            raise AssertionError(endpoint)
        worker.api=api;worker.gh_command=lambda args,**kw:commands.append(args)
        self.assertTrue(worker.pending('source'));self.assertEqual(commands[0][-2:],['--match-head-commit','expected'])
    def test_unexpected_file_blocks_otherwise_successful_merge(self):
        worker=self.pending_worker();alerts=[]
        def api(endpoint,*args):
            if endpoint=='commits/main':return {'sha':'source'}
            if endpoint=='pulls/7':return {'state':'open','merged':False,'base':{'ref':'main','sha':'source','repo':{'full_name':'Yuki-zik/myblog'}},'head':{'sha':'expected'}}
            if 'check-runs' in endpoint:return {'check_runs':[{'id':i,'name':name,'conclusion':'success','app':{'slug':'github-actions'}} for i,name in enumerate(MODULE.REQUIRED_CHECKS)]}
            if endpoint.endswith('/status'):return {'statuses':[{'context':'Vercel – myblog','state':'success'}]}
            if '/files?' in endpoint:return [{'filename':'.github/workflows/publish.yml'}]
            raise AssertionError(endpoint)
        worker.api=api;worker.gh_command=lambda *a,**kw:self.fail('must not merge');worker.notify_failure=lambda *a:alerts.append(a)
        self.assertTrue(worker.pending('source'));self.assertEqual(worker.state['status'],'publication-blocked')

    def test_manual_base_retarget_never_merges(self):
        worker=self.pending_worker();alerts=[]
        worker.api=lambda *args:{'state':'open','merged':False,'base':{'ref':'other','sha':'source','repo':{'full_name':'Yuki-zik/myblog'}},'head':{'sha':'expected'}}
        worker.notify_failure=lambda *args:alerts.append(args)
        worker.gh_command=lambda *args,**kwargs:self.fail('must not merge')
        self.assertTrue(worker.pending('source'));self.assertEqual(worker.state['status'],'manual-pr-retarget');self.assertTrue(alerts)

if __name__=='__main__':unittest.main()
