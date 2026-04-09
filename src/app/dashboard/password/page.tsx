'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PasswordChange() {
  const [user, setUser] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (!userJson) {
      router.push('/');
    } else {
      setUser(JSON.parse(userJson));
    }
  }, [router]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        setMessage('Passwort erfolgreich geändert! Du wirst weitergeleitet...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setMessage('Fehler beim Ändern des Passworts.');
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
        <h1 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 600 }}>Passwort ändern</h1>
        
        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input 
            type="password" 
            placeholder="Neues Passwort" 
            className="input-field" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            autoFocus
            required
          />
          {message && <div style={{ color: message.includes('erfolgreich') ? 'var(--success)' : 'var(--danger)', fontSize: '0.9rem' }}>{message}</div>}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="submit" className="btn-primary" disabled={loading || !password.trim()} style={{ flex: 1 }}>
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
