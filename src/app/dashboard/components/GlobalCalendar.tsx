'use client';
import { useState } from 'react';
import Link from 'next/link';

// Help functions to generate dates for a 4 week view
function get4Weeks() {
  const dates = [];
  const start = new Date();
  start.setHours(0,0,0,0);
  // Start from today, go 28 days forward
  for (let i = 0; i < 28; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d);
  }
  return dates;
}

export default function GlobalCalendar({ tasks, user, refetch }: { tasks: any[], user: any, refetch: () => void }) {
  const dates = get4Weeks();

  const handleVote = async (proposalId: string, vote: string) => {
    // find task id for this proposal
    let tId = '';
    for(const t of tasks) {
      if (t.dateProposals?.find((p:any) => p.id === proposalId)) {
        tId = t.id; break;
      }
    }

    if (!tId) return;

    await fetch(`/api/tasks/${tId}/proposals/${proposalId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, userName: user.name, vote })
    });
    refetch();
  };

  const getTimeLabel = (t: string) => {
    if (t === 'MORNING') return 'Vormittags';
    if (t === 'AFTERNOON') return 'Nachmittags';
    if (t === 'EVENING') return 'Abends';
    return 'Ganzen Tag';
  };

  return (
    <div className="glass-card" style={{ marginBottom: '2rem', overflowX: 'auto' }}>
      <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Kalender: Terminvorschläge Abstimmung</h2>
      
      <div style={{ display: 'flex', gap: '0.5rem', minWidth: '800px' }}>
        {dates.map((d, i) => {
          const dayProposals: any[] = [];
          
          tasks.forEach(t => {
            // Check for fixed dueDate
            if (t.dueDate) {
              const dDate = new Date(t.dueDate);
              if (dDate.toDateString() === d.toDateString()) {
                if (t.status === 'SCHEDULED') {
                  dayProposals.push({ type: 'FIXED', taskTitle: t.title, taskId: t.id, task: t });
                } else {
                  dayProposals.push({ type: 'OPEN_DATE', taskTitle: t.title, taskId: t.id, task: t });
                }
              }
            } else {
              // Check for proposals
              t.dateProposals?.forEach((p:any) => {
                const pDate = new Date(p.date);
                if (pDate.toDateString() === d.toDateString()) {
                  dayProposals.push({ type: 'PROPOSAL', taskTitle: t.title, taskId: t.id, proposal: p });
                }
              });
            }
          });

          const isToday = i === 0;
          const weekDay = d.toLocaleDateString('de-DE', { weekday: 'short' });
          const hasItems = dayProposals.length > 0;

          return (
            <div key={i} style={{ 
              flex: '1 0 100px', 
              minHeight: '120px', 
              backgroundColor: isToday ? 'var(--bg-secondary)' : 'var(--bg-primary)',
              border: hasItems ? '2px solid #8a2be2' : '1px solid var(--bg-hover)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.5rem',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: hasItems ? '#8a2be2' : 'var(--text-secondary)', textAlign: 'center', marginBottom: '0.5rem' }}>
                {weekDay} {d.getDate()}.{d.getMonth()+1}.
              </div>
              
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {dayProposals.map((item, idx) => {
                  if (item.type === 'FIXED') {
                    return (
                      <Link key={idx} href={`/dashboard/tasks/${item.taskId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{ backgroundColor: 'rgba(82, 196, 26, 0.2)', padding: '0.3rem', borderRadius: '4px', fontSize: '0.75rem', border: '1px solid #52c41a' }}>
                          <div style={{ fontWeight: 'bold', color: '#52c41a', lineHeight: 1.2 }}>✅ {item.taskTitle}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Fester Termin</div>
                        </div>
                      </Link>
                    );
                  }
                  
                  if (item.type === 'OPEN_DATE') {
                    return (
                      <Link key={idx} href={`/dashboard/tasks/${item.taskId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{ backgroundColor: 'rgba(24, 144, 255, 0.2)', padding: '0.3rem', borderRadius: '4px', fontSize: '0.75rem', border: '1px solid #1890ff' }}>
                          <div style={{ fontWeight: 'bold', color: '#1890ff', lineHeight: 1.2 }}>🔵 {item.taskTitle}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Offen</div>
                        </div>
                      </Link>
                    );
                  }

                  const p = item.proposal;
                  const myVote = p.votes?.find((v:any) => v.userId === user.id)?.vote;
                  const totalYes = p.votes?.filter((v:any) => v.vote === 'YES').length || 0;

                  return (
                    <div key={idx} style={{ backgroundColor: 'rgba(138, 43, 226, 0.1)', padding: '0.3rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                      <Link href={`/dashboard/tasks/${item.taskId}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                        <div style={{ fontWeight: 'bold', color: '#8a2be2', lineHeight: 1.2 }}>{item.taskTitle}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{getTimeLabel(p.timeOfDay)}</div>
                        <div style={{ fontSize: '0.65rem', marginBottom: '0.3rem' }}>Zusagen: {totalYes}</div>
                      </Link>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.2rem' }}>
                        <button 
                          onClick={() => handleVote(p.id, 'NO')}
                          style={{ flex: 1, background: myVote === 'NO' ? '#ff4d4f' : 'transparent', border: '1px solid #ff4d4f', borderRadius: '2px', cursor: 'pointer', padding: '0 2px' }}
                          title="Ich kann gar nicht"
                        >❌</button>
                        <button 
                          onClick={() => handleVote(p.id, 'MAYBE')}
                          style={{ flex: 1, background: myVote === 'MAYBE' ? '#faad14' : 'transparent', border: '1px solid #faad14', borderRadius: '2px', cursor: 'pointer', padding: '0 2px' }}
                          title="Vielleicht / Unter Vorbehalt"
                        >❓</button>
                        <button 
                          onClick={() => handleVote(p.id, 'YES')}
                          style={{ flex: 1, background: myVote === 'YES' ? '#52c41a' : 'transparent', border: '1px solid #52c41a', borderRadius: '2px', cursor: 'pointer', padding: '0 2px' }}
                          title="Ich bin sicher dabei"
                        >✅</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
