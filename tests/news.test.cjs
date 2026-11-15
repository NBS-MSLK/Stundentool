const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
for (const extension of ['.ts', '.tsx']) require.extensions[extension] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, filename);
const { validNewsImage } = require('../src/lib/news-image.ts');
const LinkedText = require('../src/app/components/LinkedText.tsx').default;
const { renderToStaticMarkup } = require('react-dom/server');
const React = require('react');
test('news image validation rejects active content, mismatched formats and oversized uploads', () => {
  assert.equal(validNewsImage('https://example.com/photo.png'), true);
  assert.equal(validNewsImage('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7WQAAAAASUVORK5CYII='), true);
  for (const value of ['javascript:alert(1)', 'data:image/svg+xml;base64,PHN2Zz4=', 'data:image/png;base64,aGVsbG8=', 'data:image/png;base64,' + Buffer.alloc(2 * 1024 * 1024 + 1).toString('base64')]) assert.equal(validNewsImage(value), false);
});
test('news links preserve full targets in shortened text and escape markup', () => {
  const html = renderToStaticMarkup(React.createElement(LinkedText, { text: 'Hier https://example.com/very/long/path', limit: 22 }));
  assert.match(html, /href="https:\/\/example.com\/very\/long\/path"/);
  const punctuation = renderToStaticMarkup(React.createElement(LinkedText, { text: '(www.example.com). <script>alert(1)</script> javascript:alert(1)' }));
  assert.match(punctuation, /href="https:\/\/www.example.com"/);
  assert.ok(!punctuation.includes('<script>'));
  assert.ok(!punctuation.includes('href="javascript:'));
});


test('expanded news renders the forum URL from the reported message as a link', () => {
  const url = 'https://stundentool-production.up.railway.app/dashboard/forum';
  const text = 'Am Donnerstag den 3. Dezember findet im MakerSpace um 19h die nächste Mitgliederversammlung statt.\n\nDie Tagesordnung und einen Ort für weitere Themenvorschläge findet ihr hier:\n' + url;
  const html = renderToStaticMarkup(React.createElement(LinkedText, { text }));
  assert.ok(html.includes('href="' + url + '"'));
  assert.ok(html.includes('>' + url + '</a>'));
});
