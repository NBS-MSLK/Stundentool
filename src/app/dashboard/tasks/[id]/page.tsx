'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Helper to convert URLs to clickable links
const renderTextWithLinks = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.split(urlRegex).map((part, i) => {
    if (part.match(urlRegex)) {
      return <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>{part}</a>;
    }
    return part;
  });
};



export default function TaskDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const taskId = resolvedParams.id;

  const [task, setTask] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [myNote, setMyNote] = useState('');
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (!userJson) {
      router.push('/');
      return;
    }
    setUser(JSON.parse(userJson));
    fetchTask();
  }, [taskId, router]);

  const fetchTask = async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      const data = await res.json();
      if (data.task) {
        setTask(data.task);
        // Pre-fill user's note if it exists
        const userJson = localStorage.getItem('user');
        if (userJson) {
          const u = JSON.parse(userJson);
          const existingNote = data.task.notes?.find((n:any) => n.userId === u.id);
          if (existingNote) {
            setMyNote(existingNote.content);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStep = async (stepId: string, isCompleted: boolean) => {
    await fetch(`/api/tasks/${taskId}/step`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stepId, isCompleted: !isCompleted })
    });
    fetchTask();
  };

  const handleVote = async (proposalId: string, vote: string) => {
    await fetch(`/api/tasks/${taskId}/proposals/${proposalId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, userName: user.name, vote })
    });
    fetchTask();
  };

  const handleToggleMaterial = async (materialId: string, isAcquired: boolean) => {
    await fetch(`/api/tasks/${taskId}/material`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ materialId, isAcquired: !isAcquired })
    });
    fetchTask();
  };

  const handleVolunteer = async (role: string) => {
    await fetch(`/api/tasks/${taskId}/volunteer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, userName: user.name, role })
    });
    fetchTask();
  };

  const handleRemoveVolunteer = async () => {
    await fetch(`/api/tasks/${taskId}/volunteer?userId=${user.id}`, { method: 'DELETE' });
    fetchTask();
  };

  const handleUpdateStatus = async (status: string) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    fetchTask();
  };

  const handleUpdateHours = async () => {
    let sum = 0;
    if (task.steps) {
      task.steps.forEach((s: any) => {
        // Zieht abgehakte Stunden ab (bzw. addiert nur noch nicht komplettierte)
        if (!s.isCompleted && s.estimatedHours) {
          sum += s.estimatedHours;
        }
      });
    }

    await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estimatedHours: sum })
    });
    fetchTask();
    alert(`Noch offener Aufwand wurde auf ${sum}h (Rest-Stunden) aktualisiert!`);
  };

  const handleSaveNote = async () => {
    if (!myNote.trim()) return;
    await fetch(`/api/tasks/${taskId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, userName: user.name, content: myNote })
    });
    setIsEditingNote(false);
    fetchTask();
  };

  if (loading || !user) return <div className="container">Lade...</div>;
  if (!task) return <div className="container">Aufgabe nicht gefunden.</div>;

  const isVolunteered = task.volunteers?.some((v: any) => v.userId === user.id);
  const canEdit = user.role === 'ADMIN' || user.id === task.creatorId;
  const existingNote = task.notes?.find((n:any) => n.userId === user.id);

  return (
    <div className="container">
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link href="/dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>&larr; Zurück zum Dashboard</Link>
          {canEdit && (
             <Link href={`/dashboard/tasks/${taskId}/edit`} className="btn-primary" style={{ backgroundColor: 'transparent', color: 'var(--accent-primary)', border: '1px solid var(--accent-primary)' }}>
               ✏️ Bearbeiten
             </Link>
          )}
        </div>
        <button 
          onClick={() => {
            const query = new URLSearchParams({ activity: `Arbeitsdienst: ${task.title}` }).toString();
            router.push('/dashboard/new?note=' + encodeURIComponent(`Arbeitsdienst: ${task.title}`));
          }} 
          className="btn-primary" 
          style={{ backgroundColor: 'var(--success)' }}
        >
          ⏱️ Stunden für diese Arbeit eintragen
        </button>
      </div>

      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '0.5rem' }}>{task.title}</h1>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Erstellt von {task.creatorName} | Status: <span style={{ fontWeight: 'bold', color: task.status === 'DONE' ? 'var(--success)' : task.status === 'IN_PROGRESS' || task.status === 'SCHEDULED' ? 'var(--warning)' : 'inherit' }}>{task.status}</span>
              {task.estimatedHours !== null && <span> | Rest-Aufwand: {task.estimatedHours}h</span>}
            </div>
            {task.dueDate && (
              <div style={{ marginTop: '0.8rem', padding: '0.4rem 0.8rem', backgroundColor: 'var(--success)', color: '#fff', borderRadius: 'var(--radius-sm)', display: 'inline-block', fontWeight: 'bold', fontSize: '1.1rem' }}>
                📆 Termin: {new Date(task.dueDate).toLocaleDateString('de-DE')}
              </div>
            )}
          </div>
          <select 
            value={task.status} 
            onChange={(e) => handleUpdateStatus(e.target.value)} 
            className="input-field" 
            style={{ width: 'auto' }}
          >
            <option value="OPEN">Offen</option>
            <option value="SCHEDULED">Terminiert</option>
            <option value="IN_PROGRESS">In Arbeit</option>
            <option value="DONE">Erledigt</option>
          </select>
        </div>

        {task.imageUrl ? (
          <div style={{ marginTop: '1.5rem', width: '100%', maxWidth: '600px', height: '300px', backgroundImage: `url(${task.imageUrl})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'left center', borderRadius: 'var(--radius-md)' }} />
        ) : (
           <div style={{ marginTop: '1.5rem', width: '100%', maxWidth: '600px', height: '100px', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)' }}>
             Kein Bild hinterlegt
           </div>
        )}

        {task.description && (
          <div style={{ marginTop: '1.5rem', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            {renderTextWithLinks(task.description)}
          </div>
        )}
      </div>

      {/* Date Proposals Section */}
      {!task.dueDate && task.dateProposals?.length > 0 && (
        <div className="glass-card" style={{ marginBottom: '2rem', border: '2px solid var(--accent-primary)' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--accent-primary)' }}>📆 Terminvorschläge – Bitte abstimmen</h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {task.dateProposals.map((p: any) => {
              const myVote = p.votes?.find((v:any) => v.userId === user.id)?.vote;
              const totalYes = p.votes?.filter((v:any) => v.vote === 'YES').length || 0;
              const totalMaybe = p.votes?.filter((v:any) => v.vote === 'MAYBE').length || 0;
              const totalNo = p.votes?.filter((v:any) => v.vote === 'NO').length || 0;
              
              return (
                <div key={p.id} style={{ 
                  flex: '1 1 200px', 
                  backgroundColor: 'var(--bg-primary)', 
                  padding: '1rem', 
                  borderRadius: 'var(--radius-md)', 
                  border: myVote ? `2px solid ${myVote === 'YES' ? '#52c41a' : myVote === 'NO' ? '#ff4d4f' : '#faad14'}` : '1px solid var(--bg-hover)'
                }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.2rem' }}>
                    {new Date(p.date).toLocaleDateString('de-DE')}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    {p.startTime || '08:00'} - {p.endTime || '12:00'} Uhr
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '1rem' }}>
                    <button 
                      onClick={() => handleVote(p.id, 'NO')}
                      className="btn-primary"
                      style={{ flex: 1, backgroundColor: myVote === 'NO' ? '#ff4d4f' : 'transparent', color: myVote === 'NO' ? 'white' : 'var(--text-primary)', border: '1px solid #ff4d4f', padding: '0.5rem', height: 'auto' }}
                      title="Kann nicht"
                    >❌ {totalNo}</button>
                    <button 
                      onClick={() => handleVote(p.id, 'MAYBE')}
                      className="btn-primary"
                      style={{ flex: 1, backgroundColor: myVote === 'MAYBE' ? '#faad14' : 'transparent', color: myVote === 'MAYBE' ? 'white' : 'var(--text-primary)', border: '1px solid #faad14', padding: '0.5rem', height: 'auto' }}
                      title="Vielleicht"
                    >❓ {totalMaybe}</button>
                    <button 
                      onClick={() => handleVote(p.id, 'YES')}
                      className="btn-primary"
                      style={{ flex: 1, backgroundColor: myVote === 'YES' ? '#52c41a' : 'transparent', color: myVote === 'YES' ? 'white' : 'var(--text-primary)', border: '1px solid #52c41a', padding: '0.5rem', height: 'auto' }}
                      title="Bin dabei"
                    >✅ {totalYes}</button>
                  </div>
                  
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    {p.votes?.map((v:any) => (
                      <div key={v.id}>
                        {v.vote === 'YES' ? '✅' : v.vote === 'MAYBE' ? '❓' : '❌'} {v.userName}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        
        {/* Left Column */}
        <div style={{ flex: 2, minWidth: '300px' }}>
          {task.steps?.length > 0 && (
            <div className="glass-card" style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.2rem' }}>Schritte ({task.steps.filter((s:any) => s.isCompleted).length}/{task.steps.length})</h2>
                <button onClick={handleUpdateHours} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }} title="Addiert die Stunden aus noch offenen Einzelschritten zur Aufgabe">
                  Rest-Stunden aktualisieren
                </button>
              </div>
              
              {task.steps.map((step: any) => (
                <label key={step.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', backgroundColor: 'var(--bg-primary)', marginBottom: '0.5rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={step.isCompleted} 
                    onChange={() => handleToggleStep(step.id, step.isCompleted)} 
                    style={{ width: '20px', height: '20px' }}
                  />
                  <span style={{ textDecoration: step.isCompleted ? 'line-through' : 'none', color: step.isCompleted ? 'var(--text-secondary)' : 'inherit', flex: 1 }}>
                    {step.description}
                  </span>
                  {step.estimatedHours && (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', backgroundColor: 'var(--bg-secondary)', padding: '0.2rem 0.5rem', borderRadius: '10px' }}>
                      {step.estimatedHours}h
                    </span>
                  )}
                </label>
              ))}
            </div>
          )}

          {task.materials?.length > 0 && (
            <div className="glass-card" style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Material ({task.materials.filter((m:any) => m.isAcquired).length}/{task.materials.length})</h2>
              {task.materials.map((mat: any) => (
                <div key={mat.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'var(--bg-primary)', marginBottom: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', flex: 1 }}>
                    <input 
                      type="checkbox" 
                      checked={mat.isAcquired} 
                      onChange={() => handleToggleMaterial(mat.id, mat.isAcquired)} 
                      style={{ width: '20px', height: '20px' }}
                    />
                    <span style={{ textDecoration: mat.isAcquired ? 'line-through' : 'none', color: mat.isAcquired ? 'var(--text-secondary)' : 'inherit' }}>
                      {mat.name}
                    </span>
                  </label>
                  {mat.buyLink && (
                    <a href={mat.buyLink} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', backgroundColor: 'var(--accent-primary)', textDecoration: 'none' }}>
                      Kaufen/Link
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div style={{ flex: 1, minWidth: '250px' }}>
          <div className="glass-card" style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Mitarbeit ({task.volunteers?.length || 0})</h2>
            
            <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {task.volunteers?.map((v: any) => (
                <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                    {v.userName.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{v.userName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {v.role === 'CONTACT' ? 'Ansprechpartner' : v.role === 'MAYBE' ? 'Vielleicht / Vorbehalt' : 'Mithilfe'}
                    </div>
                  </div>
                </div>
              ))}
              {(!task.volunteers || task.volunteers.length === 0) && <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Noch niemand eingetragen.</div>}
            </div>

            {!isVolunteered ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button onClick={() => handleVolunteer('HELPER')} className="btn-primary" style={{ backgroundColor: 'var(--accent-primary)' }}>Ich helfe mit</button>
                <button onClick={() => handleVolunteer('CONTACT')} className="btn-primary" style={{ backgroundColor: 'var(--bg-secondary)', color: 'white' }}>Als Ansprechpartner melden</button>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <button onClick={handleRemoveVolunteer} className="btn-danger" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem', width: 'auto' }}>Austragen</button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Task Notes Section */}
      <div className="glass-card" style={{ marginTop: '0' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Anmerkungen ({task.notes?.length || 0})</h2>
        
        {(!existingNote || isEditingNote) && (
          <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-md)' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Deine Anmerkung</label>
            <textarea 
              className="input-field" 
              rows={3} 
              value={myNote} 
              onChange={e => setMyNote(e.target.value)} 
              placeholder="Links werden automatisch erkannt..." 
            />
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button onClick={handleSaveNote} className="btn-primary" style={{ backgroundColor: 'var(--accent-primary)', padding: '0.3rem 0.8rem', fontSize: '0.85rem', width: 'auto' }}>
                Speichern
              </button>
              {isEditingNote && (
                <button onClick={() => { setIsEditingNote(false); setMyNote(existingNote?.content || ''); }} className="btn-danger" style={{ backgroundColor: 'transparent', color: 'var(--text-secondary)', padding: '0.3rem 0.8rem', fontSize: '0.85rem', width: 'auto', border: '1px solid var(--text-secondary)' }}>
                  Abbrechen
                </button>
              )}
            </div>
          </div>
        )}

        {/* Liste aller Anmerkungen */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {task.notes?.map((n: any) => (
            <div key={n.id} style={{ display: 'flex', gap: '1rem', padding: '1rem', borderLeft: '3px solid var(--bg-hover)', backgroundColor: 'var(--bg-primary)', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 'bold' }}>{n.userName}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(n.updatedAt).toLocaleDateString('de-DE')}</div>
                  
                  {/* Bearbeiten Knopf für eigene Anmerkung */}
                  {!isEditingNote && n.userId === user.id && (
                    <button onClick={() => setIsEditingNote(true)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)', fontSize: '0.85rem' }}>
                      ✏️ Bearbeiten
                    </button>
                  )}
                </div>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                  {renderTextWithLinks(n.content)}
                </div>
              </div>
            </div>
          ))}
          {(!task.notes || task.notes.length === 0) && <div style={{ color: 'var(--text-secondary)' }}>Es gibt noch keine Anmerkungen.</div>}
        </div>
      </div>
      <div style={{ marginBottom: '4rem' }}></div>
    </div>
  );
}
