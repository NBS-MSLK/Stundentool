'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewTask() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videos, setVideos] = useState([{ url: '', description: '' }]);
  const [estimatedHours, setEstimatedHours] = useState('');
  const [creatorIsContact, setCreatorIsContact] = useState(true);
  
  // Terminal dates + time blocks proposals
  const [targetDates, setTargetDates] = useState<{date: string, startTime: string, endTime: string}[]>([]);
  const [tempDate, setTempDate] = useState('');
  const [tempStartTime, setTempStartTime] = useState('08:00');
  const [tempEndTime, setTempEndTime] = useState('12:00');
  
  const [steps, setSteps] = useState([{ description: '', estimatedHours: '' }]);
  const [materials, setMaterials] = useState([{ name: '', buyLink: '' }]);
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (!userJson) {
      router.push('/');
      return;
    }
    setUser(JSON.parse(userJson));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const filteredSteps = steps.filter(s => s.description.trim());
      const filteredMaterials = materials.filter(m => m.name.trim());

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          creatorId: user.id,
          creatorName: user.name,
          imageUrl: imageUrl || null,
          estimatedHours: estimatedHours || null,
          creatorIsContact,
          proposedDates: targetDates,
          videos: videos.filter(v => v.url.trim()),
          steps: filteredSteps,
          materials: filteredMaterials
        })
      });
      if (res.ok) {
        router.push('/dashboard');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const addDateProposal = () => {
    if (tempDate) {
      const pd = new Date(`${tempDate}T${tempStartTime}`);
      const now = new Date();
      const diffMs = pd.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours < 24) {
        alert('Terminvorschläge sollten 24h Vorlaufzeit haben!');
        return;
      }

      if (parseInt(tempStartTime) >= parseInt(tempEndTime)) {
        alert('Die Startzeit muss zwingend vor der Endzeit liegen!');
        return;
      }
      setTargetDates([...targetDates, { date: tempDate, startTime: tempStartTime, endTime: tempEndTime }]);
      setTempDate('');
      setTempStartTime('08:00');
      setTempEndTime('12:00');
    }
  };

  const removeDateProposal = (idx: number) => {
    const fresh = [...targetDates];
    fresh.splice(idx, 1);
    setTargetDates(fresh);
  };

  if (!user) return null;

  return (
    <div className="container">
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>&larr; Zurück</Link>
        <h1 style={{ marginTop: '1rem', fontSize: '1.5rem' }}>Neue Arbeit (Task) eintragen</h1>
      </div>

      <div className="glass-card">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Titel der Arbeit *</label>
            <input type="text" className="input-field" value={title} onChange={e => setTitle(e.target.value)} required placeholder="z.B. Werkbank aufräumen" />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Beschreibung / Umfang</label>
            <textarea className="input-field" value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Was muss genau gemacht werden?" />
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Geschätzter Aufwand (Stunden)</label>
              <input type="number" className="input-field" value={estimatedHours} onChange={e => setEstimatedHours(e.target.value)} placeholder="Optional" />
            </div>
            
            <div style={{ flex: 2, minWidth: '250px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Zuständigkeit</label>
              <select 
                className="input-field"
                value={creatorIsContact ? 'true' : 'false'} 
                onChange={(e) => setCreatorIsContact(e.target.value === 'true')}
              >
                <option value="true">Ich bin Ansprechpartner</option>
                <option value="false">Zuständiger wird gesucht</option>
              </select>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--bg-secondary)', margin: '1rem 0' }} />

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Bild URL (Optional)</label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <input type="url" className="input-field" style={{ flex: 1, minWidth: '250px' }} value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." />
              {imageUrl && (
                <div style={{ 
                  height: '100px', 
                  width: '100px', 
                  backgroundImage: `url(${imageUrl})`, 
                  backgroundSize: 'cover', 
                  borderRadius: '8px',
                  border: '2px solid var(--accent-primary)',
                  flexShrink: 0
                }} />
              )}
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--bg-secondary)', margin: '1rem 0' }} />

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Hilfreiche Videos (YouTube)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {videos.map((v, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <input 
                      type="url" 
                      className="input-field" 
                      value={v.url} 
                      onChange={e => {
                        const newVideos = [...videos];
                        newVideos[idx].url = e.target.value;
                        setVideos(newVideos);
                      }} 
                      placeholder="YouTube URL (z.B. https://www.youtube.com/watch?v=...)" 
                    />
                    <input 
                      type="text" 
                      className="input-field" 
                      style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem' }}
                      value={v.description} 
                      onChange={e => {
                        const newVideos = [...videos];
                        newVideos[idx].description = e.target.value;
                        setVideos(newVideos);
                      }} 
                      placeholder="Kurze Beschreibung zum Video (optional)" 
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={() => {
                      const newVideos = [...videos];
                      newVideos.splice(idx, 1);
                      if (newVideos.length === 0) newVideos.push({ url: '', description: '' });
                      setVideos(newVideos);
                    }} 
                    className="btn-danger" 
                    style={{ padding: '0.5rem 0.75rem', height: 'auto' }}
                  >×</button>
                  {idx === videos.length - 1 && (
                    <button 
                      type="button" 
                      onClick={() => setVideos([...videos, { url: '', description: '' }])} 
                      className="btn-primary" 
                      style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.5rem 0.75rem', height: 'auto' }}
                    >+</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--bg-secondary)', margin: '1rem 0' }} />

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Mögliche Termine vorschlagen (Optional)</label>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Lege Termine fest, an denen du können würdest. Andere User können dann im Dashboard abstimmen!
            </div>
            
            {targetDates.map((td, idx) => (
              <div key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--accent-primary)', color: 'white', padding: '0.5rem 1rem', borderRadius: '20px', marginRight: '0.5rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                {new Date(td.date).toLocaleDateString('de-DE')} ({td.startTime} - {td.endTime})
                <button type="button" onClick={() => removeDateProposal(idx)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
              </div>
            ))}
            
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Datum</label>
                <input type="date" className="input-field" style={{ width: 'auto' }} value={tempDate} onChange={e => setTempDate(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Von</label>
                <select className="input-field" style={{ width: 'auto' }} value={tempStartTime} onChange={e => setTempStartTime(e.target.value)}>
                  {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Bis</label>
                <select className="input-field" style={{ width: 'auto' }} value={tempEndTime} onChange={e => setTempEndTime(e.target.value)}>
                  {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <button type="button" onClick={addDateProposal} className="btn-primary" disabled={!tempDate}>Hinzufügen</button>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--bg-secondary)', margin: '1rem 0' }} />

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Einzelschritte (Checkliste)</label>
            {steps.map((step, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input type="text" className="input-field" style={{ flex: 2 }} value={step.description} onChange={e => {
                  const newSteps = [...steps];
                  newSteps[idx].description = e.target.value;
                  setSteps(newSteps);
                }} placeholder={`Schritt ${idx + 1}`} />
                <input type="number" className="input-field" style={{ flex: 1, maxWidth: '100px' }} value={step.estimatedHours} onChange={e => {
                  const newSteps = [...steps];
                  newSteps[idx].estimatedHours = e.target.value;
                  setSteps(newSteps);
                }} placeholder={`Std (opt)`} />
                {idx === steps.length - 1 && (
                  <button type="button" onClick={() => setSteps([...steps, { description: '', estimatedHours: '' }])} className="btn-primary" style={{ backgroundColor: 'var(--bg-secondary)' }}>+</button>
                )}
              </div>
            ))}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Benötigtes Material</label>
            {materials.map((mat, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                <input type="text" className="input-field" style={{ flex: 1, minWidth: '150px' }} value={mat.name} onChange={e => {
                  const newMat = [...materials];
                  newMat[idx].name = e.target.value;
                  setMaterials(newMat);
                }} placeholder={`Material ${idx + 1}`} />
                <input type="url" className="input-field" style={{ flex: 1, minWidth: '150px' }} value={mat.buyLink} onChange={e => {
                  const newMat = [...materials];
                  newMat[idx].buyLink = e.target.value;
                  setMaterials(newMat);
                }} placeholder="Kauflink (Optional)" />
                {idx === materials.length - 1 && (
                  <button type="button" onClick={() => setMaterials([...materials, { name: '', buyLink: '' }])} className="btn-primary" style={{ backgroundColor: 'var(--bg-secondary)' }}>+</button>
                )}
              </div>
            ))}
          </div>

          <button type="submit" className="btn-success" disabled={loading || !title.trim()} style={{ marginTop: '1rem', padding: '1rem' }}>
            {loading ? 'Wird gespeichert...' : 'Arbeit speichern'}
          </button>
        </form>
      </div>
    </div>
  );
}
