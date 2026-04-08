'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { ACTIVITIES } from '@/lib/activities';

export default function EditEntry({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [date, setDate] = useState('');
  const [hours, setHours] = useState('');
  const [activity, setActivity] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/entries/${id}`).then(res => res.json()).then(data => {
      const entry = data.entry;
      if (entry) {
        setDate(new Date(entry.startTime).toISOString().slice(0, 10));
        if (entry.endTime) {
          const start = new Date(entry.startTime).getTime();
          const end = new Date(entry.endTime).getTime();
          const diff = (end - start) / (1000 * 60 * 60);
          let h = Math.ceil(diff);
          if (h < 1) h = 1;
          setHours(h.toString());
        }
        if (entry.activity) {
            setActivity(entry.activity);
        }
      }
    });
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const startObj = new Date(`${date}T08:00:00`); 
    const endObj = new Date(startObj.getTime() + parseInt(hours, 10) * 60 * 60 * 1000);

    await fetch(`/api/entries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startTime: startObj.toISOString(), endTime: endObj.toISOString(), isConfirmed: true, activity })
    });
    router.back(); // Returns user to dashboard or admin seamlessly
  };

  return (
    <div className="container">
      <div className="glass-card">
        <h1 style={{ marginBottom: '2rem' }}>Eintrag bearbeiten</h1>
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
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="submit" className="btn-primary" disabled={loading || !activity || !date || !hours}>Speichern & Bestätigen</button>
            <button type="button" onClick={() => router.back()} className="btn-primary" style={{ backgroundColor: 'var(--text-secondary)' }}>Abbrechen</button>
          </div>
        </form>
      </div>
    </div>
  );
}
