'use client';
import { useState, useEffect } from 'react';

export default function WebheimatAdmin({ user }: { user: any }) {
  const [activeSubTab, setActiveSubTab] = useState('FUNDING');
  
  // Funding State
  const [funding, setFunding] = useState<any>(null);
  
  // News State
  const [news, setNews] = useState<any[]>([]);
  const [newNews, setNewNews] = useState({ title: '', content: '', imageUrl: '' });
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [editNewsData, setEditNewsData] = useState({ title: '', content: '', imageUrl: '' });
  
  // Polls State
  const [polls, setPolls] = useState<any[]>([]);
  const [newPoll, setNewPoll] = useState({ question: '', isAnonymous: false, options: ['', ''] });
  
  // FAQ State
  const [faqs, setFaqs] = useState<any[]>([]);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '', order: 0 });

  // Headlines State
  const [headlines, setHeadlines] = useState<any[]>([]);
  const [newHeadline, setNewHeadline] = useState({ content: '' });

  // Equipment State
  const [equipmentBudget, setEquipmentBudget] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategoryTitle, setNewCategoryTitle] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const fetchOpts = { cache: 'no-store' as RequestCache };
      const [fRes, nRes, pRes, faqRes, hRes, eqRes] = await Promise.all([
        fetch('/api/funding', fetchOpts).then(r => r.json()),
        fetch('/api/news', fetchOpts).then(r => r.json()),
        fetch('/api/polls', fetchOpts).then(r => r.json()),
        fetch('/api/faqs', fetchOpts).then(r => r.json()),
        fetch('/api/headlines', fetchOpts).then(r => r.json()),
        fetch('/api/equipment', fetchOpts).then(r => r.json())
      ]);
      if (fRes.funding) setFunding(fRes.funding);
      if (nRes.news) setNews(nRes.news);
      if (pRes.polls) setPolls(pRes.polls);
      if (faqRes.faqs) setFaqs(faqRes.faqs);
      if (hRes.headlines) setHeadlines(hRes.headlines);
      if (eqRes.budget) setEquipmentBudget(eqRes.budget);
      if (eqRes.categories) setCategories(eqRes.categories);
    } catch (e) {
      console.error(e);
    }
  };

  // --- Funding Actions ---
  const handleSaveFunding = async () => {
    await fetch('/api/funding', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(funding)
    });
    alert('Fördergelder gespeichert!');
  };

  // --- News Actions ---
  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newNews, authorId: user.id })
    });
    setNewNews({ title: '', content: '', imageUrl: '' });
    fetchData();
  };

  const handleDeleteNews = async (id: string) => {
    if (!confirm('News wirklich löschen?')) return;
    await fetch(`/api/news/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const handleUpdateNews = async (id: string) => {
    await fetch(`/api/news/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editNewsData)
    });
    setEditingNewsId(null);
    fetchData();
  };

  // --- Poll Actions ---
  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = newPoll.options.filter(o => o.trim());
    if (validOptions.length < 2) return alert('Mindestens 2 Optionen benötigt');
    
    await fetch('/api/polls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newPoll, options: validOptions })
    });
    setNewPoll({ question: '', isAnonymous: false, options: ['', ''] });
    fetchData();
  };

  const handleTogglePoll = async (id: string, currentStatus: boolean) => {
    await fetch(`/api/polls/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !currentStatus })
    });
    fetchData();
  };

  const handleArchivePoll = async (id: string, currentStatus: boolean) => {
    await fetch(`/api/polls/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isArchived: !currentStatus, isActive: false })
    });
    fetchData();
  };

  const handleDeletePoll = async (id: string) => {
    if (!confirm('Umfrage wirklich löschen?')) return;
    await fetch(`/api/polls/${id}`, { method: 'DELETE' });
    fetchData();
  };

  // --- FAQ Actions ---
  const handleCreateFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/faqs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newFaq)
    });
    setNewFaq({ question: '', answer: '', order: 0 });
    fetchData();
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm('FAQ wirklich löschen?')) return;
    await fetch(`/api/faqs/${id}`, { method: 'DELETE' });
    fetchData();
  };

  // --- Headline Actions ---
  const handleCreateHeadline = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/headlines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newHeadline, authorId: user.id })
    });
    setNewHeadline({ content: '' });
    fetchData();
  };

  const handleDeleteHeadline = async (id: string) => {
    if (!confirm('Kurzmeldung wirklich löschen?')) return;
    await fetch(`/api/headlines/${id}`, { method: 'DELETE' });
    fetchData();
  };

  return (
    <div className="glass-card" style={{ marginTop: '1rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', flexWrap: 'wrap' }}>
        <button onClick={() => setActiveSubTab('FUNDING')} className="btn-primary" style={{ backgroundColor: activeSubTab === 'FUNDING' ? 'var(--accent-primary)' : 'transparent', border: '1px solid var(--accent-primary)', padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>Fördermittel</button>
        <button onClick={() => setActiveSubTab('NEWS')} className="btn-primary" style={{ backgroundColor: activeSubTab === 'NEWS' ? 'var(--accent-primary)' : 'transparent', border: '1px solid var(--accent-primary)', padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>Nachrichten</button>
        <button onClick={() => setActiveSubTab('HEADLINES')} className="btn-primary" style={{ backgroundColor: activeSubTab === 'HEADLINES' ? 'var(--accent-primary)' : 'transparent', border: '1px solid var(--accent-primary)', padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>Kurzmeldungen</button>
        <button onClick={() => setActiveSubTab('POLLS')} className="btn-primary" style={{ backgroundColor: activeSubTab === 'POLLS' ? 'var(--accent-primary)' : 'transparent', border: '1px solid var(--accent-primary)', padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>Umfragen</button>
        <button onClick={() => setActiveSubTab('FAQS')} className="btn-primary" style={{ backgroundColor: activeSubTab === 'FAQS' ? 'var(--accent-primary)' : 'transparent', border: '1px solid var(--accent-primary)', padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>FAQs</button>
        <button onClick={() => setActiveSubTab('EQUIPMENT')} className="btn-primary" style={{ backgroundColor: activeSubTab === 'EQUIPMENT' ? 'var(--accent-primary)' : 'transparent', border: '1px solid var(--accent-primary)', padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>Anschaffungen</button>
      </div>

      {activeSubTab === 'FUNDING' && funding && (
        <div>
          <h2 style={{ marginBottom: '1rem' }}>Fördergelder anpassen</h2>
          <div style={{ display: 'grid', gap: '1rem', maxWidth: '400px' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--warning)' }}>
              ⚠️ Bitte Beträge <b>ohne</b> Tausendertrennzeichen eingeben (z.B. 28202 anstatt 28.202). Dezimalstellen ggf. mit Punkt.
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Gesamtsumme (€)</label>
              <input type="number" step="0.01" className="input-field" value={funding.totalAmount} onChange={e => setFunding({...funding, totalAmount: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Ausgezahlt (€)</label>
              <input type="number" step="0.01" className="input-field" value={funding.disbursedAmount} onChange={e => setFunding({...funding, disbursedAmount: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Eingereicht (€)</label>
              <input type="number" step="0.01" className="input-field" value={funding.submittedAmount} onChange={e => setFunding({...funding, submittedAmount: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Datum der letzten Einreichung</label>
              <input type="date" className="input-field" value={funding.lastSubmittedDate ? funding.lastSubmittedDate.split('T')[0] : ''} onChange={e => setFunding({...funding, lastSubmittedDate: e.target.value})} />
            </div>

            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Stundentool Werte</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Fest eingereichte Stunden (Basiswert)</label>
                  <input type="number" step="1" className="input-field" value={funding.baseHours ?? 619} onChange={e => setFunding({...funding, baseHours: parseInt(e.target.value) || 0})} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Ziel-Stunden (Projekt-Gesamtwert)</label>
                  <input type="number" step="1" className="input-field" value={funding.goalHours ?? 2700} onChange={e => setFunding({...funding, goalHours: parseInt(e.target.value) || 0})} />
                </div>
              </div>
            </div>

            <button onClick={handleSaveFunding} className="btn-success" style={{ marginTop: '1rem', width: 'fit-content', padding: '0.5rem 1.2rem', fontSize: '1rem' }}>Speichern</button>
          </div>
        </div>
      )}

      {activeSubTab === 'EQUIPMENT' && equipmentBudget && (
        <div>
          <h2 style={{ marginBottom: '1rem' }}>Anschaffungen & Budget</h2>
          <div style={{ display: 'grid', gap: '1rem', maxWidth: '400px', marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--warning)' }}>
              ⚠️ Bitte Beträge <b>ohne</b> Tausendertrennzeichen eingeben (z.B. 12000 anstatt 12.000). Dezimalstellen ggf. mit Punkt.
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Gesamtbudget Equipment (€)</label>
              <input type="number" step="0.01" className="input-field" value={equipmentBudget.totalAmount} onChange={e => setEquipmentBudget({...equipmentBudget, totalAmount: e.target.value})} />
            </div>
            <button onClick={async () => {
              await fetch('/api/equipment/budget', {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(equipmentBudget)
              });
              alert('Equipment-Budget gespeichert!');
            }} className="btn-success" style={{ width: 'fit-content', padding: '0.5rem 1.2rem', fontSize: '1rem' }}>Budget Speichern</button>
          </div>

          <h3 style={{ marginBottom: '1rem' }}>Neue Kategorie / Gerät anlegen</h3>
          <form onSubmit={async (e) => {
            e.preventDefault();
            await fetch('/api/equipment', {
              method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: newCategoryTitle })
            });
            setNewCategoryTitle('');
            fetchData();
          }} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', maxWidth: '600px' }}>
            <input type="text" className="input-field" placeholder="Kategoriename (z.B. '3D-Drucker')" value={newCategoryTitle} onChange={e => setNewCategoryTitle(e.target.value)} required />
            <button type="submit" className="btn-success" style={{ padding: '0.5rem 1.2rem', fontSize: '1rem', whiteSpace: 'nowrap' }}>Hinzufügen</button>
          </form>

          <h3 style={{ marginBottom: '1rem' }}>Bestehende Kategorien</h3>
          {categories.map(cat => (
            <div key={cat.id} style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <strong style={{ fontSize: '1.1rem' }}>{cat.title}</strong>
                <button onClick={async () => {
                  if (!confirm('Kategorie wirklich löschen?')) return;
                  await fetch(`/api/equipment/${cat.id}`, { method: 'DELETE' });
                  fetchData();
                }} className="btn-danger" style={{ padding: '0.3rem 0.7rem', height: 'auto', fontSize: '0.85rem' }}>Kategorie Löschen</button>
              </div>
              <div style={{ marginTop: '1rem' }}>
                {cat.suggestions.length === 0 ? <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Keine Vorschläge in dieser Kategorie.</p> : (
                  <table style={{ width: '100%', fontSize: '0.9rem', textAlign: 'left', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{ padding: '0.5rem' }}>Titel</th>
                        <th style={{ padding: '0.5rem' }}>Preis</th>
                        <th style={{ padding: '0.5rem' }}>Status</th>
                        <th style={{ padding: '0.5rem' }}>Aktion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cat.suggestions.map((s: any) => (
                        <tr key={s.id} style={{ borderBottom: '1px solid var(--bg-secondary)' }}>
                          <td style={{ padding: '0.5rem' }}>{s.title}</td>
                          <td style={{ padding: '0.5rem' }}>{s.price} €</td>
                          <td style={{ padding: '0.5rem' }}>
                            <select 
                              value={s.status} 
                              onChange={async (e) => {
                                await fetch(`/api/equipment/suggestions/${s.id}`, {
                                  method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: e.target.value })
                                });
                                fetchData();
                              }}
                              style={{ padding: '0.3rem', borderRadius: '4px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                            >
                              <option value="PROPOSED">Vorgeschlagen</option>
                              <option value="APPROVED">Angenommen</option>
                              <option value="REJECTED">Abgelehnt</option>
                              <option value="PURCHASED">Angeschafft</option>
                            </select>
                          </td>
                          <td style={{ padding: '0.5rem' }}>
                            <button onClick={async () => {
                              if (!confirm('Vorschlag wirklich löschen?')) return;
                              await fetch(`/api/equipment/suggestions/${s.id}`, { method: 'DELETE' });
                              fetchData();
                            }} className="btn-danger" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', height: 'auto' }}>Löschen</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeSubTab === 'NEWS' && (
        <div>
          <h2 style={{ marginBottom: '1rem' }}>Neue Nachricht verfassen</h2>
          <form onSubmit={handleCreateNews} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem', maxWidth: '600px' }}>
            <input type="text" className="input-field" placeholder="Überschrift" value={newNews.title} onChange={e => setNewNews({...newNews, title: e.target.value})} required />
            <input type="url" className="input-field" placeholder="Bild URL (Optional)" value={newNews.imageUrl} onChange={e => setNewNews({...newNews, imageUrl: e.target.value})} />
            <textarea className="input-field" rows={4} placeholder="Inhalt der Nachricht..." value={newNews.content} onChange={e => setNewNews({...newNews, content: e.target.value})} required />
            <button type="submit" className="btn-success" style={{ width: 'fit-content', padding: '0.5rem 1.2rem', fontSize: '1rem' }}>Nachricht veröffentlichen</button>
          </form>
          
          <h3 style={{ marginBottom: '1rem' }}>Aktuelle Nachrichten</h3>
          {news.map(n => (
            <div key={n.id} style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}>
              {editingNewsId === n.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <input type="text" className="input-field" value={editNewsData.title} onChange={e => setEditNewsData({...editNewsData, title: e.target.value})} required />
                  <input type="url" className="input-field" placeholder="Bild URL (Optional)" value={editNewsData.imageUrl} onChange={e => setEditNewsData({...editNewsData, imageUrl: e.target.value})} />
                  <textarea className="input-field" rows={4} value={editNewsData.content} onChange={e => setEditNewsData({...editNewsData, content: e.target.value})} required />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleUpdateNews(n.id)} className="btn-success" style={{ padding: '0.5rem 1rem' }}>Speichern</button>
                    <button onClick={() => setEditingNewsId(null)} className="btn-danger" style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--text-secondary)' }}>Abbrechen</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <strong style={{ fontSize: '1.1rem' }}>{n.title}</strong>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => { setEditingNewsId(n.id); setEditNewsData({ title: n.title, content: n.content, imageUrl: n.imageUrl || '' }); }} className="btn-primary" style={{ backgroundColor: 'var(--accent-primary)', padding: '0.3rem 0.7rem', height: 'auto', fontSize: '0.85rem' }}>Bearbeiten</button>
                      <button onClick={() => handleDeleteNews(n.id)} className="btn-danger" style={{ padding: '0.3rem 0.7rem', height: 'auto', fontSize: '0.85rem' }}>Löschen</button>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Von {n.author?.name || 'Unbekannt'} am {new Date(n.createdAt).toLocaleDateString()}</div>
                  <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>{n.content}</p>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {activeSubTab === 'POLLS' && (
        <div>
          <h2 style={{ marginBottom: '1rem' }}>Neue Umfrage erstellen</h2>
          <form onSubmit={handleCreatePoll} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem', maxWidth: '600px' }}>
            <input type="text" className="input-field" placeholder="Umfrage-Frage" value={newPoll.question} onChange={e => setNewPoll({...newPoll, question: e.target.value})} required />
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={newPoll.isAnonymous} onChange={e => setNewPoll({...newPoll, isAnonymous: e.target.checked})} style={{ width: '18px', height: '18px' }} />
              Anonyme Abstimmung (Namen werden nicht gespeichert)
            </label>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Antwortmöglichkeiten:</label>
              {newPoll.options.map((opt, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input type="text" className="input-field" placeholder={`Option ${idx + 1}`} value={opt} onChange={e => {
                    const fresh = [...newPoll.options];
                    fresh[idx] = e.target.value;
                    setNewPoll({...newPoll, options: fresh});
                  }} />
                  {idx === newPoll.options.length - 1 && (
                    <button type="button" onClick={() => setNewPoll({...newPoll, options: [...newPoll.options, '']})} className="btn-primary" style={{ backgroundColor: 'var(--bg-secondary)', padding: '0 0.5rem', fontSize: '0.9rem' }}>+</button>
                  )}
                </div>
              ))}
            </div>
            <button type="submit" className="btn-success" style={{ width: 'fit-content', padding: '0.5rem 1.2rem', fontSize: '1rem' }}>Umfrage starten</button>
          </form>

          <h3 style={{ marginBottom: '1rem' }}>Aktive Umfragen</h3>
          {polls.filter(p => !p.isArchived).map(p => (
            <div key={p.id} style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', backgroundColor: p.isActive ? 'rgba(var(--accent-primary-rgb), 0.05)' : 'transparent' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <strong style={{ fontSize: '1.1rem' }}>{p.question} {p.isAnonymous && <span style={{ fontSize: '0.8rem', color: 'var(--warning)', fontWeight: 'normal' }}>(Anonym)</span>}</strong>
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  <button onClick={() => handleTogglePoll(p.id, p.isActive)} style={{ backgroundColor: p.isActive ? '#faad14' : '#52c41a', padding: '0.3rem 0.7rem', height: 'auto', color: p.isActive ? 'black' : 'white', fontSize: '0.85rem', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                    {p.isActive ? 'Deaktivieren' : 'Aktivieren'}
                  </button>
                  <button onClick={() => handleArchivePoll(p.id, p.isArchived)} className="btn-primary" style={{ backgroundColor: 'var(--text-secondary)', padding: '0.3rem 0.7rem', height: 'auto', fontSize: '0.85rem' }}>
                    Archivieren
                  </button>
                  <button onClick={() => handleDeletePoll(p.id)} className="btn-danger" style={{ padding: '0.3rem 0.7rem', height: 'auto', fontSize: '0.85rem' }}>Löschen</button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '1rem' }}>
                {p.options.map((o: any) => (
                  <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px' }}>
                    <span>{o.text}</span>
                    <strong>{o.votes.length} Votes</strong>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {polls.filter(p => p.isArchived).length > 0 && (
            <>
              <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Archivierte Umfragen</h3>
              {polls.filter(p => p.isArchived).map(p => (
                <div key={p.id} style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', opacity: 0.7 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <strong style={{ fontSize: '1.1rem' }}>{p.question} (Archiviert)</strong>
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      <button onClick={() => handleArchivePoll(p.id, p.isArchived)} className="btn-primary" style={{ backgroundColor: '#52c41a', padding: '0.3rem 0.7rem', height: 'auto', fontSize: '0.85rem', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Wiederherstellen
                      </button>
                      <button onClick={() => handleDeletePoll(p.id)} className="btn-danger" style={{ padding: '0.3rem 0.7rem', height: 'auto', fontSize: '0.85rem' }}>Löschen</button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '1rem' }}>
                    {p.options.map((o: any) => (
                      <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', fontSize: '0.85rem' }}>
                        <span>{o.text}</span>
                        <strong>{o.votes.length} Votes</strong>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {activeSubTab === 'FAQS' && (
        <div>
          <h2 style={{ marginBottom: '1rem' }}>Neuen FAQ Eintrag erstellen</h2>
          <form onSubmit={handleCreateFaq} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem', maxWidth: '600px' }}>
            <input type="text" className="input-field" placeholder="Frage" value={newFaq.question} onChange={e => setNewFaq({...newFaq, question: e.target.value})} required />
            <textarea className="input-field" rows={3} placeholder="Antwort" value={newFaq.answer} onChange={e => setNewFaq({...newFaq, answer: e.target.value})} required />
            <input type="number" className="input-field" placeholder="Reihenfolge (0, 1, 2...)" value={newFaq.order} onChange={e => setNewFaq({...newFaq, order: parseInt(e.target.value) || 0})} />
            <button type="submit" className="btn-success" style={{ width: 'fit-content', padding: '0.5rem 1.2rem', fontSize: '1rem' }}>FAQ hinzufügen</button>
          </form>

          <h3 style={{ marginBottom: '1rem' }}>Bestehende FAQs</h3>
          {faqs.map(faq => (
            <div key={faq.id} style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <strong style={{ fontSize: '1.1rem' }}>{faq.question}</strong>
                <button onClick={() => handleDeleteFaq(faq.id)} className="btn-danger" style={{ padding: '0.3rem 0.7rem', height: 'auto', fontSize: '0.85rem' }}>Löschen</button>
              </div>
              <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>{faq.answer}</p>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Sortierung: {faq.order}</div>
            </div>
          ))}
        </div>
      )}

      {activeSubTab === 'HEADLINES' && (
        <div>
          <h2 style={{ marginBottom: '1rem' }}>Neue Kurzmeldung verfassen</h2>
          <form onSubmit={handleCreateHeadline} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem', maxWidth: '600px' }}>
            <input type="text" className="input-field" placeholder="Kurzer Text (z.B. 'Werkbank ist aufgebaut')" value={newHeadline.content} onChange={e => setNewHeadline({...newHeadline, content: e.target.value})} required maxLength={150} />
            <button type="submit" className="btn-success" style={{ width: 'fit-content', padding: '0.5rem 1.2rem', fontSize: '1rem' }}>Kurzmeldung veröffentlichen</button>
          </form>
          
          <h3 style={{ marginBottom: '1rem' }}>Aktuelle Kurzmeldungen</h3>
          {headlines.map(h => (
            <div key={h.id} style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem' }}>{h.content}</p>
                <button onClick={() => handleDeleteHeadline(h.id)} className="btn-danger" style={{ padding: '0.3rem 0.7rem', height: 'auto', fontSize: '0.85rem' }}>Löschen</button>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Von {h.author?.name} am {new Date(h.createdAt).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
