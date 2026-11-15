import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { shutdownExitCode } from './shutdown-exit-code.mjs';

const require = createRequire(import.meta.url);
let child;
let stopping = false;
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    stopping = true;
    child?.kill(signal);
  });
}
function run(file, args = [], server = false) {
  return new Promise(resolve => {
    child = spawn(process.execPath, [file, ...args], { stdio: 'inherit', env: process.env });
    child.once('error', error => { console.error(error); resolve(1); });
    child.once('exit', (code, signal) => resolve(server || stopping ? shutdownExitCode(code, signal) : (code ?? 1)));
  });
}
for (const script of ['prepare-session-table', 'migrate-passwords', 'prepare-inventory', 'prepare-tabletop', 'prepare-forum', 'prepare-events']) {
  const code = await run(fileURLToPath(new URL(`./${script}.mjs`, import.meta.url)));
  if (code !== 0 || stopping) process.exit(code);
}
process.exit(await run(require.resolve('next/dist/bin/next'), ['start', ...process.argv.slice(2)], true));
