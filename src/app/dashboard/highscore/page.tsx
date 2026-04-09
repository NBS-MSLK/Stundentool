'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TROPHIES } from '@/lib/trophies';

type HighscoreEntry = { id: string, name: string, hours: number };

export default function HighscorePage() {
  const [activeTab, setActiveTab] = useState<'month' | 'all'>('month');
  const [scores, setScores] = useState<HighscoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userTrophies, setUserTrophies] = useState<string[]>([]);
  const [categoryKings, setCategoryKings] = useState<Record<string, { userId: string, userName: string, hours: number }>>({});
  const [trophiesLoading, setTrophiesLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (!userJson) {
      router.push('/');
      return;
    }
    const u = JSON.parse(userJson);
    setCurrentUser(u);
    fetchScores(activeTab);
    fetchTrophies(u.id);
  }, [router, activeTab]);

  const fetchTrophies = async (uid: string) => {
    setTrophiesLoading(true);
    try {
      const res = await fetch('/api/trophies');
      const data = await res.json();
      if (data.userTrophies && data.userTrophies[uid]) {
        setUserTrophies(data.userTrophies[uid]);
      }
      if (data.categoryKings) {
        setCategoryKings(data.categoryKings);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTrophiesLoading(false);
    }
  };

  const fetchScores = async (filter: 'month' | 'all') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/highscore?filter=${filter}`);
      const data = await res.json();
      if (data.highscore) {
        setScores(data.highscore);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Highscore</h1>
        <Link href="/dashboard" className="btn-primary" style={{ backgroundColor: 'var(--text-secondary)' }}>Zurück zum Dashboard</Link>
      </div>

      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>Meine Auszeichnungen & Meilensteine</h2>
        {trophiesLoading ? (
            <div style={{ textAlign: 'center', padding: '1rem' }}>Lade Trophäen...</div>
        ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '1rem' }}>
                {TROPHIES.map(t => {
                   const achieved = userTrophies.includes(t.id);
                   return (
                     <div key={t.id} title={t.description} style={{ 
                        opacity: achieved ? 1 : 0.4, 
                        filter: achieved ? 'none' : 'grayscale(100%)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.5rem',
                        backgroundColor: achieved ? 'var(--bg-secondary)' : 'transparent',
                        borderRadius: '8px', cursor: 'help', border: achieved ? '1px solid var(--border-color)' : '1px solid transparent'
                     }}>
                        <div style={{ fontSize: '2rem' }}>{t.icon}</div>
                        <div style={{ fontSize: '0.65rem', textAlign: 'center', marginTop: '0.5rem', fontWeight: achieved ? 600 : 'normal' }}>{t.name}</div>
                     </div>
                   );
                })}
            </div>
        )}
      </div>

      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>👑 Kategorie-Könige</h2>
        {trophiesLoading ? (
           <div style={{ textAlign: 'center', padding: '1rem' }}>Lade Könige...</div>
        ) : (
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {Object.entries(categoryKings).map(([cat, king]) => (
                 <div key={cat} style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{cat}</div>
                    <div style={{ fontWeight: 600, marginTop: '0.2rem', fontSize: '1.1rem' }}>👑 {king.userName}</div>
                    <div style={{ fontSize: '0.9rem', marginTop: '0.4rem', color: 'var(--accent-primary)' }}>{king.hours} Stunden</div>
                 </div>
              ))}
              {Object.keys(categoryKings).length === 0 && (
                <div style={{ color: 'var(--text-secondary)' }}>Noch keine Könige gekrönt.</div>
              )}
           </div>
        )}
      </div>

      <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>Leaderboard</h2>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <button 
          onClick={() => setActiveTab('month')} 
          className="btn-primary" 
          style={{ backgroundColor: activeTab === 'month' ? 'var(--accent-primary)' : 'var(--bg-secondary)', color: activeTab === 'month' ? 'white' : 'var(--text-primary)' }}
        >
          Diesen Monat
        </button>
        <button 
          onClick={() => setActiveTab('all')} 
          className="btn-primary" 
          style={{ backgroundColor: activeTab === 'all' ? 'var(--accent-primary)' : 'var(--bg-secondary)', color: activeTab === 'all' ? 'white' : 'var(--text-primary)' }}
        >
          All-Time
        </button>
      </div>

      <div className="glass-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Lade Highscore...</div>
        ) : (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '1rem', width: '50px', textAlign: 'center' }}>#</th>
                <th style={{ padding: '1rem' }}>Name</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Förderwert</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((s, index) => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: index === 0 ? 'rgba(255, 215, 0, 0.1)' : index === 1 ? 'rgba(192, 192, 192, 0.1)' : index === 2 ? 'rgba(205, 127, 50, 0.1)' : 'transparent' }}>
                  <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold' }}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                  </td>
                  <td style={{ padding: '1rem', fontWeight: index < 3 ? 'bold' : 'normal' }}>{s.name}</td>
                  <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>
                    <div style={{ color: '#ffd700', textShadow: '0 0 5px rgba(255,215,0,0.3)', fontSize: '1.1rem' }}>{(s.hours * 20).toLocaleString('de-DE')} €</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>{s.hours} Stunden</div>
                  </td>
                </tr>
              ))}
              {scores.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Noch keine Einträge vorhanden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
