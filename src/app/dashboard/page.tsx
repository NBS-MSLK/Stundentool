'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ACTIVITIES } from '@/lib/activities';
import confetti from 'canvas-confetti';
import TaskManager from './components/TaskManager';
import Webheimat from './components/Webheimat';
import EquipmentSection from './components/EquipmentSection';

type User = { id: string, name: string, role: string };
type TimeEntry = { 
  id: string, 
  startTime: string, 
  endTime: string | null, 
  isConfirmed: boolean, 
  isManualEntry: boolean, 
  activity: string | null, 
  note?: string | null, 
  isArchived?: boolean,
  isSubmitted?: boolean 
};

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ systemActiveHours: 0, systemArchivedHours: 0, hardcodedBaseHours: 619, totalGoalHours: 2700 });
  const [selectedActivity, setSelectedActivity] = useState('');
  const [activeTab, setActiveTab] = useState<'WEBHEIMAT' | 'STUNDEN' | 'TASKS' | 'EQUIPMENT'>('WEBHEIMAT');
  
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

    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'EQUIPMENT' || tab === 'TASKS' || tab === 'STUNDEN' || tab === 'WEBHEIMAT') {
      setActiveTab(tab);
    }
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
      setError('Daten konnten nicht geladen werden. Bitte lade die Seite erneut.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeEntry) {
      const updateElapsed = () => {
        const start = new Date(activeEntry.startTime).getTime();
        const now = new Date().getTime();
        const diff = Math.max(0, now - start);
        
        const h = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
        const m = Math.floor((diff / (1000 * 60)) % 60).toString().padStart(2, '0');
        const s = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');
        setElapsedString(`${h}:${m}:${s}`);
      };
      updateElapsed();
      interval = setInterval(updateElapsed, 1000);
    } else {
      setElapsedString('00:00:00');
    }
    return () => clearInterval(interval);
  }, [activeEntry]);

  const handleStart = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/entries/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, activity: selectedActivity })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Timer konnte nicht gestartet werden.'); return; }
      if (data.entry) setActiveEntry(data.entry);
    } catch { setError('Timer konnte nicht gestartet werden. Bitte erneut versuchen.'); } finally {
      setSaving(false);
    }
  };

  const handleStop = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/entries/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Timer konnte nicht gestoppt werden.');
        return;
      }
      if (data.entry) {
        setActiveEntry(null);
        fetchData(user!.id);
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      }
    } catch { setError('Timer konnte nicht gestoppt werden. Bitte erneut versuchen.'); } finally {
      setSaving(false);
    }
  };
  const handleConfirm = async (id: string) => {
    const response = await fetch(`/api/entries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isConfirmed: true })
    });
    if (!response.ok) {
      const data = await response.json();
      alert(data.error || 'Eintrag konnte nicht bestätigt werden.');
      return;
    }
    fetchData(user!.id);
  };
  
  const handleToggleSubmitted = async (id: string, current: boolean) => {
    const response = await fetch(`/api/entries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isSubmitted: !current })
    });
    if (!response.ok) { setError('Eintrag konnte nicht aktualisiert werden.'); return; }
    fetchData(user!.id);
  };

  if (!user || loading) return <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>Lade...</div>;

  const totalHours = entries.reduce((sum, entry) => sum + Math.max(1, Math.ceil((new Date(entry.endTime!).getTime() - new Date(entry.startTime).getTime()) / 3600000)), 0);
  const monthHours = entries.filter(entry => { const date = new Date(entry.startTime); const now = new Date(); return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear(); }).reduce((sum, entry) => sum + Math.max(1, Math.ceil((new Date(entry.endTime!).getTime() - new Date(entry.startTime).getTime()) / 3600000)), 0);
  const tabs = [{id: 'WEBHEIMAT', label: 'Übersicht', icon: 'grid'}, {id: 'STUNDEN', label: 'Meine Stunden', icon: 'clock'}, {id: 'TASKS', label: 'Aufgaben', icon: 'tasks'}, {id: 'EQUIPMENT', label: 'Ausstattung', icon: 'box'}] as const;
  const currentLabel = tabs.find(tab => tab.id === activeTab)!.label;
  const projectHours = stats.hardcodedBaseHours + stats.systemActiveHours;
  const percentage = stats.totalGoalHours > 0 ? Math.min(100, Math.max(0, projectHours / stats.totalGoalHours * 100)) : 0;
  return (
    <div className="maker-shell">
      <aside className="maker-sidebar">
        <Link href="/dashboard" aria-label="MakerSpace Übersicht"><Image src="/brand/makerspace.png" alt="MakerSpace Lübbecke e. V." className="maker-logo" width={938} height={530} sizes="(max-width: 650px) 135px, 196px" /></Link>
        <span className="maker-eyebrow sidebar-caption">Dein Makerspace</span>
        <nav className="maker-navigation" aria-label="Hauptnavigation">{tabs.map(tab => <button key={tab.id} className={activeTab === tab.id ? 'maker-nav active' : 'maker-nav'} aria-current={activeTab === tab.id ? 'page' : undefined} onClick={() => { setActiveTab(tab.id); window.history.replaceState(null, '', '/dashboard?tab=' + tab.id); }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">{tab.icon === 'grid' ? <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></> : tab.icon === 'clock' ? <><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></> : tab.icon === 'tasks' ? <><rect x="4" y="3" width="16" height="18" rx="3"/><path d="m8 12 3 3 5-6"/></> : <path d="m12 3 9 5v9l-9 5-9-5V8zm0 10v9M3 8l9 5 9-5M8 5l9 5"/>}</svg>{tab.label}</button>)}</nav>
        <div className="maker-sidebar-note"><span className="maker-eyebrow">Zusammen machen</span><strong>Jede Stunde zählt.</strong><p>Dein Einsatz bringt unsere Werkstatt ein Stück weiter.</p></div>
        <div className="maker-profile"><span className="maker-avatar">{user.name.split(' ').map(part => part[0]).slice(0,2).join('')}</span><div><strong>{user.name}</strong><p>{user.role === 'ADMIN' ? 'Administrator' : 'Mitglied'}</p></div></div>
      </aside>
      <main className="maker-main">
        <header className="maker-top"><span className="maker-eyebrow">MakerSpace Lübbecke / {currentLabel}</span><div className="maker-account">{user.role === 'ADMIN' && <Link href="/admin">Admin</Link>}<Link href="/dashboard/password">Einstellungen</Link><button onClick={async () => { const response = await fetch('/api/auth', { method: 'DELETE' }); if (!response.ok) { setError('Abmeldung fehlgeschlagen.'); return; } localStorage.removeItem('user'); router.replace('/'); }}>Abmelden</button></div></header>
        <div className="maker-greeting"><div><h1>{activeTab === 'WEBHEIMAT' ? 'Moin ' + user.name.split(' ')[0] + '. Zeit, was zu machen.' : currentLabel}</h1><p>{activeTab === 'WEBHEIMAT' ? 'Deine Werkstatt, dein Beitrag, unser gemeinsames Projekt.' : activeTab === 'TASKS' ? 'Finde eine Aufgabe, die zu dir passt.' : activeTab === 'EQUIPMENT' ? 'Gestalte mit, was unsere Werkstatt möglich macht.' : 'Dein Einsatz macht den Unterschied.'}</p></div><Link href="/dashboard/new" className="maker-button secondary">＋ Stunden nachtragen</Link></div>
        {error && <div role="alert" className="maker-error">{error}</div>}
        <div className="maker-hero-grid">
          <section className="maker-timer" aria-label="Zeiterfassung"><div className="maker-timer-heading"><span className="maker-eyebrow">Deine Zeiterfassung</span><span>{activeEntry ? '● Dein Timer läuft' : '● Bereit für deinen Einsatz'}</span></div><div className="maker-clock">{elapsedString}</div><div className="maker-timer-controls">{activeEntry ? <><span className="maker-running-activity">{activeEntry.activity || 'Aktiver Einsatz'}</span><button onClick={handleStop} className="maker-button" disabled={saving}>{saving ? 'Wird gespeichert …' : '■ Zeit stoppen'}</button></> : <><select value={selectedActivity} onChange={e => setSelectedActivity(e.target.value)} aria-label="Tätigkeit" disabled={saving}><option value="">Tätigkeit auswählen …</option>{Object.entries(ACTIVITIES).map(([group, acts]) => <optgroup key={group} label={group}>{acts.map(a => <option key={a} value={a}>{a}</option>)}</optgroup>)}</select><button onClick={handleStart} className="maker-button" disabled={!selectedActivity || saving}>{saving ? 'Startet …' : '▶ Zeit starten'}</button></>}</div><p>{activeEntry ? 'Läuft weiter, während du dich im Makerspace umschaust.' : 'Tätigkeit auswählen und loslegen. Schön, dass du dabei bist.'}</p></section>
          <section className="maker-community"><div className="maker-community-art"/><div className="maker-community-body"><span className="maker-eyebrow">Unser gemeinsames Ziel</span><h2>Aus Ideen wird Werkstatt.</h2><p>Wir packen zusammen an – Stunde für Stunde.</p><div className="maker-progress" role="progressbar" aria-label="Gemeinsames Stundenziel" aria-valuenow={Math.round(percentage)} aria-valuemin={0} aria-valuemax={100}><span style={{width: percentage + '%'}}/></div><div className="maker-progress-label"><strong>{projectHours.toLocaleString('de-DE')} / {stats.totalGoalHours.toLocaleString('de-DE')} Stunden</strong><span>{Math.round(percentage)} % geschafft</span></div></div></section>
        </div>
        <section className="maker-metrics" aria-label="Deine Stunden"><div><span className="maker-eyebrow">Dein Beitrag</span><strong>{totalHours.toLocaleString('de-DE')} <small>h</small></strong><p>Insgesamt mit angepackt</p></div><div><span className="maker-eyebrow">Diesen Monat</span><strong>{monthHours.toLocaleString('de-DE')} <small>h</small></strong><p>Danke für deinen Einsatz!</p></div><Link href="/dashboard/highscore"><span className="maker-eyebrow">Zusammen machen</span><strong>Trophäen <small>↗</small></strong><p>Unsere gemeinsamen Erfolge</p></Link></section>
        {activeTab === 'WEBHEIMAT' ? <Webheimat user={user} stats={stats} /> : activeTab === 'TASKS' ? <TaskManager user={user} /> : activeTab === 'EQUIPMENT' ? <EquipmentSection user={user} /> : <>
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
          
          if (entry.endTime) {
            const startD = new Date(entry.startTime);
            const endD = new Date(entry.endTime);
            const diffMs = endD.getTime() - startD.getTime();
            let hours = Math.ceil(diffMs / (1000 * 60 * 60));
            if (hours < 1) hours = 1;
            
            const dateStr = startD.toLocaleDateString('de-DE');
            displayText = `${dateStr} (${hours} ${hours === 1 ? 'Stunde' : 'Stunden'}) ${entry.activity ? `(${entry.activity})` : ''}`;
          } else {
            const startStr = new Date(entry.startTime).toLocaleDateString('de-DE');
            displayText = `${startStr} - Läuft gerade... ${entry.activity ? `(${entry.activity})` : ''}`;
          }
          
          
          const diffMs = entry.endTime ? new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime() : 0;
          const hoursCount = Math.ceil(diffMs / (1000 * 60 * 60));
          const isTooLong = hoursCount > 10;
          
          return (
            <div key={entry.id} className="glass-card" style={{ padding: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', borderLeft: entry.isConfirmed ? '4px solid var(--success)' : '4px solid var(--danger)', opacity: entry.isSubmitted ? 0.8 : 1 }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {displayText}
                  {isTooLong && (
                    <span style={{ backgroundColor: 'var(--danger)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                      {">"} 10h! Bitte korrigieren
                    </span>
                  )}
                  {entry.isSubmitted && (
                    <span style={{ backgroundColor: 'var(--success)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                      ✓ Unterschrieben dem Vorstand gegeben
                    </span>
                  )}
                </div>
                {entry.note ? <div style={{ fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--text-secondary)', margin: '0.2rem 0' }}>Notiz: {entry.note}</div> : null}
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {entry.isConfirmed ? 'Bestätigt' : 'Ausstehend - Bitte überprüfen'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {!entry.isSubmitted ? (
                  <>
                    <Link href={`/dashboard/edit/${entry.id}`} style={{ textDecoration: 'none', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)', fontWeight: 600, backgroundColor: 'var(--text-secondary)', color: 'white' }}>Bearbeiten</Link>
                    {entry.isConfirmed ? (
                      <button className="btn-primary" onClick={() => handleToggleSubmitted(entry.id, !!entry.isSubmitted)} style={{ backgroundColor: 'var(--accent-primary)' }}>Unterschrieben dem Vorstand gegeben</button>
                    ) : (
                      <button className="btn-primary" onClick={() => handleConfirm(entry.id)}>Bestätigen</button>
                    )}
                  </>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>Unterschrieben dem Vorstand gegeben</div>
                    <button 
                      className="btn-primary" 
                      onClick={() => handleToggleSubmitted(entry.id, !!entry.isSubmitted)} 
                      style={{ backgroundColor: 'var(--text-secondary)', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                    >
                      Rückgängig
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {entries.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>Noch keine Einträge vorhanden.</p>}
      </div>
      </>
      }
      <footer className="maker-footer">Mit Herz und Händen. MakerSpace Lübbecke e. V.</footer>
      </main>
    </div>
  );
}
