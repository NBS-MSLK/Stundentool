import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../src/lib/password.mjs';

test('salted password hashes preserve exact passwords and reject invalid encodings', async () => {
  const password = ' ÄÖü ß secret 🔐 ';
  const first = await hashPassword(password);
  const second = await hashPassword(password);
  assert.notEqual(first, second);
  assert(!first.includes(password));
  assert(await verifyPassword(password, first));
  assert(!(await verifyPassword(password.trim(), first)));
  assert(!(await verifyPassword('wrong', first)));
  for (const invalid of [password, '', null, '$scrypt$v1$32768$8$3$bad', first + '$extra', first.replace('32768', '999999999')]) {
    assert.equal(await verifyPassword(password, invalid), false);
  }
});
