'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import GlobalCalendar from './GlobalCalendar';

export default function TaskManager({ user }: { user: any }) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [proposingTaskId, setProposingTaskId] = useState<string | null>(null);
  const [newProposalDate, setNewProposalDate] = useState('');
  const [newProposalStartTime, setNewProposalStartTime] = useState('08:00');
  const [newProposalEndTime, setNewProposalEndTime] = useState('12:00');
  const router = useRouter();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      if (data.tasks) {
        setTasks(data.tasks);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const scheduledTasks = tasks.filter(t => t.status === 'SCHEDULED');
  const openTasks = tasks.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS');
  const doneTasks = tasks.filter(t => t.status === 'DONE');

  const handleVolunteer = async (taskId: string, role: string) => {
    try {
      await fetch(`/api/tasks/${taskId}/volunteer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, userName: user.name, role })
      });
      fetchTasks();
    } catch (e) {
      console.error(e);
    }
  };

  const handleVote = async (taskId: string, proposalId: string, vote: string) => {
    try {
      await fetch(`/api/tasks/${taskId}/proposals/${proposalId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, userName: user.name, vote })
      });
      fetchTasks();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveVolunteer = async (taskId: string) => {
    try {
      await fetch(`/api/tasks/${taskId}/volunteer?userId=${user.id}`, { method: 'DELETE' });
      fetchTasks();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateProposal = async (taskId: string) => {
    if (!newProposalDate || !newProposalStartTime || !newProposalEndTime) return;
    
    const pd = new Date(`${newProposalDate}T${newProposalStartTime}`);
    const now = new Date();
    const diffMs = pd.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24) {
      alert('Terminvorschläge sollten 24h Vorlaufzeit haben!');
      return;
    }

    if (parseInt(newProposalStartTime) >= parseInt(newProposalEndTime)) {
      alert('Die Startzeit muss zwingend vor der Endzeit liegen!');
      return;
    }
    
    try {
      const res = await fetch(`/api/tasks/${taskId}/proposals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: newProposalDate, startTime: newProposalStartTime, endTime: newProposalEndTime })
      });
      const data = await res.json();
      if (data.proposal) {
        await fetch(`/api/tasks/${taskId}/proposals/${data.proposal.id}/vote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, userName: user.name, vote: 'YES' })
        });
        setProposingTaskId(null);
        setNewProposalDate('');
        setNewProposalStartTime('08:00');
        setNewProposalEndTime('12:00');
        fetchTasks();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div>Lade Aufgaben...</div>;

  return (
    <div style={{ marginTop: '1rem' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Arbeitsdienste</h2>
          <Link href="/admin/shopping-list" className="btn-primary" style={{ backgroundColor: 'var(--accent-primary)', textDecoration: 'none', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
            🖨️ Einkaufsliste drucken
          </Link>
        </div>
        <Link href="/dashboard/tasks/new" style={{ textDecoration: 'none' }}>
           <div className="btn-primary" style={{ width: '100%', padding: '1rem', backgroundColor: 'var(--success)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
             <span style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>Ich weiß, was zu tun ist!</span>
             <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>Neue Arbeit eintragen</span>
           </div>
        </Link>
      </div>

      {scheduledTasks.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#8a2be2', fontWeight: 'bold' }}>🎉 Terminierte Arbeiten</h3>
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {scheduledTasks.map(task => {
              const diffMs = new Date(task.dueDate).getTime() - new Date().getTime();
              const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
              const matchingProposal = task.dateProposals?.find((p: any) => new Date(p.date).getTime() === new Date(task.dueDate).getTime());
              const timeString = matchingProposal ? ` (${matchingProposal.startTime} - ${matchingProposal.endTime} Uhr)` : '';
              
              return (
                <div key={task.id} className="glass-card" style={{ padding: '0', borderLeft: '4px solid #8a2be2', backgroundColor: 'rgba(138, 43, 226, 0.05)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <Link href={`/dashboard/tasks/${task.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                      <div style={{ fontSize: '2rem' }}>⏰</div>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{task.title}</div>
                        <div style={{ color: '#8a2be2', fontWeight: 'bold', fontSize: '0.9rem' }}>
                          Am {new Date(task.dueDate).toLocaleDateString('de-DE')}{timeString}
                          {diffDays > 0 && ` (In ${diffDays} Tagen!)`}
                          {diffDays === 0 && ` (HEUTE!)`}
                          {diffDays < 0 && ` (War vor ${Math.abs(diffDays)} Tagen)`}
                        </div>
                      </div>
                    </div>

                    {task.imageUrl ? (
                      <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                        <img src={task.imageUrl} alt="Vorschau" style={{ width: '100%', height: '120px', objectFit: 'contain', aspectRatio: '1/1' }} />
                      </div>
                    ) : (
                      <div style={{ height: '80px', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        Kein Bild
                      </div>
                    )}
                  </Link>
                  <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--bg-hover)', backgroundColor: 'var(--bg-primary)' }}>
                    <div style={{ fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Mithilfe:</div>
                    <div style={{ display: 'flex', gap: '0.2rem' }}>
                      <button 
                        onClick={(e) => { e.preventDefault(); handleRemoveVolunteer(task.id); }}
                        style={{ flex: 1, padding: '0.3rem', background: !task.volunteers?.some((v: any) => v.userId === user.id) ? '#ff4d4f' : 'transparent', border: '1px solid #ff4d4f', borderRadius: '2px', cursor: 'pointer' }}
                        title="Ich kann gar nicht"
                      >❌</button>
                      <button 
                        onClick={(e) => { e.preventDefault(); handleVolunteer(task.id, 'MAYBE'); }}
                        style={{ flex: 1, padding: '0.3rem', background: task.volunteers?.find((v: any) => v.userId === user.id)?.role === 'MAYBE' ? '#faad14' : 'transparent', border: '1px solid #faad14', borderRadius: '2px', cursor: 'pointer' }}
                        title="Vielleicht / Unter Vorbehalt"
                      >❓</button>
                      <button 
                        onClick={(e) => { e.preventDefault(); handleVolunteer(task.id, 'HELPER'); }}
                        style={{ flex: 1, padding: '0.3rem', background: task.volunteers?.find((v: any) => v.userId === user.id)?.role === 'HELPER' || task.volunteers?.find((v: any) => v.userId === user.id)?.role === 'CONTACT' ? '#52c41a' : 'transparent', border: '1px solid #52c41a', borderRadius: '2px', cursor: 'pointer' }}
                        title="Ich bin sicher dabei"
                      >✅</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Global Calendar Section */}
      <GlobalCalendar tasks={[...openTasks, ...scheduledTasks]} user={user} refetch={fetchTasks} />

      <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Anstehend (Offen / In Bearbeitung)</h3>
      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {openTasks.map(task => (
          <div key={task.id} className="glass-card" style={{ padding: '0', borderLeft: '4px solid var(--accent-primary)', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Link href={`/dashboard/tasks/${task.id}`} style={{ padding: '1rem', textDecoration: 'none', color: 'inherit', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.5rem' }}>{task.title}</div>
              
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem', flex: 1 }}>
                {task.description && task.description.length > 80 ? task.description.substring(0, 80) + '...' : task.description}
              </div>

              {task.imageUrl ? (
                <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                  <img src={task.imageUrl} alt="Vorschau" style={{ width: '100%', height: '150px', objectFit: 'contain', aspectRatio: '1/1' }} />
                </div>
              ) : (
                <div style={{ height: '100px', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                  Kein Bild
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', alignItems: 'center', flexWrap: 'wrap' }}>
                <span title="Aufwand">⏱️ {task.estimatedHours ? `${task.estimatedHours}h` : '?'}</span>
                <span title="Teilschritte">📋 {task.steps?.filter((s:any) => s.isCompleted).length || 0}/{task.steps?.length || 0}</span>
                <span title="Mitarbeiter">👥 {task.volunteers?.length || 0}</span>
                <span style={{ marginLeft: 'auto', backgroundColor: task.status === 'IN_PROGRESS' ? 'var(--warning)' : 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', color: task.status === 'IN_PROGRESS' ? 'black' : 'inherit' }}>
                  {task.status === 'IN_PROGRESS' ? 'IN ARBEIT' : 'OFFEN'}
                </span>
              </div>
            </Link>

            {task.dateProposals?.length > 0 && (!task.dueDate || task.status === 'OPEN') && (
              <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--bg-hover)', backgroundColor: 'var(--bg-primary)' }}>
                <div style={{ fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Terminvorschläge:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {task.dateProposals.map((p: any) => {
                    const myVote = p.votes?.find((v: any) => v.userId === user.id)?.vote;
                    return (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{new Date(p.date).toLocaleDateString('de-DE')} <span style={{color: 'var(--text-secondary)'}}>({p.startTime || '08:00'} - {p.endTime || '12:00'})</span></div>
                        <div style={{ display: 'flex', gap: '0.2rem', width: '100px' }}>
                          <button onClick={(e) => { e.preventDefault(); handleVote(task.id, p.id, 'NO'); }} style={{ flex: 1, padding: '0.2rem', background: myVote === 'NO' ? '#ff4d4f' : 'transparent', border: '1px solid #ff4d4f', borderRadius: '2px', cursor: 'pointer' }}>❌</button>
                          <button onClick={(e) => { e.preventDefault(); handleVote(task.id, p.id, 'MAYBE'); }} style={{ flex: 1, padding: '0.2rem', background: myVote === 'MAYBE' ? '#faad14' : 'transparent', border: '1px solid #faad14', borderRadius: '2px', cursor: 'pointer' }}>❓</button>
                          <button onClick={(e) => { e.preventDefault(); handleVote(task.id, p.id, 'YES'); }} style={{ flex: 1, padding: '0.2rem', background: myVote === 'YES' ? '#52c41a' : 'transparent', border: '1px solid #52c41a', borderRadius: '2px', cursor: 'pointer' }}>✅</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {(!task.dueDate || task.status === 'OPEN') && (
              <div style={{ padding: '0 1rem 0.75rem 1rem', backgroundColor: 'var(--bg-primary)', borderTop: task.dateProposals?.length === 0 ? '1px solid var(--bg-hover)' : 'none', paddingTop: task.dateProposals?.length === 0 ? '0.75rem' : '0' }}>
                {proposingTaskId === task.id ? (
                  <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', cursor: 'default' }}>
                    <input type="date" value={newProposalDate} onChange={e => setNewProposalDate(e.target.value)} className="input-field" style={{ marginBottom: '0.5rem', padding: '0.3rem', width: '100%', fontSize: '0.8rem' }} />
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Von</label>
                        <select value={newProposalStartTime} onChange={e => setNewProposalStartTime(e.target.value)} className="input-field" style={{ padding: '0.3rem', width: '100%', fontSize: '0.8rem' }}>
                          {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Bis</label>
                        <select value={newProposalEndTime} onChange={e => setNewProposalEndTime(e.target.value)} className="input-field" style={{ padding: '0.3rem', width: '100%', fontSize: '0.8rem' }}>
                          {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn-primary" onClick={(e) => { e.preventDefault(); handleCreateProposal(task.id); }} style={{ flex: 1, padding: '0.3rem', fontSize: '0.8rem', backgroundColor: 'var(--success)' }}>Speichern</button>
                      <button className="btn-primary" onClick={(e) => { e.preventDefault(); setProposingTaskId(null); }} style={{ flex: 1, padding: '0.3rem', fontSize: '0.8rem', backgroundColor: 'var(--text-secondary)' }}>Abbruch</button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={(e) => { e.preventDefault(); setProposingTaskId(task.id); setNewProposalDate(''); setNewProposalStartTime('08:00'); setNewProposalEndTime('12:00'); }}
                    style={{ width: '100%', padding: '0.3rem', fontSize: '0.75rem', background: 'transparent', border: '1px dashed var(--text-secondary)', color: 'var(--text-secondary)', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    + Eigenen Terminvorschlag
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        {openTasks.length === 0 && <div style={{ color: 'var(--text-secondary)' }}>Keine offenen Aufgaben vorhanden.</div>}
      </div>

      <h3 style={{ fontSize: '1.2rem', margin: '2rem 0 1rem 0', color: 'var(--text-secondary)' }}>Kürzlich Erledigt</h3>
      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', opacity: 0.8 }}>
        {doneTasks.slice(0, 10).map(task => (
           <Link key={task.id} href={`/dashboard/tasks/${task.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="glass-card" style={{ padding: '1rem', borderLeft: '4px solid var(--success)', height: '100%' }}>
              <div style={{ fontWeight: 'bold' }}>{task.title}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Erledigt</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
