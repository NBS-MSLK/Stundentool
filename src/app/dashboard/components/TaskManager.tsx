'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import GlobalCalendar from './GlobalCalendar';

export default function TaskManager({ user }: { user: any }) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

  if (loading) return <div>Lade Aufgaben...</div>;

  return (
    <div style={{ marginTop: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Arbeitsdienste</h2>
        <Link href="/dashboard/tasks/new" className="btn-primary" style={{ backgroundColor: 'var(--success)' }}>
          + Neue Arbeit eintragen
        </Link>
      </div>

      {scheduledTasks.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#8a2be2', fontWeight: 'bold' }}>🎉 Terminierte Arbeiten</h3>
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {scheduledTasks.map(task => {
              const diffMs = new Date(task.dueDate).getTime() - new Date().getTime();
              const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
              
              return (
                <Link key={task.id} href={`/dashboard/tasks/${task.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="glass-card" style={{ padding: '1rem', borderLeft: '4px solid #8a2be2', backgroundColor: 'rgba(138, 43, 226, 0.05)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ fontSize: '2rem' }}>⏰</div>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{task.title}</div>
                      <div style={{ color: '#8a2be2', fontWeight: 'bold', fontSize: '0.9rem' }}>
                        Am {new Date(task.dueDate).toLocaleDateString('de-DE')}
                        {diffDays > 0 && ` (In ${diffDays} Tagen!)`}
                        {diffDays === 0 && ` (HEUTE!)`}
                        {diffDays < 0 && ` (War vor ${Math.abs(diffDays)} Tagen)`}
                      </div>
                    </div>
                  </div>
                </Link>
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
          <Link key={task.id} href={`/dashboard/tasks/${task.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="glass-card" style={{ padding: '1rem', borderLeft: '4px solid var(--accent-primary)', height: '100%', display: 'flex', flexDirection: 'column' }}>
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
            </div>
          </Link>
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
