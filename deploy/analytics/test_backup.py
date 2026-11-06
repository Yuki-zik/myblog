import os
from pathlib import Path
import sqlite3
import tempfile
import time
import unittest
from backup import backup

class BackupTests(unittest.TestCase):
    def test_consistent_restore_retention_and_permissions(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp); db=root/'live.sqlite3'; out=root/'backups'
            with sqlite3.connect(db) as con:
                con.execute('PRAGMA journal_mode=WAL');con.execute('CREATE TABLE checks (value TEXT)')
                con.execute('INSERT INTO checks VALUES (?)',('restore-evidence',));con.commit()
                first=backup(db,out)
                with sqlite3.connect(first) as restored:
                    self.assertEqual(restored.execute('PRAGMA integrity_check').fetchone()[0],'ok')
                    self.assertEqual(restored.execute('SELECT value FROM checks').fetchone()[0],'restore-evidence')
            self.assertEqual(first.stat().st_mode & 0o777,0o600)
            self.assertEqual(out.stat().st_mode & 0o777,0o700)
            old=time.time()-15*86400;os.utime(first,(old,old))
            unrelated=out/'other-user-file';unrelated.write_text('keep');os.utime(unrelated,(old,old))
            backup(db,out)
            self.assertFalse(first.exists());self.assertTrue(unrelated.exists())
            self.assertFalse(list(out.glob('*.tmp')))
    def test_missing_source_never_creates_empty_backup(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(FileNotFoundError):backup(Path(tmp)/'absent',Path(tmp)/'backups')

if __name__=='__main__':unittest.main()
