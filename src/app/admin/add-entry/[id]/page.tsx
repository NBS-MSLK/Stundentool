'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { ACTIVITIES } from '@/lib/activities';

export default function AddAdminEntry({ params }: { params: Promise<{ id: string }> }) {
  const { id: userId } = use(params);
  const router = useRouter();
  
  const [userName, setUserName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [hours, setHours] = useState('1');
  const [activity, setActivity] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/users/${userId}`).then(res => res.json()).then(data => {
      if (data.user) {
        setUserName(data.user.name);
      }
    });
  }, [userId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const startObj = new Date(`${date}T08:00:00`); 
    const endObj = new Date(startObj.getTime() + parseInt(hours, 10) * 60 * 60 * 1000);

    await fetch(`/api/entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userId, 
        startTime: startObj.toISOString(), 
        endTime: endObj.toISOString(), 
        activity, 
        note 
      })
    });
    router.back();
  };

  return (
    <div className="container">
      <div className="glass-card">
        <h1 style={{ marginBottom: '2rem' }}>Zeit eintragen für {userName || 'Benutzer'}</h1>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
            <input type="number" step="1" min="1" className="input-field" value={hours} onChange={e => setHours(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Kurze Notiz (optional)</label>
            <textarea className="input-field" rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="Z. B. Besonderheiten..." />
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="submit" className="btn-primary" disabled={loading || !activity || !date || !hours}>Speichern & Bestätigen</button>
            <button type="button" onClick={() => router.back()} className="btn-primary" style={{ backgroundColor: 'var(--text-secondary)' }}>Abbrechen</button>
          </div>
        </form>
      </div>
    </div>
  );
}
