#!/usr/bin/env python3
import hashlib, json, os, sqlite3, sys
path = os.environ.get('DATABASE_URL', '')
if not path.startswith('file:'):
    raise SystemExit('DATABASE_TARGET_INVALID: DATABASE_URL must be file: URL')
db_path = path[5:]
required = ['User','OtpCode','Room','GameHistory','SiteSetting','Notification','Tournament','TournamentPlayer','TournamentMatch']
con = sqlite3.connect(f'file:{db_path}?mode=ro', uri=True)
try:
    integrity = con.execute('PRAGMA integrity_check').fetchone()[0]
    version = con.execute('PRAGMA user_version').fetchone()[0]
    tables = {row[0] for row in con.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")}
    missing = [name for name in required if name not in tables]
finally:
    con.close()
with open(db_path, 'rb') as stream:
    digest = hashlib.sha256(stream.read()).hexdigest()
result = {'gate':'DATABASE_CONTRACT','databaseTarget':db_path,'integrity':integrity,'userVersion':version,'requiredTables':required,'missingTables':missing,'sha256':digest,'result':'PASS' if integrity == 'ok' and not missing else 'FAIL','nextSafeAction':'continue to runtime readiness' if not missing else 'initialize the exact runtime schema target'}
print(json.dumps(result, indent=2, sort_keys=True))
if result['result'] != 'PASS': sys.exit(1)
