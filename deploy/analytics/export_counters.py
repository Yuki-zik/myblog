#!/usr/bin/env python3
"""Export only public article aggregates; never export events, users or TOTAL."""
from __future__ import annotations
import argparse
import json
import os
from pathlib import Path
import re
import sqlite3
import tempfile

ARTICLE = re.compile(r'^/(en/)?posts/([a-z0-9][a-z0-9-]{0,160})$')

def export(database: Path, output: Path) -> int:
    if not database.is_file():
        raise FileNotFoundError(database)
    records=[]
    with sqlite3.connect(database.resolve().as_uri()+'?mode=ro',uri=True,timeout=10) as con:
        for path,total in con.execute('''SELECT p.path,SUM(h.total) FROM paths p
            JOIN hit_counts h ON h.site_id=p.site_id AND h.path_id=p.path_id
            WHERE p.site_id=1 AND p.event=0 GROUP BY p.path'''):
            match=ARTICLE.fullmatch(path)
            if match and isinstance(total,int) and total>=0:
                records.append((('en' if match[1] else 'zh')+'/'+match[2]+'.json',total))
    for lang in ('en','zh'):
        (output/lang).mkdir(parents=True,exist_ok=True,mode=0o755)
    expected=set()
    for relative,total in records:
        target=output/relative; expected.add(target)
        payload=json.dumps({'count':str(total)},separators=(',',':'))+'\n'
        if target.exists() and target.read_text()==payload:continue
        fd,name=tempfile.mkstemp(prefix='.counter-',dir=target.parent)
        try:
            with os.fdopen(fd,'w') as stream:stream.write(payload)
            os.chmod(name,0o644);os.replace(name,target)
        finally:
            Path(name).unlink(missing_ok=True)
    for lang in ('en','zh'):
        for stale in (output/lang).glob('*.json'):
            if stale not in expected:stale.unlink()
    return len(expected)

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--database',type=Path,default=Path('/var/lib/blog-analytics/analytics.sqlite3'))
    parser.add_argument('--output',type=Path,default=Path('/var/cache/blog-analytics/counters'))
    args=parser.parse_args();print('Public article counter files:',export(args.database,args.output))
