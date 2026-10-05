'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import GlobalCalendar from './GlobalCalendar';
import FinanceCard from './FinanceCard';

export default function Webheimat({ user, stats }: { user: any, stats: any }) {
  const [funding, setFunding] = useState<any>(null);
  const [news, setNews] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [equipmentBudget, setEquipmentBudget] = useState<any>(null);
  const [equipmentCategories, setEquipmentCategories] = useState<any[]>([]);
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
        const [fRes, nRes, pRes, faqRes, tasksRes, eqRes] = await Promise.all([
          fetch('/api/funding', fetchOpts).then(r => r.json()),
          fetch('/api/news', fetchOpts).then(r => r.json()),
          fetch('/api/polls', fetchOpts).then(r => r.json()),
          fetch('/api/faqs', fetchOpts).then(r => r.json()),
          fetch('/api/tasks', fetchOpts).then(r => r.json()),
          fetch('/api/equipment', fetchOpts).then(r => r.json())
        ]);
        if (fRes.funding) setFunding(fRes.funding);
        if (nRes.news) setNews(nRes.news);
        if (pRes.polls) setPolls(pRes.polls.filter((p:any) => p.isActive && !p.isArchived));
        if (faqRes.faqs) setFaqs(faqRes.faqs);
        if (tasksRes.tasks) setTasks(tasksRes.tasks);
        if (eqRes.budget) setEquipmentBudget(eqRes.budget);
        if (eqRes.categories) setEquipmentCategories(eqRes.categories);
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks', { cache: 'no-store' });
      const data = await res.json();
      if (data.tasks) setTasks(data.tasks);
    } catch (e) {
      console.error(e);
    }
  };

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


  let eqSpentAmount = 0;
  let eqPlannedAmount = 0;
  let eqTotalBudget = equipmentBudget ? equipmentBudget.totalAmount : 0;

  equipmentCategories.forEach(cat => {
    if (!cat.suggestions || cat.suggestions.length === 0) return;
    let topSuggestion = cat.suggestions[0];
    let maxVotes = topSuggestion.priorityVotes?.length || 0;
    cat.suggestions.forEach((s: any) => {
      let sCost = s.price || 0;
      if (s.materials) {
        s.materials.forEach((m: any) => { sCost += (m.quantity * m.pricePerUnit) || 0; });
      }
      if (s.status === 'PURCHASED') {
        eqSpentAmount += sCost;
        topSuggestion = s;
        maxVotes = 999999;
      } else if (s.status !== 'REJECTED' && (s.priorityVotes?.length || 0) > maxVotes) {
        maxVotes = s.priorityVotes?.length || 0;
        topSuggestion = s;
      }
    });
    if (topSuggestion && topSuggestion.status !== 'REJECTED') {
      let topCost = topSuggestion.price || 0;
      if (topSuggestion.materials) {
        topSuggestion.materials.forEach((m: any) => { topCost += (m.quantity * m.pricePerUnit) || 0; });
      }
      eqPlannedAmount += topCost;
    }
  });

  const eqSpentPercentage = eqTotalBudget > 0 ? (eqSpentAmount / eqTotalBudget) * 100 : 0;
  const eqPlannedDifference = eqPlannedAmount - eqTotalBudget;

  const money = (value: number) => value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const percent = (value: number, total: number) => total > 0 ? Math.max(0, value / total * 100) : 0;

  return (
    <div className="maker-overview" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
        <>
      <div className="maker-finance-grid">
        {funding && <FinanceCard
          title="Gesamtfinanzierung"
          value={money(Number(funding.disbursedAmount) + Number(funding.submittedAmount))}
          target={'von ' + money(Number(funding.totalAmount)) + ' Fördermitteln'}
          progress={percent(Number(funding.disbursedAmount) + Number(funding.submittedAmount), Number(funding.totalAmount))}
          progressLabel="Ausgezahlt & eingereicht"
          amounts={[
            {label: 'Ausgezahlt', value: money(Number(funding.disbursedAmount)), share: percent(Number(funding.disbursedAmount), Number(funding.totalAmount)), color: 'var(--success)'},
            {label: 'Eingereicht', value: money(Number(funding.submittedAmount)), share: percent(Number(funding.submittedAmount), Number(funding.totalAmount)), color: 'var(--accent-primary)'},
            {label: 'Noch offen', value: money(Math.max(0, Number(funding.totalAmount) - Number(funding.disbursedAmount) - Number(funding.submittedAmount)))}
          ]}
          footnote={funding.lastSubmittedDate ? 'Letzte Einreichung: ' + new Date(funding.lastSubmittedDate).toLocaleDateString('de-DE') + ' (' + calculateDaysAgo(funding.lastSubmittedDate) + ')' : 'Auszahlungen und eingereichte Fördermittel im Überblick.'}
        />}
        <FinanceCard
          title="Stunden-Förderwert"
          value={money((stats.hardcodedBaseHours + stats.systemActiveHours) * 20)}
          target={'von ' + money(stats.totalGoalHours * 20) + ' · ' + (stats.hardcodedBaseHours + stats.systemActiveHours).toLocaleString('de-DE') + ' / ' + stats.totalGoalHours.toLocaleString('de-DE') + ' h'}
          progress={percent(stats.hardcodedBaseHours + stats.systemActiveHours, stats.totalGoalHours)}
          progressLabel="Gemeinsam erarbeitet"
          amounts={[
            {label: 'Eingereicht', value: money(stats.hardcodedBaseHours * 20) + ' · ' + stats.hardcodedBaseHours.toLocaleString('de-DE') + ' h', share: percent(stats.hardcodedBaseHours, stats.totalGoalHours), color: 'var(--success)'},
            {label: 'Offen', value: money(stats.systemActiveHours * 20) + ' · ' + stats.systemActiveHours.toLocaleString('de-DE') + ' h', share: percent(stats.systemActiveHours, stats.totalGoalHours), color: 'var(--accent-primary)'},
            {label: 'Bis zum Ziel', value: money(Math.max(0, stats.totalGoalHours - stats.hardcodedBaseHours - stats.systemActiveHours) * 20)}
          ]}
          footnote="Jede erfasste Stunde entspricht 20 € Förderwert."
          link={{href: '/dashboard?tab=STUNDEN', label: 'Zur Zeiterfassung'}}
        />
        {equipmentBudget && <FinanceCard
          title="Ausstattungsbudget"
          value={money(eqSpentAmount)}
          target={'von ' + money(eqTotalBudget) + ' Budget'}
          progress={eqSpentPercentage}
          progressLabel="Bereits ausgegeben"
          amounts={[
            {label: 'Ausgegeben', value: money(eqSpentAmount), share: eqSpentPercentage, color: eqSpentAmount > eqTotalBudget ? 'var(--danger)' : 'var(--success)'},
            {label: 'Budget', value: money(eqTotalBudget)},
            {label: 'Geplant gesamt', value: money(eqPlannedAmount)},
            {label: 'Verfügbar nach Käufen', value: money(eqTotalBudget - eqSpentAmount)},
            {label: eqPlannedDifference > 0 ? 'Planung über Budget' : 'Spielraum zur Planung', value: money(Math.abs(eqPlannedDifference))}
          ]}
          footnote={'Verfügbar nach Käufen: ' + money(eqTotalBudget - eqSpentAmount)}
          link={{href: '/dashboard?tab=EQUIPMENT', label: 'Zur Ausstattung'}}
        />}
      </div>
      <section className="glass-card maker-open-tasks">
        <div className="maker-section-heading"><h2>Hier kannst du anpacken</h2><a href="/dashboard?tab=TASKS">Alle Aufgaben ↗</a></div>
        {tasks.filter(task => task.status === 'OPEN' || task.status === 'IN_PROGRESS').slice(0, 3).map(task => <Link key={task.id} href={'/dashboard/tasks/' + task.id} className="maker-task-row"><div><strong>{task.title}</strong><p>{task.status === 'IN_PROGRESS' ? 'In Bearbeitung' : 'Offen'} · {task.volunteers?.length || 0} Helfer dabei</p></div><span>Mitmachen ↗</span></Link>)}
        {!tasks.some(task => task.status === 'OPEN' || task.status === 'IN_PROGRESS') && <p className="maker-budget-note">Aktuell gibt es keine offenen Aufgaben. Im Kalender findest du unsere geplanten Arbeitsdienste.</p>}
      </section>
      <GlobalCalendar tasks={tasks} user={user} refetch={fetchTasks} />

      {(news.length > 0 || polls.length > 0) && <div className="maker-content-pair">
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
              <div className="maker-news-story">
                {n.imageUrl && (
                  <div className="maker-news-image" role="img" aria-label={n.title} style={{ backgroundImage: `url(${n.imageUrl})` }} />
                )}
                <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
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
                  {userVote && <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--success)' }}>✅ Du hast abgestimmt.</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      </div>}

      <div className="maker-content-pair">
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
      </div>
      
      </>

      <div style={{ paddingBottom: '3rem' }}></div>
    </div>
  );
}
