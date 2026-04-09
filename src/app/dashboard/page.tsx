'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ACTIVITIES } from '@/lib/activities';
import confetti from 'canvas-confetti';

type User = { id: string, name: string, role: string };
type TimeEntry = { id: string, startTime: string, endTime: string | null, isConfirmed: boolean, isManualEntry: boolean, activity: string | null, note?: string | null, isArchived?: boolean };

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ systemActiveHours: 0, systemArchivedHours: 0, hardcodedBaseHours: 619, totalGoalHours: 2700 });
  const [selectedActivity, setSelectedActivity] = useState('');
  
  const [elapsedString, setElapsedString] = useState('00:00:00');

  const router = useRouter();

  useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (!userJson) {
      router.push('/');
      return;
    }
    const u = JSON.parse(userJson);
    setUser(u);
    fetchData(u.id);
  }, [router]);

  const fetchData = async (userId: string) => {
    try {
      const res = await fetch(`/api/entries?userId=${userId}`);
      const data = await res.json();
      if (data.entries) {
        setEntries(data.entries.filter((e: TimeEntry) => e.endTime !== null));
        const active = data.entries.find((e: TimeEntry) => e.endTime === null);
        setActiveEntry(active || null);
      }
      
      const statsRes = await fetch('/api/stats');
      const statsData = await statsRes.json();
      if (!statsData.error) {
        setStats(statsData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeEntry) {
      interval = setInterval(() => {
        const start = new Date(activeEntry.startTime).getTime();
        const now = new Date().getTime();
        const diff = now - start;
        
        const h = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
        const m = Math.floor((diff / (1000 * 60)) % 60).toString().padStart(2, '0');
        const s = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');
        setElapsedString(`${h}:${m}:${s}`);
      }, 1000);
    } else {
      setElapsedString('00:00:00');
    }
    return () => clearInterval(interval);
  }, [activeEntry]);

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/entries/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, activity: selectedActivity })
      });
      const data = await res.json();
      if (data.entry) setActiveEntry(data.entry);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/entries/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id })
      });
      const data = await res.json();
      if (data.entry) {
        setActiveEntry(null);
        fetchData(user!.id);
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id: string) => {
    await fetch(`/api/entries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isConfirmed: true })
    });
    fetchData(user!.id);
  };

  if (!user || loading) return <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>Lade...</div>;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Hallo, {user.name}</h1>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {user?.role === 'ADMIN' && (
            <Link href="/admin" className="btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem', backgroundColor: '#8a2be2' }}>Admin</Link>
          )}
          <Link href="/dashboard/password" className="btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem', backgroundColor: 'var(--accent-primary)' }}>Einstellungen</Link>
          <button onClick={() => { localStorage.removeItem('user'); router.push('/'); }} className="btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem', backgroundColor: 'var(--text-secondary)' }}>Logout</button>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 600 }}>
          <span>Projekt-Fortschritt</span>
          <span>{stats.hardcodedBaseHours + stats.systemArchivedHours + stats.systemActiveHours} / {stats.totalGoalHours} Stunden</span>
        </div>
        <div style={{ width: '100%', backgroundColor: 'var(--bg-secondary)', height: '1.5rem', borderRadius: 'var(--radius-full)', overflow: 'hidden', display: 'flex' }}>
          <div 
            style={{ width: `${((stats.hardcodedBaseHours + stats.systemArchivedHours) / stats.totalGoalHours) * 100}%`, backgroundColor: 'var(--success)', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem', fontWeight: 'bold', transition: 'width 0.5s ease-in-out' }} 
            title="Eingereicht / Archiviert"
          >
            {((stats.hardcodedBaseHours + stats.systemArchivedHours) / stats.totalGoalHours) * 100 > 5 && `${stats.hardcodedBaseHours + stats.systemArchivedHours}h`}
          </div>
          <div 
            style={{ width: `${(stats.systemActiveHours / stats.totalGoalHours) * 100}%`, backgroundColor: 'var(--accent-primary)', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem', fontWeight: 'bold', transition: 'width 0.5s ease-in-out' }} 
            title="Offen / Neu"
          >
             {(stats.systemActiveHours / stats.totalGoalHours) * 100 > 5 && `${stats.systemActiveHours}h`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--success)' }}></div>
            Bereits eingereicht: {stats.hardcodedBaseHours + stats.systemArchivedHours}h
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)' }}></div>
            Offene Stunden: {stats.systemActiveHours}h
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ textAlign: 'center', marginBottom: '2rem', padding: '3rem 1rem' }}>
        <div style={{ fontSize: '3.5rem', fontWeight: 'bold', marginBottom: '2rem', fontVariantNumeric: 'tabular-nums', letterSpacing: '2px' }}>
          {elapsedString}
        </div>
        
        {!activeEntry ? (
          <>
            <select value={selectedActivity} onChange={e => setSelectedActivity(e.target.value)} className="input-field" style={{ marginBottom: '1rem', maxWidth: '400px', display: 'inline-block' }}>
              <option value="">-- Bitte Aktivität wählen --</option>
              {Object.entries(ACTIVITIES).map(([group, acts]) => (
                <optgroup key={group} label={group}>
                  {acts.map(a => <option key={a} value={a}>{a}</option>)}
                </optgroup>
              ))}
            </select>
            <br />
            <button onClick={handleStart} className="btn-success" disabled={!selectedActivity}>START</button>
          </>
        ) : (
          <div>
            <div style={{ marginBottom: '1rem', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Aktivität: {activeEntry.activity || 'Keine'}</div>
            <button onClick={handleStop} className="btn-danger">STOP</button>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, whiteSpace: 'nowrap' }}>Letzte Einträge</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/dashboard/highscore" className="btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem', backgroundColor: '#ffd700', color: 'black' }}>Trophäen / Highscore</Link>
          <Link href="/dashboard/new" className="btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}>Nachtragen</Link>
          <Link href="/report" style={{ color: 'var(--accent-primary)', fontWeight: 500, whiteSpace: 'nowrap' }}>Zur Druckansicht</Link>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {entries.map(entry => {
          let displayText = '';
          
          if (entry.isManualEntry && entry.endTime) {
            const startD = new Date(entry.startTime);
            const endD = new Date(entry.endTime);
            const diffMs = endD.getTime() - startD.getTime();
            let hours = Math.ceil(diffMs / (1000 * 60 * 60));
            if (hours < 1) hours = 1;
            
            const dateStr = startD.toLocaleDateString('de-DE');
            displayText = `${dateStr} (${hours} Stunden) ${entry.activity ? `(${entry.activity})` : ''}`;
          } else {
            const startStr = new Date(entry.startTime).toLocaleString('de-DE');
            const endStr = entry.endTime ? new Date(entry.endTime).toLocaleString('de-DE') : 'Aktiv';
            displayText = `${startStr} - ${endStr} ${entry.activity ? `(${entry.activity})` : ''}`;
          }
          
          return (
            <div key={entry.id} className="glass-card" style={{ padding: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', borderLeft: entry.isConfirmed ? '4px solid var(--success)' : '4px solid var(--danger)' }}>
              <div>
                <div style={{ fontWeight: 500 }}>{displayText}</div>
                {entry.note ? <div style={{ fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--text-secondary)', margin: '0.2rem 0' }}>Notiz: {entry.note}</div> : null}
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {entry.isConfirmed ? 'Bestätigt' : 'Ausstehend - Bitte überprüfen'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Link href={`/dashboard/edit/${entry.id}`} style={{ textDecoration: 'none', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)', fontWeight: 600, backgroundColor: 'var(--text-secondary)', color: 'white' }}>Bearbeiten</Link>
                {!entry.isConfirmed && (
                  <button className="btn-primary" onClick={() => handleConfirm(entry.id)}>Bestätigen</button>
                )}
              </div>
            </div>
          );
        })}
        {entries.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>Noch keine Einträge vorhanden.</p>}
      </div>
    </div>
  );
}
