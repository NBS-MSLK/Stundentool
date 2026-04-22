'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import WebheimatAdmin from './components/WebheimatAdmin';

export default function AdminView() {
  const [entries, setEntries] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('WEBHEIMAT'); // WEBHEIMAT, AKTUELL, ARCHIV, BENUTZER
  const [passwords, setPasswords] = useState<{[key: string]: string}>({});
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newUserName.trim(), password: newUserPassword })
    });
    const data = await res.json();
    if (data.error) {
      alert(data.error);
    } else {
      alert('Benutzer erfolgreich angelegt.');
      setNewUserName('');
      setNewUserPassword('');
      fetchUsers();
    }
  };

  const deleteUser = async (id: string, name: string) => {
    if (!confirm(`Benutzer "${name}" wirklich löschen? ACHTUNG: Alle eingetragenen Zeiten dieses Benutzers werden ebenfalls unwiderruflich gelöscht!`)) return;
    
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
    fetchUsers();
    fetchEntries(); // Refresht die Zeiten, falls welche gelöscht wurden
  };

  if (!user) return null;

  const currentEntries = entries.filter(e => activeTab === 'AKTUELL' ? !e.isArchived : e.isArchived);

  return (
    <div className="container" style={{ maxWidth: '1200px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1>Admin Übersicht</h1>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/dashboard" className="btn-primary" style={{ backgroundColor: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Zurück zum Dashboard</Link>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button onClick={() => setActiveTab('WEBHEIMAT')} className="btn-primary" style={{ backgroundColor: activeTab === 'WEBHEIMAT' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>Webheimat</button>
        <button onClick={() => setActiveTab('AKTUELL')} className="btn-primary" style={{ backgroundColor: activeTab === 'AKTUELL' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>Offene Einträge</button>
        <button onClick={() => setActiveTab('ARCHIV')} className="btn-primary" style={{ backgroundColor: activeTab === 'ARCHIV' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>Archiv</button>
        <button onClick={() => setActiveTab('BENUTZER')} className="btn-primary" style={{ backgroundColor: activeTab === 'BENUTZER' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>Benutzerverwaltung</button>
      </div>

      {activeTab === 'WEBHEIMAT' && <WebheimatAdmin user={user} />}

      {(activeTab === 'AKTUELL' || activeTab === 'ARCHIV') && (
        <div className="glass-card" style={{ overflowX: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ margin: 0 }}>{activeTab === 'AKTUELL' ? 'Offene Einträge' : 'Archivierte Einträge'}</h2>
            <Link href="/report?all=true" className="btn-primary" style={{ whiteSpace: 'nowrap' }}>Stundenzettel drucken</Link>
          </div>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem' }}>Nutzer</th>
                <th style={{ padding: '1rem' }}>Aktivität</th>
                <th style={{ padding: '1rem' }}>Notiz</th>
                <th style={{ padding: '1rem' }}>Datum</th>
                <th style={{ padding: '1rem' }}>Stunden</th>
                <th style={{ padding: '1rem' }}>Bestätigt</th>
                <th style={{ padding: '1rem' }}>Unterschrieben & abgegeben</th>
                <th style={{ padding: '1rem' }}>Aktion</th>
              </tr>
            </thead>
            <tbody>
              {currentEntries.map(e => {
                const startTime = new Date(e.startTime);
                let startStr = startTime.toLocaleDateString('de-DE');
                let endStr = 'Aktiv...';
                
                if (e.endTime) {
                  const diffMs = new Date(e.endTime).getTime() - startTime.getTime();
                  let hs = Math.ceil(diffMs / (1000 * 60 * 60));
                  if (hs < 1) hs = 1;
                  endStr = `+ ${hs} Stunden`;
                }

                return (
                 <tr key={e.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', fontWeight: 600 }}>{e.user?.name}</td>
                  <td style={{ padding: '1rem' }}>{e.activity || '-'}</td>
                  <td style={{ padding: '1rem' }}>{e.note || '-'}</td>
                  <td style={{ padding: '1rem' }}>{startStr}</td>
                  <td style={{ padding: '1rem' }}>{endStr}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ color: e.isConfirmed ? 'var(--success)' : 'var(--danger)', fontWeight: 'bold' }}>
                      {e.isConfirmed ? 'Ja' : 'Nein'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <button 
                      onClick={async () => {
                        await fetch(`/api/entries/${e.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ isSubmitted: !e.isSubmitted })
                        });
                        fetchEntries();
                      }}
                      className="btn-primary" 
                      style={{ 
                        backgroundColor: e.isSubmitted ? 'var(--success)' : 'var(--text-secondary)', 
                        padding: '0.4rem 0.8rem', 
                        fontSize: '0.8rem',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    >
                      {e.isSubmitted ? 'Ja' : 'Nein'}
                    </button>
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
              )})}
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
          
          <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Neuen Benutzer anlegen</h3>
            <form onSubmit={handleCreateUser} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: '1', minWidth: '200px' }}>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Name</label>
                <input type="text" className="input-field" value={newUserName} onChange={e => setNewUserName(e.target.value)} required />
              </div>
              <div style={{ flex: '1', minWidth: '200px' }}>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Passwort (optional)</label>
                <input type="text" className="input-field" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} />
              </div>
              <button type="submit" className="btn-primary" style={{ padding: '0.75rem 1.5rem', height: 'fit-content' }}>Benutzer anlegen</button>
            </form>
          </div>

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
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button onClick={() => handlePasswordChange(u.id)} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Speichern</button>
                      <Link href={`/admin/add-entry/${u.id}`} className="btn-primary" style={{ backgroundColor: 'var(--text-secondary)', padding: '0.5rem 1rem', textDecoration: 'none', fontSize: '0.85rem' }}>Zeit eintragen</Link>
                      <button onClick={() => deleteUser(u.id, u.name)} className="btn-primary" style={{ backgroundColor: 'var(--danger)', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Löschen</button>
                    </div>
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
