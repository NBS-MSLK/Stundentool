'use client';
import LinkedText from '@/app/components/LinkedText';
import { useState, useEffect } from 'react';
import Events from './Events';

export default function Webheimat({ user }: { user: { role: string } }) {
  const [news, setNews] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
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
        const fetchOpts = { cache: 'no-store' as RequestCache };
        const [nRes, pRes, faqRes] = await Promise.all([
          fetch('/api/news', fetchOpts).then(r => r.json()),
          fetch('/api/polls', fetchOpts).then(r => r.json()),
          fetch('/api/faqs', fetchOpts).then(r => r.json())
        ]);
        if (nRes.news) setNews(nRes.news);
        if (pRes.polls) setPolls(pRes.polls.filter((p:any) => p.isActive && !p.isArchived));
        if (faqRes.faqs) setFaqs(faqRes.faqs);
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, []);

  const handleVote = async (pollId: string, optionId: string) => {
    if (!user) return;
    const response = await fetch(`/api/polls/${pollId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionId })
    });
    if (!response.ok) {
      const data = await response.json();
      alert(data.error || 'Abstimmung fehlgeschlagen.');
      return;
    }
    // Refresh polls to get updated votes
    fetch('/api/polls').then(r => r.json()).then(pRes => {
      if (pRes.polls) setPolls(pRes.polls.filter((p:any) => p.isActive && !p.isArchived));
    });
  };

  return (
    <div className="maker-overview" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        <>
      <div className="maker-content-pair maker-start-top">
      {/* 4. News Section */}
      {(
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


            return (
              <div className="maker-news-story">
                {n.imageUrl && (
                  <div className="maker-news-image" role="img" aria-label={n.title} style={{ backgroundImage: `url(${n.imageUrl})` }} />
                )}
                <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>{n.title}</h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Von {n.author.name} am {new Date(n.createdAt).toLocaleDateString()}
                  </div>
                  <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, flex: 1, fontSize: '1rem' }}><LinkedText text={n.content} limit={isExpanded || !isLong ? n.content.length : 150} /></p>
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

      <Events canManage={user.role === 'ADMIN'} />
      </div>
      <div className="maker-content-pair">
      {/* 7. FAQ */}
      {(
        <div className="glass-card">
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Gut zu wissen · FAQ</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {faqs.length === 0 && <p className="agenda-empty">Hier findest du bald Antworten auf häufige Fragen.</p>}
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
      {/* 6. Instagram Embed */}
      <div className="glass-card">
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Instagram Feed</h2>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <iframe
            title="Instagram – MakerSpace Lübbecke"
            loading="lazy"
            src="https://www.instagram.com/makerspace_luebbecke/embed"
            width="100%"
            height="480"
            scrolling="no"
            style={{ border: 'none', overflow: 'hidden', borderRadius: 'var(--radius-md)', maxWidth: '500px' }}
          ></iframe>
        </div>
      </div>

      </div>
      <div>
      {/* 5. Aktuelle Umfrage */}
      {polls.length > 0 && (
        <div className="glass-card">
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Aktuelle Umfragen</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {polls.map(poll => {
              const userVote = poll.myOptionId;
              const totalVotes = poll.totalVotes;

              return (
                <div key={poll.id} style={{ padding: '1.5rem', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{poll.question}</h3>
                  <div style={{ fontSize: '0.85rem', color: poll.isAnonymous ? 'var(--warning)' : 'var(--text-secondary)', marginBottom: '1.5rem', fontWeight: poll.isAnonymous ? 'bold' : 'normal' }}>
                    {poll.isAnonymous ? 'ℹ️ Vertrauliche Abstimmung: Auch Administratoren sehen nur Summen. Deine Stimme bleibt änderbar; die Zuordnung wird dafür in der Datenbank gespeichert.' : 'ℹ️ Namentliche Abstimmung: Dein Name wird bei deiner gewählten Antwort für alle Mitglieder angezeigt. Deine Stimme bleibt änderbar.'}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {poll.options.map((opt:any) => {
                      const optVotes = opt.voteCount;
                      const percentage = totalVotes > 0 ? (optVotes / totalVotes) * 100 : 0;
                      const isSelected = userVote === opt.id;

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
                          {!poll.isAnonymous && opt.voterNames?.length > 0 && (
                            <div style={{ marginTop: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)', overflowWrap: 'anywhere' }}>
                              Abgestimmt: {opt.voterNames.join(', ')}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {userVote && <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--success-text)' }}>✅ Du hast abgestimmt.</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      </div>

      </>

      <div style={{ paddingBottom: '3rem' }}></div>
    </div>
  );
}
