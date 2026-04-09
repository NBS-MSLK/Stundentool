'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ACTIVITIES } from '@/lib/activities';

export default function NewEntry() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Selection state
  const [targetUserId, setTargetUserId] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  
  // Form fields
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
  const [hours, setHours] = useState('');
  const [activity, setActivity] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (!userJson) {
      router.push('/');
      return;
    }
    const u = JSON.parse(userJson);
    setCurrentUser(u);
    setTargetUserId(u.id);

    // If user is Admin, fetch all users so they can choose
    if (u.role === 'ADMIN') {
      fetch('/api/users').then(r => r.json()).then(data => {
        if (data.users) setUsers(data.users);
      });
    }
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activity) return alert("Bitte wähle eine Aktivität aus.");
    if (!date || !hours) return alert("Datum und Stunden sind erforderlich.");
    
    setLoading(true);

    // Convert Date and Hours to Start and End times
    const startObj = new Date(`${date}T08:00:00`); // Assuming 8 AM start base
    const endObj = new Date(startObj.getTime() + parseInt(hours, 10) * 60 * 60 * 1000);

    const finalUserId = targetUserId || currentUser?.id;

    await fetch(`/api/entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userId: finalUserId, 
        startTime: startObj.toISOString(), 
        endTime: endObj.toISOString(), 
        activity,
        note
      })
    });
    router.push('/dashboard');
  };

  return (
    <div className="container">
      <div className="glass-card">
        <h1 style={{ marginBottom: '2rem' }}>Manuell Zeit nachtragen</h1>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {currentUser?.role === 'ADMIN' && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Eintragen für Nutzer:</label>
              <select value={targetUserId} onChange={e => setTargetUserId(e.target.value)} className="input-field" required>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Aktivität</label>
            <select value={activity} onChange={e => setActivity(e.target.value)} className="input-field" required>
              <option value="">-- Bitte wählen --</option>
              {Object.entries(ACTIVITIES).map(([group, acts]) => (
                <optgroup key={group} label={group}>
                  {acts.map(a => <option key={a} value={a}>{a}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Datum</label>
            <input type="date" className="input-field" value={date} onChange={e => setDate(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Stunden (Jede angefangene Std. = 1 Std., z.B. 1, 2, 3)</label>
            <input type="number" step="1" min="1" className="input-field" placeholder="z. B. 2" value={hours} onChange={e => setHours(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Kurze Notiz (optional)</label>
            <textarea className="input-field" rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="Z. B. Besonderheiten..." />
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="submit" className="btn-primary" disabled={loading || !activity}>Eintragen</button>
            <button type="button" onClick={() => router.push('/dashboard')} className="btn-primary" style={{ backgroundColor: 'var(--text-secondary)' }}>Abbrechen</button>
          </div>
        </form>
      </div>
    </div>
  );
}
