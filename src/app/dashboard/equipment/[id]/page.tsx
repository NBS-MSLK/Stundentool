'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EquipmentDetail({ params }: { params: Promise<{ id: string }> }) {
  const [suggestion, setSuggestion] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [newNote, setNewNote] = useState('');
  const [newMaterial, setNewMaterial] = useState({ name: '', quantity: 1, pricePerUnit: 0, buyLink: '' });
  const [suggestionId, setSuggestionId] = useState<string>('');
  const [categories, setCategories] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    params.then(p => {
      setSuggestionId(p.id);
    });
    const userJson = localStorage.getItem('user');
    if (!userJson) {
      router.push('/');
      return;
    }
    setUser(JSON.parse(userJson));
  }, [params, router]);

  const fetchData = async () => {
    if (!suggestionId) return;
    try {
      const res = await fetch(`/api/equipment/suggestions/${suggestionId}`);
      const data = await res.json();
      if (data.suggestion) setSuggestion(data.suggestion);
      
      const catRes = await fetch('/api/equipment', { cache: 'no-store' });
      const catData = await catRes.json();
      if (catData.categories) setCategories(catData.categories);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, [suggestionId]);

  const handleUpdateSuggestion = async (field: string, value: any) => {
    await fetch(`/api/equipment/suggestions/${suggestionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value })
    });
    fetchData();
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterial.name) return;
    await fetch(`/api/equipment/suggestions/${suggestionId}/materials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMaterial)
    });
    setNewMaterial({ name: '', quantity: 1, pricePerUnit: 0, buyLink: '' });
    fetchData();
  };

  const handleDeleteMaterial = async (materialId: string) => {
    if (!confirm('Zubehör wirklich löschen?')) return;
    await fetch(`/api/equipment/materials/${materialId}`, { method: 'DELETE' });
    fetchData();
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    await fetch(`/api/equipment/suggestions/${suggestionId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, content: newNote })
    });
    setNewNote('');
    fetchData();
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Notiz wirklich löschen?')) return;
    await fetch(`/api/equipment/notes/${noteId}`, { method: 'DELETE' });
    fetchData();
  };

  const handleDeleteSuggestion = async () => {
    if (!confirm('Diesen Vorschlag inkl. aller Notizen und Zubehör wirklich unwiderruflich löschen?')) return;
    await fetch(`/api/equipment/suggestions/${suggestionId}`, { method: 'DELETE' });
    router.push('/dashboard?tab=EQUIPMENT');
  };

  if (!suggestion || !user) return <div className="container">Lade Details...</div>;

  const isAdmin = user.role === 'ADMIN';
  const isCreator = user.id === suggestion.creatorId;
  const canEdit = isAdmin || isCreator;

  let totalMatCost = 0;
  suggestion.materials.forEach((m: any) => { totalMatCost += m.quantity * m.pricePerUnit; });
  const totalPrice = suggestion.price + totalMatCost;

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <Link href="/dashboard?tab=EQUIPMENT" className="btn-primary" style={{ backgroundColor: 'var(--text-secondary)' }}>&larr; Zurück</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>Kategorie:</span>
          {isAdmin ? (
            <select 
              className="input-field" 
              value={suggestion.categoryId} 
              onChange={e => {
                const newCatId = e.target.value;
                setSuggestion({...suggestion, categoryId: newCatId});
                handleUpdateSuggestion('categoryId', newCatId);
              }}
              style={{ padding: '0.2rem 0.5rem', width: 'auto' }}
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.title}</option>
              ))}
            </select>
          ) : (
            <span style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>{suggestion.category?.title}</span>
          )}
        </div>
      </div>

      <div className="glass-card" style={{ padding: '2rem' }}>
        
        {/* Full width title header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
          {canEdit ? (
            <input 
              type="text" 
              className="input-field" 
              value={suggestion.title} 
              onChange={e => setSuggestion({...suggestion, title: e.target.value})}
              onBlur={e => handleUpdateSuggestion('title', e.target.value)}
              style={{ fontSize: '1.5rem', fontWeight: 'bold', padding: '0.5rem', flex: 1, minWidth: '200px' }}
            />
          ) : (
            <h1 style={{ fontSize: '1.8rem', margin: 0, flex: 1 }}>{suggestion.title}</h1>
          )}

          {canEdit && (
            <div>
              {suggestion.status === 'PURCHASED' ? (
                <span style={{ backgroundColor: 'rgba(46, 204, 113, 0.2)', color: 'var(--success)', padding: '0.4rem 1rem', borderRadius: 'var(--radius-full)', fontWeight: 'bold', whiteSpace: 'nowrap' }}>✓ Angeschafft</span>
              ) : suggestion.status === 'REJECTED' ? (
                <span style={{ backgroundColor: 'rgba(231, 76, 60, 0.2)', color: 'var(--danger)', padding: '0.4rem 1rem', borderRadius: 'var(--radius-full)', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Abgelehnt</span>
              ) : (
                <button 
                  onClick={() => {
                    if(confirm('Möchtest du dieses Gerät als "Angeschafft" markieren? Alle Alternativen in dieser Kategorie werden dadurch automatisch abgelehnt.')) {
                      setSuggestion({...suggestion, status: 'PURCHASED'});
                      handleUpdateSuggestion('status', 'PURCHASED');
                    }
                  }}
                  className="btn-success"
                  style={{ padding: '0.4rem 1rem', fontSize: '0.9rem', whiteSpace: 'nowrap' }}
                >
                  Angeschafft
                </button>
              )}
              
              <button 
                onClick={handleDeleteSuggestion}
                className="btn-danger"
                style={{ padding: '0.4rem 1rem', fontSize: '0.9rem', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}
              >
                Löschen
              </button>
            </div>
          )}
        </div>

        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Vorgeschlagen von {suggestion.creatorName}
        </div>

        {/* Details and Image columns */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem', marginBottom: '2rem' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Preis der Maschine (€)</label>
              {canEdit ? (
                <input 
                  type="number" 
                  step="0.01" 
                  className="input-field" 
                  value={suggestion.price} 
                  onChange={e => setSuggestion({...suggestion, price: parseFloat(e.target.value) || 0})}
                  onBlur={e => handleUpdateSuggestion('price', parseFloat(e.target.value) || 0)}
                  style={{ width: '150px' }}
                />
              ) : (
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{suggestion.price.toLocaleString('de-DE')} €</div>
              )}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Kauflink (URL)</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {canEdit ? (
                  <input 
                    type="url" 
                    className="input-field" 
                    value={suggestion.buyLink || ''} 
                    onChange={e => setSuggestion({...suggestion, buyLink: e.target.value})}
                    onBlur={e => handleUpdateSuggestion('buyLink', e.target.value)}
                    placeholder="https://..."
                    style={{ flex: 1 }}
                  />
                ) : (
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                    {suggestion.buyLink || '-'}
                  </span>
                )}
                {suggestion.buyLink && (
                  <a href={suggestion.buyLink} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ textDecoration: 'none', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                    🛒 Link
                  </a>
                )}
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Bild-URL</label>
              {canEdit && (
                <input 
                  type="url" 
                  className="input-field" 
                  value={suggestion.imageUrl || ''} 
                  onChange={e => setSuggestion({...suggestion, imageUrl: e.target.value})}
                  onBlur={e => handleUpdateSuggestion('imageUrl', e.target.value)}
                  placeholder="https://..."
                />
              )}
            </div>
          </div>
          
          <div style={{ flex: '0 0 300px', width: '300px', aspectRatio: '1 / 1', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', backgroundImage: `url(${suggestion.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
            {!suggestion.imageUrl && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>Kein Bild vorhanden</div>}
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Beschreibung</label>
          {canEdit ? (
            <textarea 
              className="input-field" 
              rows={4}
              value={suggestion.description || ''} 
              onChange={e => setSuggestion({...suggestion, description: e.target.value})}
              onBlur={e => handleUpdateSuggestion('description', e.target.value)}
              placeholder="Zusätzliche Infos, Gründe für den Vorschlag..."
            />
          ) : (
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{suggestion.description || 'Keine Beschreibung angegeben.'}</p>
          )}
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Zubehör / Materialien</h2>
          
          {suggestion.materials.length > 0 ? (
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '0.5rem' }}>Name</th>
                  <th style={{ padding: '0.5rem' }}>Link</th>
                  <th style={{ padding: '0.5rem' }}>Menge</th>
                  <th style={{ padding: '0.5rem' }}>Stückpreis</th>
                  <th style={{ padding: '0.5rem' }}>Gesamt</th>
                  {canEdit && <th style={{ padding: '0.5rem' }}>Aktion</th>}
                </tr>
              </thead>
              <tbody>
                {suggestion.materials.map((m: any) => (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--bg-secondary)' }}>
                    <td style={{ padding: '0.5rem' }}>{m.name}</td>
                    <td style={{ padding: '0.5rem' }}>{m.buyLink ? <a href={m.buyLink} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>Link</a> : '-'}</td>
                    <td style={{ padding: '0.5rem' }}>{m.quantity}</td>
                    <td style={{ padding: '0.5rem' }}>{m.pricePerUnit.toLocaleString('de-DE')} €</td>
                    <td style={{ padding: '0.5rem' }}>{(m.quantity * m.pricePerUnit).toLocaleString('de-DE')} €</td>
                    {canEdit && (
                      <td style={{ padding: '0.5rem' }}>
                        <button onClick={() => handleDeleteMaterial(m.id)} className="btn-danger" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}>Löschen</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} style={{ textAlign: 'right', padding: '1rem', fontWeight: 'bold' }}>Gesamtkosten (Maschine + Zubehör):</td>
                  <td colSpan={2} style={{ padding: '1rem', fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--accent-primary)' }}>{totalPrice.toLocaleString('de-DE')} €</td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <div style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Kein Zubehör eingetragen. Gesamtpreis: {totalPrice.toLocaleString('de-DE')} €</div>
          )}

          {canEdit && (
            <form onSubmit={handleAddMaterial} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <input type="text" className="input-field" placeholder="Name (z.B. PLA Filament)" value={newMaterial.name} onChange={e => setNewMaterial({...newMaterial, name: e.target.value})} required style={{ flex: 2, minWidth: '150px' }} />
              <input type="url" className="input-field" placeholder="Kauflink" value={newMaterial.buyLink} onChange={e => setNewMaterial({...newMaterial, buyLink: e.target.value})} style={{ flex: 2, minWidth: '150px' }} />
              <input type="number" className="input-field" placeholder="Menge" value={newMaterial.quantity} onChange={e => setNewMaterial({...newMaterial, quantity: parseInt(e.target.value) || 1})} min="1" required style={{ flex: 1, minWidth: '80px' }} />
              <input type="number" step="0.01" className="input-field" placeholder="Stückpreis" value={newMaterial.pricePerUnit} onChange={e => setNewMaterial({...newMaterial, pricePerUnit: parseFloat(e.target.value) || 0})} required style={{ flex: 1, minWidth: '100px' }} />
              <button type="submit" className="btn-success" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', height: 'fit-content', whiteSpace: 'nowrap' }}>Hinzufügen</button>
            </form>
          )}
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Diskussion & Notizen</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            {suggestion.notes.map((note: any) => (
              <div key={note.id} style={{ backgroundColor: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <strong>{note.userName}</strong>
                  <span>{new Date(note.createdAt).toLocaleString('de-DE')}</span>
                </div>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{note.content}</div>
                {(isAdmin || user.id === note.userId) && (
                  <button onClick={() => handleDeleteNote(note.id)} className="btn-danger" style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}>Löschen</button>
                )}
              </div>
            ))}
            {suggestion.notes.length === 0 && <div style={{ color: 'var(--text-secondary)' }}>Noch keine Diskussionbeiträge.</div>}
          </div>

          <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <textarea className="input-field" rows={3} placeholder="Dein Kommentar..." value={newNote} onChange={e => setNewNote(e.target.value)} required />
            <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-end', padding: '0.5rem 1.5rem' }}>Kommentieren</button>
          </form>
        </div>
      </div>
    </div>
  );
}
