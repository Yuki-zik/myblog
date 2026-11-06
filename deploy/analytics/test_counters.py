import json
from pathlib import Path
import sqlite3
import tempfile
import unittest
from export_counters import export

class CounterTests(unittest.TestCase):
    def test_exports_only_article_aggregates_and_removes_expired_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);db=root/'test.sqlite3';out=root/'public'
            with sqlite3.connect(db) as con:
                con.executescript('CREATE TABLE paths(site_id,path_id,path,event);CREATE TABLE hit_counts(site_id,path_id,total);')
                con.executemany('INSERT INTO paths VALUES (1,?,?,?)',[(1,'/posts/example',0),(2,'/en/posts/example',0),(3,'bionic_on:/posts/example',1),(4,'/author',0),(5,'/posts/../private',0)])
                con.executemany('INSERT INTO hit_counts VALUES (1,?,?)',[(1,4),(1,2),(2,3),(3,99),(4,77),(5,88)])
            self.assertEqual(export(db,out),2)
            self.assertEqual(json.loads((out/'zh/example.json').read_text()),{'count':'6'})
            self.assertEqual(json.loads((out/'en/example.json').read_text()),{'count':'3'})
            self.assertEqual(sorted(str(x.relative_to(out)) for x in out.rglob('*.json')),['en/example.json','zh/example.json'])
            with sqlite3.connect(db) as con:con.execute('DELETE FROM hit_counts WHERE path_id=1')
            self.assertEqual(export(db,out),1);self.assertFalse((out/'zh/example.json').exists())
    def test_missing_source_fails_closed(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(FileNotFoundError):export(Path(tmp)/'absent',Path(tmp)/'public')

if __name__=='__main__':unittest.main()
