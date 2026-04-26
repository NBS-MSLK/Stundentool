'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function HeadlinesArchive() {
  const [headlines, setHeadlines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (!userJson) {
      router.push('/');
      return;
    }

    fetch('/api/headlines')
      .then(res => res.json())
      .then(data => {
        if (data.headlines) setHeadlines(data.headlines);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [router]);

  if (loading) return <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>Lade Kurzmeldungen...</div>;

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Alle Kurzmeldungen</h1>
        <Link href="/dashboard" className="btn-primary" style={{ backgroundColor: 'var(--text-secondary)', padding: '0.4rem 1rem', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
          Zurück zum Dashboard
        </Link>
      </div>

      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {headlines.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>Keine Kurzmeldungen vorhanden.</p>
        ) : (
          headlines.map(h => (
            <div key={h.id} style={{ padding: '1.2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 500 }}>{h.content}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Von {h.author?.name} am {new Date(h.createdAt).toLocaleDateString('de-DE')} um {new Date(h.createdAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
