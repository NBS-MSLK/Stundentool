'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type Topic = { id: string; title: string; lastActivityAt: string; authorName: string; activity: string; commentId: string | null };

export default function RecentForum() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/forum?recent=true', { cache: 'no-store', signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error();
        const data = await response.json();
        if (!controller.signal.aborted) setTopics(data.topics);
      })
      .catch(() => { if (!controller.signal.aborted) setError(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [attempt]);

  return <section className="glass-card maker-recent-forum" aria-labelledby="recent-forum-heading">
    <span className="maker-eyebrow">Im Gespräch</span>
    <h2 id="recent-forum-heading">Neues im Forum</h2>
    {loading ? <p className="maker-forum-hint" role="status">Beiträge werden geladen …</p> : error ? <p className="maker-forum-hint" role="alert">Das Forum konnte nicht geladen werden. <button onClick={() => { setError(false); setLoading(true); setAttempt(value => value + 1); }}>Erneut versuchen</button></p> : topics.length ?
      <ul className="maker-forum-list">{topics.map(topic => <li key={topic.id}>
        <Link href={'/dashboard/forum/' + topic.id + (topic.commentId ? '#beitrag-' + topic.commentId : '')}>
          <strong>{topic.title}<span aria-hidden="true"> ↗</span></strong>
          <span className="maker-forum-author">{topic.activity} · {topic.authorName}</span>
          <time dateTime={topic.lastActivityAt}>{new Date(topic.lastActivityAt).toLocaleString('de-DE', { timeZone: 'Europe/Berlin', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</time>
        </Link>
      </li>)}</ul> : <p className="maker-forum-hint">Noch keine Themen. Hier erscheinen die neuesten Gespräche.</p>}
    <Link href="/dashboard/forum" className="maker-forum-all">Zum Forum →</Link>
  </section>;
}
