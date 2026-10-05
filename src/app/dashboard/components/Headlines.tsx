'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Headline = { id: string; content: string };

export default function Headlines() {
  const [headlines, setHeadlines] = useState<Headline[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/headlines', { cache: 'no-store' })
      .then(async response => { if (!response.ok) return; const data = await response.json(); if (!cancelled) setHeadlines((data.headlines || []).slice(0, 3)); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (!headlines.length) return null;

  return (
    <section className="maker-headlines" aria-label="Aktuelle Kurzmeldungen">
      <span className="maker-headline-label">Aktuell</span>
      <p>{headlines[index]?.content}</p>
      {headlines.length > 1 && <div className="maker-headline-controls">
        <button aria-label="Vorherige Kurzmeldung" onClick={() => setIndex((index + headlines.length - 1) % headlines.length)}>‹</button>
        <span>{index + 1} / {headlines.length}</span>
        <button aria-label="Nächste Kurzmeldung" onClick={() => setIndex((index + 1) % headlines.length)}>›</button>
      </div>}
      <Link href="/dashboard/headlines">Alle anzeigen ↗</Link>
    </section>
  );
}
