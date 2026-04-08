'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminView() {
  const [entries, setEntries] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (!userJson) {
      router.push('/');
      return;
    }
    const u = JSON.parse(userJson);
    setUser(u);
    
    fetch(`/api/entries?all=true`).then(res => res.json()).then(data => {
      if (data.entries) setEntries(data.entries);
    });
  }, [router]);

  if (!user) return null;

  return (
    <div className="container" style={{ maxWidth: '1000px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Admin Übersicht</h1>
        <div>
          <Link href="/report?all=true" className="btn-primary" style={{ marginRight: '1rem' }}>Gesamten Bericht drucken</Link>
          <Link href="/dashboard" className="btn-primary" style={{ backgroundColor: 'var(--text-secondary)' }}>Zurück zum Dashboard</Link>
        </div>
      </div>

      <div className="glass-card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '1rem' }}>Nutzer</th>
              <th style={{ padding: '1rem' }}>Aktivität</th>
              <th style={{ padding: '1rem' }}>Start</th>
              <th style={{ padding: '1rem' }}>Ende</th>
              <th style={{ padding: '1rem' }}>Bestätigt</th>
              <th style={{ padding: '1rem' }}>Aktion</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(e => (
              <tr key={e.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem', fontWeight: 600 }}>{e.user?.name}</td>
                <td style={{ padding: '1rem' }}>{e.activity || '-'}</td>
                <td style={{ padding: '1rem' }}>{new Date(e.startTime).toLocaleString('de-DE')}</td>
                <td style={{ padding: '1rem' }}>{e.endTime ? new Date(e.endTime).toLocaleString('de-DE') : 'Aktiv...'}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ color: e.isConfirmed ? 'var(--success)' : 'var(--danger)', fontWeight: 'bold' }}>
                    {e.isConfirmed ? 'Ja' : 'Nein'}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link href={`/dashboard/edit/${e.id}`} className="btn-primary" style={{ backgroundColor: 'var(--text-secondary)', padding: '0.5rem 1rem', textDecoration: 'none' }}>Bearbeiten</Link>
                    <button onClick={async () => {
                      await fetch(`/api/entries/${e.id}`, { method: 'DELETE' });
                      fetch(`/api/entries?all=true`).then(res => res.json()).then(data => setEntries(data.entries));
                    }} className="btn-primary" style={{ backgroundColor: 'var(--danger)', padding: '0.5rem 1rem' }}>Löschen</button>
                  </div>
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '1rem', textAlign: 'center' }}>Keine Zeiten erfasst.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
