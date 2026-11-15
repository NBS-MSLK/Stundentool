import test from 'node:test';
import assert from 'node:assert/strict';
import { shutdownExitCode } from '../scripts/shutdown-exit-code.mjs';
test('normal Next shutdown succeeds, real crashes remain failures', () => {
  for (const code of [0, 130, 143]) assert.equal(shutdownExitCode(code, null), 0);
  for (const signal of ['SIGTERM', 'SIGINT']) assert.equal(shutdownExitCode(null, signal), 0);
  for (const code of [1, 2, 137]) assert.equal(shutdownExitCode(code, null), code);
  assert.equal(shutdownExitCode(null, 'SIGKILL'), 1);
});
