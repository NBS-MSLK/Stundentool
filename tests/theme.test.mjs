import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const layout = readFileSync('src/app/layout.tsx', 'utf8');
const initializer = layout.match(/__html: `([^`]+)`/)[1];
for (const [saved, system, expected] of [
  ['dark', false, 'dark'], ['light', true, 'light'],
  [null, true, 'dark'], [null, false, 'light'], ['invalid', true, 'dark'],
]) {
  test(`Initial theme: saved=${saved}, system dark=${system}`, () => {
    const document = { documentElement: { dataset: {} } };
    runInNewContext(initializer, { document, localStorage: { getItem: () => saved }, window: { matchMedia: () => ({ matches: system }) } });
    assert.equal(document.documentElement.dataset.theme, expected);
  });
}
test('Blocked storage still uses the system theme', () => {
  const document = { documentElement: { dataset: {} } };
  runInNewContext(initializer, { document, localStorage: { getItem: () => { throw Error('Blocked'); } }, window: { matchMedia: () => ({ matches: true }) } });
  assert.equal(document.documentElement.dataset.theme, 'dark');
});

const css = readFileSync('src/app/globals.css', 'utf8');
test('Theme variables do not reference themselves', () => {
  for (const match of css.matchAll(/(--[\w-]+):\s*var\((--[\w-]+)\)/g)) assert.notEqual(match[1], match[2]);
});
const dark = css.match(/html\[data-theme="dark"\] \{([\s\S]*?)\n\}/)[1];
const colors = Object.fromEntries([...dark.matchAll(/--([\w-]+): (#[\da-f]{6});/g)].map(m => [m[1], m[2]]));
function luminance(hex) {
  return hex.slice(1).match(/../g).map(x => parseInt(x, 16) / 255).map(x => x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4).reduce((sum, x, i) => sum + x * [.2126, .7152, .0722][i], 0);
}
function contrast(a, b) { const [lo, hi] = [luminance(a), luminance(b)].sort((a, b) => a - b); return (hi + .05) / (lo + .05); }
test('Dark theme text reaches 4.5:1 contrast on page, cards and hover surfaces', () => {
  for (const text of ['text-primary', 'text-secondary', 'accent-text', 'success-text', 'danger-text']) {
    for (const surface of ['bg-primary', 'bg-secondary', 'bg-hover']) assert.ok(contrast(colors[text], colors[surface]) >= 4.5, `${text} on ${surface}`);
  }
  assert.ok(contrast('#ffffff', colors['accent-primary']) >= 4.5);
});
