'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PasswordChange() {
  const [user, setUser] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [showInHighscore, setShowInHighscore] = useState(true);
  const [email, setEmail] = useState('');
  const [emailPref, setEmailPref] = useState('NONE');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (!userJson) {
      router.push('/');
    } else {
      const parsedUser = JSON.parse(userJson);
      setUser(parsedUser);
      // Fetch initial showInHighscore state
      fetch(`/api/users/${parsedUser.id}`).then(res => res.json()).then(data => {
        if (data.user) {
          setShowInHighscore(data.user.showInHighscore);
          if (data.user.email) setEmail(data.user.email);
          if (data.user.emailPref) setEmailPref(data.user.emailPref);
        }
      });
    }
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setMessage('');
    try {
      const dataObj: any = { showInHighscore, emailPref };
      if (email.trim()) dataObj.email = email.trim();
      else dataObj.email = null;

      if (password.trim()) {
        dataObj.password = password.trim();
      }

      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataObj),
      });

      if (res.ok) {
        setMessage('Einstellungen erfolgreich gespeichert! Du wirst weitergeleitet...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setMessage('Fehler beim Speichern der Einstellungen.');
      }
    } catch (error) {
      setMessage('Es ist ein Fehler aufgetreten.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '4rem' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 600 }}>Einstellungen</h1>
        
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Passwort ändern (Optional)</label>
            <input 
              type="password" 
              placeholder="Neues Passwort..." 
              className="input-field" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--bg-hover)', margin: '0.5rem 0' }} />

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>E-Mail-Adresse für Benachrichtigungen</label>
            <input 
              type="email" 
              placeholder="deine@email.de" 
              className="input-field" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Wann möchtest du informiert werden?</label>
            <select 
              className="input-field" 
              value={emailPref} 
              onChange={(e) => setEmailPref(e.target.value)}
              disabled={loading}
            >
              <option value="NONE">Gar nicht (Aus)</option>
              <option value="SPECIFIC">Nur für gezielt abonnierte Arbeiten ("Glocke")</option>
              <option value="ALL">Immer (bei jedem Status-Update & jeder neuen Arbeit)</option>
            </select>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--bg-hover)', margin: '0.5rem 0' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
            <input 
              type="checkbox" 
              id="highscoreToggle"
              checked={showInHighscore}
              onChange={(e) => setShowInHighscore(e.target.checked)}
              disabled={loading}
              style={{ width: '1.2rem', height: '1.2rem' }}
            />
            <label htmlFor="highscoreToggle" style={{ fontSize: '0.95rem' }}>Mich im Highscore anzeigen</label>
          </div>

          {message && <div style={{ color: message.includes('erfolgreich') ? 'var(--success)' : 'var(--danger)', fontSize: '0.9rem', textAlign: 'center' }}>{message}</div>}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1 }}>
              Speichern
            </button>
            <button type="button" onClick={() => router.back()} className="btn-primary" style={{ flex: 1, backgroundColor: 'var(--text-secondary)' }}>
              Abbrechen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
