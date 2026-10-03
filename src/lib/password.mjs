import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

// OWASP scrypt profile: 32 MiB, three passes. Node provides the implementation on all deployment platforms.
const N = 32768, r = 8, p = 3;
const PREFIX = '$scrypt$v1$32768$8$3$';
/** @param {string} password @param {Buffer} salt @returns {Promise<Buffer>} */
function derive(password, salt) {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 32, { N, r, p, maxmem: 64 * 1024 * 1024 }, (error, key) => error ? reject(error) : resolve(key));
  });
}
/** @param {string} password */
export async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return PREFIX + salt.toString('hex') + '$' + key.toString('hex');
}
/** @param {string} password @param {string | null | undefined} encoded */
export async function verifyPassword(password, encoded) {
  if (!encoded?.startsWith(PREFIX)) return false;
  const parts = encoded.slice(PREFIX.length).split('$');
  if (parts.length !== 2 || !/^[0-9a-f]{32}$/.test(parts[0]) || !/^[0-9a-f]{64}$/.test(parts[1])) return false;
  const expected = Buffer.from(parts[1], 'hex');
  return timingSafeEqual(await derive(password, Buffer.from(parts[0], 'hex')), expected);
}
