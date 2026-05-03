'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function EquipmentSection({ user }: { user: any }) {
  const [budget, setBudget] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSuggestionTitle, setNewSuggestionTitle] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [newCategoryTitle, setNewCategoryTitle] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  // For grouping: adding a new sub-category to a group
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [newGroupSubCategoryTitle, setNewGroupSubCategoryTitle] = useState('');

  const handleCreateGroupSubCategory = async (groupNum: string, groupName: string, subCategoryCount: number) => {
    if (!newGroupSubCategoryTitle.trim()) return;
    const newTitle = `${groupNum}.${subCategoryCount + 1} ${groupName}: ${newGroupSubCategoryTitle}`;
    
    await fetch('/api/equipment/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle, creatorId: user.id })
    });
    setNewGroupSubCategoryTitle('');
    setActiveGroupId(null);
    fetchData();
  };

  const handleMoveCategory = async (e: React.MouseEvent, catId: string, direction: number) => {
    e.stopPropagation();
    const index = categories.findIndex(c => c.id === catId);
    if (index === -1) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const current = categories[index];
    const target = categories[targetIndex];
    
    // Set fallback order values if they don't exist yet
    const currentOrder = current.order !== undefined ? current.order : index;
    const targetOrder = target.order !== undefined ? target.order : targetIndex;

    const newCats = [...categories];
    newCats[index] = { ...current, order: targetOrder };
    newCats[targetIndex] = { ...target, order: currentOrder };
    // Sort array locally immediately
    newCats.sort((a, b) => a.order - b.order);
    setCategories(newCats);

    await fetch('/api/equipment/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        updates: [
          { id: current.id, order: targetOrder },
          { id: target.id, order: currentOrder }
        ]
      })
    });
    fetchData();
  };

  const handleCreateCategory = async () => {
    if (!newCategoryTitle.trim()) return;
    await fetch('/api/equipment/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newCategoryTitle, creatorId: user.id })
    });
    setNewCategoryTitle('');
    setIsAddingCategory(false);
    fetchData();
  };

  const fetchData = async () => {
    try {
      const res = await fetch('/api/equipment', { cache: 'no-store' });
      const data = await res.json();
      if (data.budget) setBudget(data.budget);
      if (data.categories) setCategories(data.categories);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVote = async (suggestionId: string) => {
    await fetch(`/api/equipment/suggestions/${suggestionId}/votes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id })
    });
    fetchData();
  };

  const handlePriorityVote = async (suggestionId: string) => {
    await fetch('/api/equipment/priority-vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, suggestionId })
    });
    fetchData();
  };

  const handleCreateSuggestion = async (categoryId: string) => {
    if (!newSuggestionTitle.trim()) return;
    await fetch('/api/equipment/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categoryId,
        title: newSuggestionTitle,
        creatorId: user.id
      })
    });
    setNewSuggestionTitle('');
    setActiveCategoryId(null);
    fetchData();
  };

  if (loading) return <div>Lade Equipment...</div>;
  if (!budget) return <div>Fehler beim Laden des Budgets.</div>;

  // Calculate budget components
  let spentAmount = 0;
  let plannedAmount = 0;

  categories.forEach(cat => {
    if (!cat.suggestions || cat.suggestions.length === 0) return;

    let topSuggestion = cat.suggestions[0];
    let maxVotes = topSuggestion.priorityVotes?.length || 0;

    cat.suggestions.forEach((s: any) => {
      let sCost = s.price || 0;
      if (s.materials) {
        s.materials.forEach((m: any) => {
          sCost += (m.quantity * m.pricePerUnit) || 0;
        });
      }

      if (s.status === 'PURCHASED') {
        spentAmount += sCost;
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
        topSuggestion.materials.forEach((m: any) => {
          topCost += (m.quantity * m.pricePerUnit) || 0;
        });
      }
      plannedAmount += topCost;
    }
  });

  const totalBudget = budget.totalAmount;
  const budgetPercentage = totalBudget > 0 ? (plannedAmount / totalBudget) * 100 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Budget Bar */}
      <div className="glass-card" style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Equipment Budget</h2>
        
        <div style={{ width: '100%', backgroundColor: 'var(--bg-secondary)', height: '1.8rem', borderRadius: 'var(--radius-full)', overflow: 'hidden', position: 'relative' }}>
          {/* Spent Progress */}
          <div 
            style={{ 
              position: 'absolute',
              left: 0,
              top: 0,
              width: `${Math.min((spentAmount / totalBudget) * 100, 100)}%`, 
              backgroundColor: 'var(--success)', 
              height: '100%', 
              transition: 'width 0.5s ease-in-out',
              zIndex: 2
            }} 
          />
          {/* Planned Progress */}
          <div 
            style={{ 
              position: 'absolute',
              left: 0,
              top: 0,
              width: `${Math.min(budgetPercentage, 100)}%`, 
              backgroundColor: plannedAmount > totalBudget ? 'var(--danger)' : 'var(--accent-primary)', 
              height: '100%', 
              opacity: 0.6,
              transition: 'width 0.5s ease-in-out',
              zIndex: 1
            }} 
          />
          <div style={{ position: 'relative', zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white', fontSize: '0.85rem', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
            {Math.round(budgetPercentage)}%
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', marginTop: '1rem', fontSize: '0.95rem', fontWeight: 600 }}>
          <div style={{ textAlign: 'left' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'block' }}>Ausgegeben</span>
            <span style={{ color: 'var(--success)' }}>{spentAmount.toLocaleString('de-DE')} €</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'block' }}>Budget</span>
            <span>{totalBudget.toLocaleString('de-DE')} €</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'block' }}>Geplant</span>
            <span style={{ color: plannedAmount > totalBudget ? 'var(--danger)' : 'var(--success)' }}>
              {plannedAmount.toLocaleString('de-DE')} €
            </span>
          </div>
        </div>
      </div>

      {user?.role === 'ADMIN' && (
        <div className="glass-card" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', padding: '1rem' }}>
          <button 
            onClick={async () => {
              if (confirm('Wirklich automatisch neu nummerieren und sortieren?')) {
                setLoading(true);
                await fetch('/api/equipment/auto-number', { method: 'POST' });
                fetchData();
              }
            }}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            🔢 Auto-Nummerieren & Sortieren
          </button>
        </div>
      )}

      {/* Categories and Suggestions */}
      {(() => {
        let maxCatStars = 0;
        const catStarCounts: Record<string, number> = {};
        
        categories.forEach(cat => {
          let stars = 0;
          cat.suggestions?.forEach((s: any) => {
            stars += s.priorityVotes?.length || 0;
          });
          catStarCounts[cat.id] = stars;
          if (stars > maxCatStars) maxCatStars = stars;
        });

        const groupNames: Record<string, string> = { '9': 'Holzwerkstatt', '10': 'Möbel', '13': 'Elektrotechnik', '16': 'Vereinsleben' };
        
        const groups: any[] = [];
        categories.forEach(cat => {
          const match = cat.title.match(/^(\d+)\.\d+\s(.*?):\s?(.*)/);
          if (match) {
            const groupNum = match[1];
            const groupName = groupNames[groupNum] || match[2];
            const subName = match[3];
            
            let group = groups.find(g => g.id === `group_${groupNum}`);
            if (!group) {
              group = { id: `group_${groupNum}`, isGroup: true, title: `${groupNum}. ${groupName}`, categories: [] };
              groups.push(group);
            }
            group.categories.push({ ...cat, displayTitle: subName });
          } else {
            groups.push({ id: cat.id, isGroup: false, category: cat, displayTitle: cat.title });
          }
        });

        const renderCategory = (cat: any, displayTitle: string) => {
          const isExpanded = expandedCategories[cat.id];
          const hasMostStars = maxCatStars > 0 && catStarCounts[cat.id] === maxCatStars;
          
          let catSum = 0;
          let isPurchased = false;
          if (cat.suggestions && cat.suggestions.length > 0) {
             let top = cat.suggestions[0];
             cat.suggestions.forEach((s: any) => {
               if (s.status === 'PURCHASED' || ((s.priorityVotes?.length || 0) > (top.priorityVotes?.length || 0) && s.status !== 'REJECTED')) top = s;
             });
             if (top.status === 'PURCHASED') isPurchased = true;
             catSum = top.price;
             top.materials.forEach((m: any) => { catSum += m.quantity * m.pricePerUnit; });
          }

          return (
            <div key={cat.id} className="glass-card" style={{ padding: '0', overflow: 'hidden', border: isPurchased ? '2px solid var(--success)' : undefined }}>
              <div 
                onClick={() => toggleCategory(cat.id)}
                style={{ 
                  padding: '1rem 1.5rem', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  backgroundColor: isExpanded ? 'rgba(255,255,255,0.05)' : 'transparent',
                  transition: 'background-color 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>{displayTitle}</span>
                  {hasMostStars && <span title="Höchste Priorität der Community!" style={{ fontSize: '1.2rem' }}>⭐</span>}
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)', padding: '0.2rem 0.6rem', borderRadius: '1rem' }}>
                    ~ {catSum.toLocaleString('de-DE')} €
                  </span>
                  {(user?.role === 'ADMIN' || (cat.creatorId && user?.id === cat.creatorId)) && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                      {user?.role === 'ADMIN' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginRight: '0.5rem' }}>
                          <button onClick={(e) => handleMoveCategory(e, cat.id, -1)} style={{ background: 'var(--bg-secondary)', border: 'none', cursor: 'pointer', borderRadius: '4px', fontSize: '0.8rem', padding: '0.2rem' }}>🔼</button>
                          <button onClick={(e) => handleMoveCategory(e, cat.id, 1)} style={{ background: 'var(--bg-secondary)', border: 'none', cursor: 'pointer', borderRadius: '4px', fontSize: '0.8rem', padding: '0.2rem' }}>🔽</button>
                        </div>
                      )}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Kategorie inkl. aller Vorschläge wirklich löschen?')) {
                             fetch(`/api/equipment/categories/${cat.id}`, { method: 'DELETE' }).then(() => fetchData());
                          }
                        }}
                        title="Kategorie löschen"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }}
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
                <div style={{ 
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', 
                  transition: 'transform 0.3s',
                  fontSize: '1.2rem',
                  color: 'var(--text-secondary)'
                }}>
                  ▼
                </div>
              </div>
              
              {isExpanded && (
                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.1)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {cat.suggestions.map((s: any) => {
                      const hasVoted = s.votes.some((v: any) => v.userId === user.id);
                      const hasPriorityVote = s.priorityVotes.some((v: any) => v.userId === user.id);
                      let totalMatCost = 0;
                      s.materials.forEach((m: any) => { totalMatCost += m.quantity * m.pricePerUnit; });
                      const totalPrice = s.price + totalMatCost;

                      return (
                        <div key={s.id} style={{ 
                          border: s.status === 'PURCHASED' ? '2px solid var(--success)' : (maxCatStars > 0 && s.priorityVotes?.length === maxCatStars) ? '2px solid #ffd700' : '1px solid var(--border-color)', 
                          borderRadius: 'var(--radius-md)', padding: '1rem', backgroundColor: 'var(--bg-primary)',
                          display: 'flex', flexDirection: 'column', position: 'relative'
                        }}>
                          {s.status === 'PURCHASED' && (
                            <div style={{ position: 'absolute', top: '-10px', right: '-10px', backgroundColor: 'var(--success)', color: 'white', padding: '0.3rem 0.8rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                              Angeschafft
                            </div>
                          )}
                          {s.status === 'REJECTED' && (
                            <div style={{ position: 'absolute', top: '-10px', right: '-10px', backgroundColor: 'var(--danger)', color: 'white', padding: '0.3rem 0.8rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                              Abgelehnt
                            </div>
                          )}
                          
                          {s.imageUrl && (
                            <div style={{ width: '100%', aspectRatio: '1 / 1', backgroundImage: `url(${s.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }} />
                          )}
                          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{s.title}</h3>
                          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem', flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                              <span>Maschine:</span>
                              <strong>{s.price.toLocaleString('de-DE')} €</strong>
                            </div>
                            {s.materials.length > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                                <span>Zubehör ({s.materials.length}):</span>
                                <strong>{totalMatCost.toLocaleString('de-DE')} €</strong>
                              </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                              <span>Gesamt:</span>
                              <strong>{totalPrice.toLocaleString('de-DE')} €</strong>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                            <button 
                              onClick={() => handleVote(s.id)}
                              className="btn-primary" 
                              style={{ 
                                flex: 1, 
                                backgroundColor: hasVoted ? 'var(--accent-primary)' : 'var(--bg-secondary)', 
                                color: hasVoted ? 'white' : 'var(--text-primary)',
                                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem'
                              }}
                            >
                              👍 {s.votes.length}
                            </button>
                            <button 
                              onClick={() => handlePriorityVote(s.id)}
                              className="btn-primary" 
                              title="Meine Priorität (Als nächstes kaufen)"
                              style={{ 
                                backgroundColor: hasPriorityVote ? '#ffd700' : 'var(--bg-secondary)', 
                                color: hasPriorityVote ? 'black' : 'var(--text-primary)',
                                padding: '0.5rem',
                                display: 'flex', justifyContent: 'center', alignItems: 'center'
                              }}
                            >
                              ⭐ {s.priorityVotes.length}
                            </button>
                          </div>
                          
                          <Link href={`/dashboard/equipment/${s.id}`} className="btn-primary" style={{ width: '100%', textAlign: 'center', marginTop: '0.5rem', textDecoration: 'none', backgroundColor: 'var(--text-secondary)' }}>
                            Details & Diskussion ({s.notes.length})
                          </Link>
                        </div>
                      );
                    })}

                    {/* Add new suggestion card */}
                    {!isPurchased && (
                      <div style={{ border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', alignSelf: 'start' }}>
                        {activeCategoryId === cat.id ? (
                          <div style={{ width: '100%' }}>
                            <input 
                              type="text" 
                              className="input-field" 
                              placeholder="Titel (z.B. Alternative Maschine)" 
                              value={newSuggestionTitle} 
                              onChange={e => setNewSuggestionTitle(e.target.value)} 
                              autoFocus
                            />
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                              <button onClick={() => handleCreateSuggestion(cat.id)} className="btn-success" style={{ flex: 1, padding: '0.5rem', fontSize: '0.9rem' }}>Speichern</button>
                              <button onClick={() => setActiveCategoryId(null)} className="btn-danger" style={{ flex: 1, padding: '0.5rem', fontSize: '0.9rem' }}>Abbrechen</button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setActiveCategoryId(cat.id)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.5rem' }}>
                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>+</span>
                            <span style={{ fontSize: '0.95rem' }}>Alternative vorschlagen</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        };

        return groups.map(group => {
          if (group.isGroup) {
            const isGroupExpanded = expandedGroups[group.id];
            
            let groupSum = 0;
            let groupSpent = 0;
            group.categories.forEach((cat: any) => {
              if (cat.suggestions && cat.suggestions.length > 0) {
                 let top = cat.suggestions[0];
                 cat.suggestions.forEach((s: any) => {
                   if (s.status === 'PURCHASED' || ((s.priorityVotes?.length || 0) > (top.priorityVotes?.length || 0) && s.status !== 'REJECTED')) top = s;
                 });
                 let sSum = top.price;
                 top.materials.forEach((m: any) => { sSum += m.quantity * m.pricePerUnit; });
                 groupSum += sSum;
                 if (top.status === 'PURCHASED') groupSpent += sSum;
              }
            });
            const percent = groupSum > 0 ? (groupSpent / groupSum) * 100 : 0;

            return (
              <div key={group.id} className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                <div 
                  onClick={() => toggleGroup(group.id)}
                  style={{ 
                    padding: '1rem 1.5rem', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    cursor: 'pointer',
                    backgroundColor: isGroupExpanded ? 'rgba(255,255,255,0.05)' : 'transparent',
                    transition: 'background-color 0.2s',
                    position: 'relative'
                  }}
                >
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: 'var(--accent-primary)' }}>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${percent}%`, backgroundColor: 'var(--success)', transition: 'height 0.5s ease-in-out' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>{group.title}</span>
                    {group.categories.some((c: any) => catStarCounts[c.id] === maxCatStars && maxCatStars > 0) && (
                      <span title="Enthält das Gerät mit der höchsten Priorität!" style={{ fontSize: '1.2rem' }}>⭐</span>
                    )}
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)', padding: '0.2rem 0.6rem', borderRadius: '1rem' }}>
                      ~ {groupSum.toLocaleString('de-DE')} €
                    </span>
                  </div>
                  <div style={{ transform: isGroupExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>▼</div>
                </div>

                {isGroupExpanded && (
                  <div style={{ padding: '1rem 1.5rem', backgroundColor: 'rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {group.categories.map((cat: any) => renderCategory(cat, cat.displayTitle))}
                    
                    {/* Add new sub-category to this group */}
                    <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', border: '2px dashed var(--border-color)', marginTop: '0.5rem' }}>
                      {activeGroupId === group.id ? (
                        <div style={{ width: '100%', maxWidth: '400px' }}>
                          <input 
                            type="text" 
                            className="input-field" 
                            placeholder={`Neues Element für "${group.title}" vorschlagen`} 
                            value={newGroupSubCategoryTitle} 
                            onChange={e => setNewGroupSubCategoryTitle(e.target.value)} 
                            autoFocus
                          />
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                            <button 
                              onClick={() => {
                                const match = group.categories[0]?.title.match(/^(\d+)\.\d+\s(.*?):/);
                                const groupNum = match ? match[1] : group.title.split('.')[0];
                                const groupName = match ? match[2] : group.title.substring(group.title.indexOf('.') + 1).trim();
                                handleCreateGroupSubCategory(groupNum, groupName, group.categories.length);
                              }} 
                              className="btn-success" style={{ flex: 1, padding: '0.5rem', fontSize: '0.9rem' }}
                            >
                              Speichern
                            </button>
                            <button onClick={() => setActiveGroupId(null)} className="btn-danger" style={{ flex: 1, padding: '0.5rem', fontSize: '0.9rem' }}>Abbrechen</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setActiveGroupId(group.id)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.5rem' }}>
                          <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>+</span>
                          <span style={{ fontSize: '1rem', fontWeight: 600 }}>Weiteres Element zu {group.title} hinzufügen</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          } else {
            return renderCategory(group.category, group.displayTitle);
          }
        });
      })()}

      {user && (
        <div className="glass-card" style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          {isAddingCategory ? (
            <div style={{ width: '100%', maxWidth: '400px' }}>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Name der neuen Kategorie" 
                value={newCategoryTitle} 
                onChange={e => setNewCategoryTitle(e.target.value)} 
                autoFocus
              />
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button onClick={handleCreateCategory} className="btn-success" style={{ flex: 1, padding: '0.4rem 1rem', fontSize: '0.9rem' }}>Speichern</button>
                <button onClick={() => setIsAddingCategory(false)} className="btn-danger" style={{ flex: 1, padding: '0.4rem 1rem', fontSize: '0.9rem' }}>Abbrechen</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setIsAddingCategory(true)} style={{ background: 'none', border: '2px dashed var(--border-color)', color: 'var(--text-secondary)', padding: '1rem 2rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '1rem', width: '100%', maxWidth: '400px' }}>
              + Neue Kategorie erstellen
            </button>
          )}
        </div>
      )}

    </div>
  );
}
