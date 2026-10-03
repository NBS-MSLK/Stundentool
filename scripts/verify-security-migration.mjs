import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { verifyPassword } from '../src/lib/password.mjs';

const source = process.argv[2];
if (!source) throw new Error('Usage: node scripts/verify-security-migration.mjs <backup.sqlite>');
const target = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'stundentool-upgrade-')), 'copy.sqlite');
fs.copyFileSync(source, target, fs.constants.COPYFILE_EXCL);
function snapshot() {
  const db = new DatabaseSync(target, { readOnly: true });
  const hashes = {}, counts = {};
  for (const { name } of db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name <> 'Session'").all()) {
    const quote = value => '"' + value.replaceAll('"', '""') + '"';
    const columns = db.prepare('PRAGMA table_info(' + quote(name) + ')').all().map(c => c.name).filter(c => name !== 'User' || !['password', 'passwordHash'].includes(c));
    const rows = db.prepare('SELECT ' + columns.map(quote).join(',') + ' FROM ' + quote(name) + ' ORDER BY rowid').all();
    hashes[name] = createHash('sha256').update(JSON.stringify(rows)).digest('hex');
    counts[name] = rows.length;
  }
  db.close();
  return { hashes, counts };
}
const original = new DatabaseSync(target, { readOnly: true });
const credentials = original.prepare('SELECT id, password FROM User').all();
original.close();
const before = snapshot();
const env = { ...process.env, DATABASE_URL: 'file:' + target.replaceAll('\\', '/') };
for (const script of ['scripts/prepare-session-table.mjs', 'scripts/migrate-passwords.mjs', 'scripts/prepare-session-table.mjs', 'scripts/migrate-passwords.mjs']) {
  const result = spawnSync(process.execPath, [script], { env, encoding: 'utf8' });
  assert.equal(result.status, 0, 'Migration failed; credentials intentionally omitted from diagnostic output.');
}
assert.deepEqual(snapshot(), before, 'Business data changed');
const upgraded = new DatabaseSync(target, { readOnly: true });
assert.equal(upgraded.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
assert.equal(upgraded.prepare('PRAGMA foreign_key_check').all().length, 0);
let verified = 0;
for (const old of credentials) {
  const current = upgraded.prepare('SELECT password, passwordHash FROM User WHERE id = ?').get(old.id);
  assert.equal(current.password, '');
  if (old.password) { assert(await verifyPassword(old.password, current.passwordHash)); verified++; }
}
upgraded.close();
console.log(JSON.stringify({ sourceSha256: createHash('sha256').update(fs.readFileSync(source)).digest('hex'), verifiedAt: new Date().toISOString(), unchangedBusinessTables: Object.keys(before.hashes).length, counts: before.counts, existingPasswordsVerified: verified, integrity: 'ok', repeatedMigration: 'ok', productionDatabaseModified: false }, null, 2));
