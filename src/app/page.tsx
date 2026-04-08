'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const router = useRouter();

  useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      setErrorText('');
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/dashboard');
      } else {
        setErrorText(data.error || 'Fehler beim Anmelden.');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh', alignItems: 'center' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 600 }}>Willkommen im MakerSpace</h1>
        <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>Bitte gib deinen Namen ein, um deine Zeiten zu erfassen.</p>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input 
            type="text" 
            placeholder="Dein Vor- und Nachname" 
            className="input-field" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            autoFocus
          />
          <input 
            type="password" 
            placeholder="Dein Passwort" 
            className="input-field" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          {errorText && <div style={{ color: 'var(--danger)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{errorText}</div>}
          <button type="submit" className="btn-primary" disabled={loading || !name.trim() || !password.trim()}>
            {loading ? 'Lade...' : 'Los geht\'s'}
          </button>
        </form>
      </div>
    </div>
  );
}
