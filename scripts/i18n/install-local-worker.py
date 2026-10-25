#!/usr/bin/env python3
"""Install a pinned local translator. --enable starts the requested daemon.
No repository token, API key, or Codex login is copied into the installation.
"""
import argparse, hashlib, json, os, pathlib, plistlib, shutil, subprocess, sys

HERE=pathlib.Path(__file__).resolve().parent
FILES=['sync-worker.py','translate.mjs','translation-core.mjs','provider.mjs','codex-provider.mjs','glossary.json']
LABEL='com.a-znk.blog-english-sync'

def main():
    args=argparse.ArgumentParser()
    args.add_argument('--enable',action='store_true')
    args.add_argument('--disable',action='store_true')
    args.add_argument('--interval',type=int,default=300)
    options=args.parse_args()
    if sys.platform!='darwin':raise SystemExit('This installer uses macOS launchd.')
    if options.interval<300:raise SystemExit('Polling intervals below 300 seconds are not supported.')
    home=pathlib.Path.home();base=home/'Library/Application Support/A-Znk/blog-english-sync';base.mkdir(parents=True,exist_ok=True);base.chmod(0o700)
    domain=f'gui/{os.getuid()}';plist=home/'Library/LaunchAgents'/f'{LABEL}.plist'
    if options.disable:
        subprocess.run(['launchctl','bootout',domain+'/'+LABEL],capture_output=True)
        print(json.dumps({'enabled':False,'plist':str(plist)}));return
    executables={name:shutil.which(name) for name in ['node','gh','codex','pnpm','python3']}
    if not all(executables.values()):raise SystemExit('Missing executable: '+','.join(k for k,v in executables.items() if not v))
    digest=hashlib.sha256(b''.join((HERE/name).read_bytes() for name in FILES+['runtime-package.json'])).hexdigest()[:16]
    runtime=base/'runtimes'/digest;runtime.mkdir(parents=True,exist_ok=True)
    for name in FILES:shutil.copy2(HERE/name,runtime/name)
    shutil.copy2(HERE/'runtime-package.json',runtime/'package.json')
    subprocess.run([executables['pnpm'],'install','--prod','--ignore-scripts','--lockfile-only'],cwd=runtime,check=True,stdout=subprocess.DEVNULL)
    subprocess.run([executables['pnpm'],'install','--prod','--ignore-scripts','--frozen-lockfile'],cwd=runtime,check=True,stdout=subprocess.DEVNULL)
    config={'repo':'Yuki-zik/myblog','node':executables['node'],'gh':executables['gh'],'codex':executables['codex'],
        'translator':str(runtime/'translate.mjs'),'stateDir':str(base),'model':'gpt-6-astra','maxRequests':24,'maxRunsPerDay':6,'translationTimeoutSeconds':1200,'runtimeRevision':digest}
    config_path=base/'config.json';config_path.write_text(json.dumps(config,indent=2)+'\n');config_path.chmod(0o600)
    job={'Label':LABEL,'ProgramArguments':[executables['python3'],str(runtime/'sync-worker.py'),'--config',str(config_path)],
         'RunAtLoad':True,'StartInterval':options.interval,'ProcessType':'Background','WorkingDirectory':str(base),
         'EnvironmentVariables':{'HOME':str(home),'PATH':os.environ['PATH'],'LANG':'en_US.UTF-8'},
         'StandardOutPath':str(base/'worker.log'),'StandardErrorPath':str(base/'worker-error.log'),'ThrottleInterval':60}
    plist.parent.mkdir(parents=True,exist_ok=True)
    with plist.open('wb') as f:plistlib.dump(job,f)
    plist.chmod(0o600)
    if options.enable:
        subprocess.run(['launchctl','bootout',domain+'/'+LABEL],capture_output=True)
        subprocess.run(['launchctl','bootstrap',domain,str(plist)],check=True)
    print(json.dumps({'installed':True,'enabled':options.enable,'runtime':str(runtime),'config':str(config_path),'plist':str(plist),'intervalSeconds':options.interval}))

if __name__=='__main__':main()
