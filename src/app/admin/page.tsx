'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminView() {
  const [entries, setEntries] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('AKTUELL'); // AKTUELL, ARCHIV, BENUTZER
  const [passwords, setPasswords] = useState<{[key: string]: string}>({});
  const router = useRouter();

  const fetchEntries = () => {
    // Fetch all entries including archived
    fetch(`/api/entries?all=true&archived=true`).then(res => res.json()).then(data => {
      if (data.entries) setEntries(data.entries);
    });
  };

  const fetchUsers = () => {
    fetch(`/api/users`).then(res => res.json()).then(data => {
      if (data.users) setUsers(data.users);
    });
  };

  useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (!userJson) {
      router.push('/');
      return;
    }
    const u = JSON.parse(userJson);
    setUser(u);
    fetchEntries();
    fetchUsers();
  }, [router]);

  const toggleArchive = async (id: string, currentStatus: boolean) => {
    await fetch(`/api/entries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isArchived: !currentStatus })
    });
    fetchEntries();
  };

  const deleteEntry = async (id: string) => {
    if (!confirm('Eintrag wirklich löschen?')) return;
    await fetch(`/api/entries/${id}`, { method: 'DELETE' });
    fetchEntries();
  };

  const handlePasswordChange = async (targetUserId: string) => {
    const pw = passwords[targetUserId];
    if (!pw || pw.trim() === '') return alert('Bitte ein Passwort eingeben.');
    
    await fetch(`/api/users/${targetUserId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw })
    });
    alert('Passwort erfolgreich gesetzt.');
    setPasswords(prev => ({...prev, [targetUserId]: ''}));
  };

  if (!user) return null;

  const currentEntries = entries.filter(e => activeTab === 'AKTUELL' ? !e.isArchived : e.isArchived);

  return (
    <div className="container" style={{ maxWidth: '1200px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1>Admin Übersicht</h1>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/report?all=true" className="btn-primary" style={{ whiteSpace: 'nowrap' }}>Gesamten Bericht drucken (Nur Aktuelle)</Link>
          <Link href="/dashboard" className="btn-primary" style={{ backgroundColor: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Zurück zum Dashboard</Link>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <button onClick={() => setActiveTab('AKTUELL')} className="btn-primary" style={{ backgroundColor: activeTab === 'AKTUELL' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>Offene Einträge</button>
        <button onClick={() => setActiveTab('ARCHIV')} className="btn-primary" style={{ backgroundColor: activeTab === 'ARCHIV' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>Archiv</button>
        <button onClick={() => setActiveTab('BENUTZER')} className="btn-primary" style={{ backgroundColor: activeTab === 'BENUTZER' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>Benutzerverwaltung</button>
      </div>

      {(activeTab === 'AKTUELL' || activeTab === 'ARCHIV') && (
        <div className="glass-card" style={{ overflowX: 'auto' }}>
          <h2 style={{ marginBottom: '1rem' }}>{activeTab === 'AKTUELL' ? 'Offene Einträge' : 'Archivierte Einträge'}</h2>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem' }}>Nutzer</th>
                <th style={{ padding: '1rem' }}>Aktivität</th>
                <th style={{ padding: '1rem' }}>Notiz</th>
                <th style={{ padding: '1rem' }}>Start</th>
                <th style={{ padding: '1rem' }}>Ende</th>
                <th style={{ padding: '1rem' }}>Bestätigt</th>
                <th style={{ padding: '1rem' }}>Aktion</th>
              </tr>
            </thead>
            <tbody>
              {currentEntries.map(e => (
                <tr key={e.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', fontWeight: 600 }}>{e.user?.name}</td>
                  <td style={{ padding: '1rem' }}>{e.activity || '-'}</td>
                  <td style={{ padding: '1rem' }}>{e.note || '-'}</td>
                  <td style={{ padding: '1rem' }}>{new Date(e.startTime).toLocaleString('de-DE')}</td>
                  <td style={{ padding: '1rem' }}>{e.endTime ? new Date(e.endTime).toLocaleString('de-DE') : 'Aktiv...'}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ color: e.isConfirmed ? 'var(--success)' : 'var(--danger)', fontWeight: 'bold' }}>
                      {e.isConfirmed ? 'Ja' : 'Nein'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <Link href={`/dashboard/edit/${e.id}`} className="btn-primary" style={{ backgroundColor: 'var(--text-secondary)', padding: '0.5rem 1rem', textDecoration: 'none', fontSize: '0.85rem' }}>Edit</Link>
                      {e.isConfirmed && (
                        <button onClick={() => toggleArchive(e.id, e.isArchived)} className="btn-primary" style={{ backgroundColor: e.isArchived ? 'var(--accent-primary)' : 'var(--success)', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                          {e.isArchived ? 'Wiederherstellen' : 'Archivieren'}
                        </button>
                      )}
                      <button onClick={() => deleteEntry(e.id)} className="btn-primary" style={{ backgroundColor: 'var(--danger)', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Löschen</button>
                    </div>
                  </td>
                </tr>
              ))}
              {currentEntries.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '1rem', textAlign: 'center' }}>Keine Einträge vorhanden.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'BENUTZER' && (
        <div className="glass-card" style={{ overflowX: 'auto' }}>
          <h2 style={{ marginBottom: '1rem' }}>Benutzerverwaltung</h2>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem' }}>Name</th>
                <th style={{ padding: '1rem' }}>Rolle</th>
                <th style={{ padding: '1rem' }}>Neues Passwort</th>
                <th style={{ padding: '1rem' }}>Aktion</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', fontWeight: 600 }}>{u.name}</td>
                  <td style={{ padding: '1rem' }}>{u.role}</td>
                  <td style={{ padding: '1rem' }}>
                    <input 
                      type="text" 
                      className="input-field" 
                      style={{ padding: '0.4rem', fontSize: '0.9rem' }} 
                      placeholder="Passwort eingeben" 
                      value={passwords[u.id] || ''} 
                      onChange={e => setPasswords({...passwords, [u.id]: e.target.value})} 
                    />
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <button onClick={() => handlePasswordChange(u.id)} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Speichern</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
