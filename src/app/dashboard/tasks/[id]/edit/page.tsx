'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EditTask({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const taskId = resolvedParams.id;

  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videos, setVideos] = useState<any[]>([]);
  const [estimatedHours, setEstimatedHours] = useState('');
  const [status, setStatus] = useState('OPEN');
  const [creatorIsContact, setCreatorIsContact] = useState(true);
  
  const [steps, setSteps] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [targetDates, setTargetDates] = useState<{id?: string, date: string, startTime: string, endTime: string}[]>([]);
  const [tempDate, setTempDate] = useState('');
  const [tempStartTime, setTempStartTime] = useState('08:00');
  const [tempEndTime, setTempEndTime] = useState('12:00');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (!userJson) {
      router.push('/');
      return;
    }
    const parsedUser = JSON.parse(userJson);
    setUser(parsedUser);
    fetchTask(parsedUser);
  }, [taskId, router]);

  const fetchTask = async (currentUser: any) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      const data = await res.json();
      if (data.task) {
        if (currentUser.role !== 'ADMIN' && currentUser.id !== data.task.creatorId) {
          alert('Du hast keine Berechtigung, diese Aufgabe zu bearbeiten.');
          router.push(`/dashboard/tasks/${taskId}`);
          return;
        }

        setTitle(data.task.title);
        setDescription(data.task.description || '');
        setImageUrl(data.task.imageUrl || '');
        setVideos(data.task.videos && data.task.videos.length > 0 ? data.task.videos : [{ url: '', description: '' }]);
        setEstimatedHours(data.task.estimatedHours ? data.task.estimatedHours.toString() : '');
        setStatus(data.task.status);
        setCreatorIsContact(data.task.creatorIsContact);
        
        if (data.task.dateProposals) {
          setTargetDates(data.task.dateProposals.map((p:any) => ({ id: p.id, date: new Date(p.date).toISOString().split('T')[0], startTime: p.startTime || '08:00', endTime: p.endTime || '12:00' })));
        }

        let initialSteps = data.task.steps || [];
        if (initialSteps.length === 0) initialSteps = [{ description: '', estimatedHours: '' }];
        setSteps(initialSteps.map((s:any) => ({ ...s, estimatedHours: s.estimatedHours || '' })));
        
        let initialMaterials = data.task.materials || [];
        if (initialMaterials.length === 0) initialMaterials = [{ name: '', buyLink: '' }];
        setMaterials(initialMaterials.map((m:any) => ({ ...m, buyLink: m.buyLink || '' })));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      const filteredSteps = steps.filter(s => s.description.trim() !== '');
      const filteredMaterials = materials.filter(m => m.name.trim() !== '');

      const parsedSteps = filteredSteps.map(s => ({
        id: s.id,
        description: s.description,
        estimatedHours: s.estimatedHours ? parseFloat(s.estimatedHours) : null
      }));

      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          imageUrl: imageUrl || null,
          videos: videos.filter(v => v.url.trim()),
          estimatedHours: estimatedHours ? parseInt(estimatedHours) : null,
          status,
          creatorIsContact,
          steps: parsedSteps,
          materials: filteredMaterials,
          proposedDates: targetDates
        })
      });
      if (res.ok) {
        router.push(`/dashboard/tasks/${taskId}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Willst du diese Aufgabe wirklich komplett löschen? Alle Votes, Bilder und Listen gehen unwiederbringlich verloren!')) return;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/dashboard');
      }
    } catch (e) {
      console.error(e);
      setSaving(false);
    }
  };

  const addDateProposal = () => {
    if (tempDate && targetDates.length < 5) {
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

  if (!user || loading) return <div className="container">Lade...</div>;

  return (
    <div className="container">
      <div style={{ marginBottom: '2rem' }}>
        <Link href={`/dashboard/tasks/${taskId}`} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>&larr; Zurück</Link>
        <h1 style={{ marginTop: '1rem', fontSize: '1.5rem' }}>Arbeit bearbeiten</h1>
      </div>

      <div className="glass-card">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Titel der Arbeit *</label>
            <input type="text" className="input-field" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Status</label>
            <select className="input-field" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="OPEN">Offen</option>
              <option value="SCHEDULED">Terminiert</option>
              <option value="IN_PROGRESS">In Arbeit</option>
              <option value="DONE">Erledigt</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Beschreibung / Umfang</label>
            <textarea className="input-field" value={description} onChange={e => setDescription(e.target.value)} rows={4} />
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Stunden</label>
              <input type="number" className="input-field" value={estimatedHours} onChange={e => setEstimatedHours(e.target.value)} />
            </div>
            <div style={{ flex: 2, minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Zuständigkeit</label>
              <select className="input-field" value={creatorIsContact ? 'true' : 'false'} onChange={(e) => setCreatorIsContact(e.target.value === 'true')}>
                <option value="true">Ich bin Ansprechpartner</option>
                <option value="false">Zuständiger wird gesucht</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Bild URL</label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <input type="url" className="input-field" style={{ flex: 1, minWidth: '250px' }} value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
              {imageUrl && (
                <div style={{ height: '100px', width: '100px', backgroundImage: `url(${imageUrl})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', borderRadius: '8px', border: '2px solid var(--accent-primary)', flexShrink: 0, backgroundColor: 'var(--bg-secondary)' }} />
              )}
            </div>
          </div>

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
                      value={v.description || ''} 
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
              {videos.length === 0 && (
                <button 
                  type="button" 
                  onClick={() => setVideos([{ url: '', description: '' }])} 
                  className="btn-primary" 
                  style={{ backgroundColor: 'var(--bg-secondary)', width: '100%' }}
                >
                  + Video hinzufügen
                </button>
              )}
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--bg-secondary)', margin: '1rem 0' }} />

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Mögliche Termine bearbeiten (Maximal 5)</label>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Wenn du Vorschläge löschst, gehen auch die Votes dafür verloren. Verändere sie weise!
            </div>
            
            {targetDates.map((td, idx) => (
              <div key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--accent-primary)', color: 'white', padding: '0.5rem 1rem', borderRadius: '20px', marginRight: '0.5rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                {new Date(td.date).toLocaleDateString('de-DE')} ({td.startTime} - {td.endTime})
                <button type="button" onClick={() => removeDateProposal(idx)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
              </div>
            ))}
            
            {targetDates.length < 5 && (
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
            )}
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
                <input type="number" step="0.1" className="input-field" style={{ flex: 1, maxWidth: '100px' }} value={step.estimatedHours} onChange={e => {
                  const newSteps = [...steps];
                  newSteps[idx].estimatedHours = e.target.value;
                  setSteps(newSteps);
                }} placeholder={`Std (opt)`} />
                <button type="button" onClick={() => {
                  const newSteps = [...steps];
                  newSteps.splice(idx, 1);
                  if (newSteps.length === 0) newSteps.push({ description: '', estimatedHours: '' });
                  setSteps(newSteps);
                }} className="btn-danger" style={{ padding: '0 0.5rem' }}>×</button>
                {idx === steps.length - 1 && (
                  <button type="button" onClick={() => setSteps([...steps, { description: '', estimatedHours: '' }])} className="btn-primary" style={{ backgroundColor: 'var(--bg-secondary)', padding: '0 0.5rem' }}>+</button>
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
                <button type="button" onClick={() => {
                  const newMat = [...materials];
                  newMat.splice(idx, 1);
                  if (newMat.length === 0) newMat.push({ name: '', buyLink: '' });
                  setMaterials(newMat);
                }} className="btn-danger" style={{ padding: '0 0.5rem' }}>×</button>
                {idx === materials.length - 1 && (
                  <button type="button" onClick={() => setMaterials([...materials, { name: '', buyLink: '' }])} className="btn-primary" style={{ backgroundColor: 'var(--bg-secondary)', padding: '0 0.5rem' }}>+</button>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <button type="submit" className="btn-success" disabled={saving || !title.trim()} style={{ width: 'auto', padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}>
              {saving ? 'Bitte warten...' : 'Änderungen speichern'}
            </button>
            <button 
              type="button" 
              onClick={handleDelete}
              className="btn-danger" 
              disabled={saving}
              style={{ width: 'auto', padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}
              title="Aufgabe komplett löschen"
            >
              🗑️ Löschen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
