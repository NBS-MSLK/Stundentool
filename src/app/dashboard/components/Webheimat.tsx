'use client';
import { useState, useEffect } from 'react';
import GlobalCalendar from './GlobalCalendar';

export default function Webheimat({ user, stats }: { user: any, stats: any }) {
  const [funding, setFunding] = useState<any>(null);
  const [news, setNews] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [expandedNews, setExpandedNews] = useState<{[key: string]: boolean}>({});
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const [expandedFaq, setExpandedFaq] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    if (news.length > 0 && currentNewsIndex >= news.length) {
      setCurrentNewsIndex(0);
    }
  }, [news, currentNewsIndex]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fRes, nRes, pRes, faqRes, tasksRes] = await Promise.all([
          fetch('/api/funding').then(r => r.json()),
          fetch('/api/news').then(r => r.json()),
          fetch('/api/polls').then(r => r.json()),
          fetch('/api/faqs').then(r => r.json()),
          fetch('/api/tasks').then(r => r.json())
        ]);
        if (fRes.funding) setFunding(fRes.funding);
        if (nRes.news) setNews(nRes.news);
        if (pRes.polls) setPolls(pRes.polls.filter((p:any) => p.isActive && !p.isArchived));
        if (faqRes.faqs) setFaqs(faqRes.faqs);
        if (tasksRes.tasks) setTasks(tasksRes.tasks);
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      if (data.tasks) setTasks(data.tasks);
    } catch (e) {
      console.error(e);
    }
  };

  const handleVote = async (pollId: string, optionId: string) => {
    if (!user) return;
    await fetch(`/api/polls/${pollId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionId, userId: user.id, userName: user.name })
    });
    // Refresh polls to get updated votes
    fetch('/api/polls').then(r => r.json()).then(pRes => {
      if (pRes.polls) setPolls(pRes.polls.filter((p:any) => p.isActive && !p.isArchived));
    });
  };

  const calculateDaysAgo = (dateStr: string) => {
    if (!dateStr) return null;
    const past = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - past.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'heute';
    if (diffDays === 1) return 'gestern';
    
    const weeks = Math.floor(diffDays / 7);
    const days = diffDays % 7;
    
    if (weeks === 0) return `vor ${days} Tagen`;
    return `vor ${weeks} Wochen${days > 0 ? ` und ${days} Tagen` : ''}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* 1. Fördergeld-Statusbalken */}
      {funding && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 600, alignItems: 'center', flexWrap: 'wrap' }}>
            <span>Fördermittel-Status</span>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '1.2rem', color: '#ffd700', textShadow: '0 0 10px rgba(255,215,0,0.3)' }}>
                {(funding.disbursedAmount + funding.submittedAmount).toLocaleString('de-DE')} € / {funding.totalAmount.toLocaleString('de-DE')} €
              </span>
            </div>
          </div>
          
          <div style={{ width: '100%', backgroundColor: 'var(--bg-secondary)', height: '1.8rem', borderRadius: 'var(--radius-full)', overflow: 'hidden', display: 'flex' }}>
            <div 
              style={{ width: `${(funding.disbursedAmount / funding.totalAmount) * 100}%`, backgroundColor: 'var(--success)', height: '100%', transition: 'width 0.5s ease-in-out' }} 
              title="Ausgezahlt"
            ></div>
            <div 
              style={{ width: `${(funding.submittedAmount / funding.totalAmount) * 100}%`, backgroundColor: 'var(--accent-primary)', height: '100%', transition: 'width 0.5s ease-in-out' }} 
              title="Eingereicht (Wartend)"
            ></div>
          </div>
          
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--success)' }}></div>
                Bereits ausgezahlt: {funding.disbursedAmount.toLocaleString('de-DE')} €
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)' }}></div>
                Eingereicht: {funding.submittedAmount.toLocaleString('de-DE')} €
              </div>
            </div>
            {funding.lastSubmittedDate && (
              <div style={{ fontStyle: 'italic' }}>
                Letzte Einreichung am {new Date(funding.lastSubmittedDate).toLocaleDateString('de-DE')} ({calculateDaysAgo(funding.lastSubmittedDate)})
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Kalender & Termine */}
      <div className="glass-card">
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Kalender & Termine</h2>
        <div style={{ marginBottom: '1.5rem' }}>
          <GlobalCalendar tasks={tasks} user={user} refetch={fetchTasks} />
        </div>
        
        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Anstehende Arbeitsdienste</h3>
        {tasks.filter(t => t.status === 'SCHEDULED').length > 0 ? (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {tasks.filter(t => t.status === 'SCHEDULED').map(t => (
              <div key={t.id} style={{ padding: '1rem', border: '1px solid #52c41a', backgroundColor: 'rgba(82, 196, 26, 0.05)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#52c41a' }}>{t.title}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Termin: {new Date(t.dueDate).toLocaleDateString('de-DE')}
                  </div>
                </div>
                <div style={{ fontSize: '0.85rem' }}>
                  Verantwortlich: {t.creator?.name || 'Unbekannt'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Aktuell sind keine Arbeitsdienste fest terminiert.</div>
        )}
      </div>

      {/* 3. Stundentool Balken */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 600, alignItems: 'center', flexWrap: 'wrap' }}>
          <span>Projekt-Förderwert (Stunden)</span>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '1.2rem', color: '#ffd700', textShadow: '0 0 10px rgba(255,215,0,0.3)' }}>
              {((stats.hardcodedBaseHours + stats.systemArchivedHours + stats.systemActiveHours) * 20).toLocaleString('de-DE')} € / {(stats.totalGoalHours * 20).toLocaleString('de-DE')} €
            </span>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
              ({stats.hardcodedBaseHours + stats.systemArchivedHours + stats.systemActiveHours} / {stats.totalGoalHours} Stunden)
            </div>
          </div>
        </div>
        <div style={{ width: '100%', backgroundColor: 'var(--bg-secondary)', height: '1.8rem', borderRadius: 'var(--radius-full)', overflow: 'hidden', display: 'flex' }}>
          <div 
            style={{ width: `${((stats.hardcodedBaseHours + stats.systemArchivedHours) / stats.totalGoalHours) * 100}%`, backgroundColor: 'var(--success)', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.8rem', fontWeight: 'bold' }} 
            title="Eingereicht / Archiviert"
          >
            {((stats.hardcodedBaseHours + stats.systemArchivedHours) / stats.totalGoalHours) * 100 > 10 && `${((stats.hardcodedBaseHours + stats.systemArchivedHours) * 20).toLocaleString('de-DE')} €`}
          </div>
          <div 
            style={{ width: `${(stats.systemActiveHours / stats.totalGoalHours) * 100}%`, backgroundColor: 'var(--accent-primary)', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.8rem', fontWeight: 'bold' }} 
            title="Offen / Neu"
          >
             {(stats.systemActiveHours / stats.totalGoalHours) * 100 > 5 && `${(stats.systemActiveHours * 20).toLocaleString('de-DE')} €`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--success)' }}></div>
            Bereits eingereicht: {((stats.hardcodedBaseHours + stats.systemArchivedHours) * 20).toLocaleString('de-DE')} € ({stats.hardcodedBaseHours + stats.systemArchivedHours}h)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)' }}></div>
            Offener Förderwert: {(stats.systemActiveHours * 20).toLocaleString('de-DE')} € ({stats.systemActiveHours}h)
          </div>
        </div>
      </div>

      {/* 4. News Section */}
      {news.length > 0 && (
        <div className="glass-card">
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Neueste Nachrichten</h2>
          
          {news.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              Noch keine Nachrichten vorhanden.
            </div>
          )}
          
          {(() => {
            const n = news[currentNewsIndex];
            if (!n) return null;
            const isExpanded = expandedNews[n.id];
            const isLong = n.content.length > 150;
            const content = isExpanded || !isLong ? n.content : n.content.substring(0, 150) + '...';

            return (
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                {n.imageUrl && (
                  <div style={{ flex: '1 1 250px', minHeight: '250px', backgroundImage: `url(${n.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: 'var(--radius-md)' }} />
                )}
                <div style={{ flex: '2 1 300px', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>{n.title}</h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Von {n.author.name} am {new Date(n.createdAt).toLocaleDateString()}
                  </div>
                  <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, flex: 1, fontSize: '1rem' }}>{content}</p>
                  {isLong && (
                    <button 
                      onClick={() => setExpandedNews({...expandedNews, [n.id]: !isExpanded})} 
                      className="btn-primary" 
                      style={{ 
                        alignSelf: 'flex-start', 
                        marginTop: '1rem',
                        padding: '0.5rem 1.5rem', 
                        backgroundColor: 'var(--accent-primary)',
                        color: 'white',
                        fontWeight: 'bold',
                        borderRadius: 'var(--radius-full)'
                      }}
                    >
                      {isExpanded ? 'Weniger anzeigen' : 'Weiterlesen'}
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          {news.length > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <button 
                onClick={() => setCurrentNewsIndex(prev => prev > 0 ? prev - 1 : news.length - 1)}
                className="btn-primary"
                style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              >
                &larr; Vorherige
              </button>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {currentNewsIndex + 1} von {news.length}
              </div>
              <button 
                onClick={() => setCurrentNewsIndex(prev => prev < news.length - 1 ? prev + 1 : 0)}
                className="btn-primary"
                style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              >
                Nächste &rarr;
              </button>
            </div>
          )}
        </div>
      )}

      {/* 5. Aktuelle Umfrage */}
      {polls.length > 0 && (
        <div className="glass-card">
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Aktuelle Umfragen</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {polls.map(poll => {
              const userVote = poll.votes.find((v:any) => v.userId === user?.id);
              const totalVotes = poll.votes.length;

              return (
                <div key={poll.id} style={{ padding: '1.5rem', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{poll.question}</h3>
                  <div style={{ fontSize: '0.85rem', color: poll.isAnonymous ? 'var(--warning)' : 'var(--text-secondary)', marginBottom: '1.5rem', fontWeight: poll.isAnonymous ? 'bold' : 'normal' }}>
                    {poll.isAnonymous ? 'ℹ️ Diese Umfrage ist anonym. Namen werden nicht gespeichert.' : 'ℹ️ Dein Name wird bei der Abstimmung gespeichert.'}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {poll.options.map((opt:any) => {
                      const optVotes = opt.votes.length;
                      const percentage = totalVotes > 0 ? (optVotes / totalVotes) * 100 : 0;
                      const isSelected = userVote?.optionId === opt.id;

                      return (
                        <div key={opt.id}>
                          <button 
                            onClick={() => handleVote(poll.id, opt.id)}
                            className="btn-primary"
                            style={{ 
                              width: '100%', 
                              textAlign: 'left', 
                              backgroundColor: isSelected ? 'var(--accent-primary)' : 'var(--bg-secondary)', 
                              border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                              padding: '1rem',
                              position: 'relative',
                              overflow: 'hidden',
                              zIndex: 1
                            }}
                          >
                            <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${percentage}%`, backgroundColor: isSelected ? 'rgba(0,0,0,0.2)' : 'rgba(var(--accent-primary-rgb), 0.1)', zIndex: -1, transition: 'width 0.5s ease-in-out' }}></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', zIndex: 2 }}>
                              <span style={{ fontWeight: isSelected ? 'bold' : 'normal', color: isSelected ? 'white' : 'inherit' }}>{opt.text}</span>
                              {userVote && <span style={{ fontWeight: 'bold', color: isSelected ? 'white' : 'var(--text-secondary)' }}>{optVotes} ({Math.round(percentage)}%)</span>}
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  {userVote && <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--success)' }}>✅ Du hast abgestimmt.</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Instagram Embed */}
      <div className="glass-card">
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Instagram Feed</h2>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <iframe 
            src="https://www.instagram.com/makerspace_luebbecke/embed" 
            width="100%" 
            height="480" 
            frameBorder="0" 
            scrolling="no" 
            allowtransparency="true"
            style={{ border: 'none', overflow: 'hidden', borderRadius: 'var(--radius-md)', maxWidth: '500px' }}
          ></iframe>
        </div>
      </div>

      {/* 7. FAQ */}
      {faqs.length > 0 && (
        <div className="glass-card">
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Häufig gestellte Fragen (FAQ)</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {faqs.map(faq => {
              const isExpanded = expandedFaq[faq.id];
              return (
                <div key={faq.id} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                  <button 
                    onClick={() => setExpandedFaq({...expandedFaq, [faq.id]: !isExpanded})} 
                    style={{ width: '100%', padding: '1rem', textAlign: 'left', backgroundColor: isExpanded ? 'var(--bg-hover)' : 'var(--bg-primary)', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-primary)' }}
                  >
                    {faq.question}
                    <span>{isExpanded ? '−' : '+'}</span>
                  </button>
                  {isExpanded && (
                    <div style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      <div style={{ paddingBottom: '3rem' }}></div>
    </div>
  );
}
