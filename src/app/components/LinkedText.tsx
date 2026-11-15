import { Fragment } from 'react';

export default function LinkedText({ text, limit = text.length }: { text: string; limit?: number }) {
  const parts = [];
  let cursor = 0;
  for (const match of text.matchAll(/\b(?:https?:\/\/|www\.)[^\s<>"']+/gi)) {
    const start = match.index!;
    if (start >= limit) break;
    parts.push(text.slice(cursor, Math.min(start, limit)));
    let url = match[0].replace(/[.,!?;:]+$/, '');
    while (url.endsWith(')') && (url.match(/\)/g)?.length ?? 0) > (url.match(/\(/g)?.length ?? 0)) url = url.slice(0, -1);
    const href = /^www\./i.test(url) ? `https://${url}` : url;
    const label = url.slice(0, limit - start);
    try {
      new URL(href);
      parts.push(<a href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', overflowWrap: 'anywhere' }}>{label}</a>);
    } catch { parts.push(label); }
    cursor = start + url.length;
  }
  parts.push(text.slice(cursor, limit));
  return <>{parts.map((part, index) => <Fragment key={index}>{part}</Fragment>)}{text.length > limit && '...'}</>;
}
