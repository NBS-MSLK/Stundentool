'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Login() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth', { cache: 'no-store' }).then(async response => {
      if (response.ok) {
        const { user } = await response.json();
        localStorage.setItem('user', JSON.stringify(user));
        router.replace('/dashboard');
      } else if (response.status === 401) {
        localStorage.removeItem('user');
      }
    }).catch(() => {});
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
        <Image src="/brand/makerspace.png" alt="MakerSpace Lübbecke e. V." width={938} height={530} sizes="350px" style={{ width: '100%', height: 'auto', borderRadius: '12px', marginBottom: '1.5rem' }} />
        <h1 style={{ marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 600 }}>Willkommen im MakerSpace</h1>
        <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>Bitte gib deinen Namen ein, um deine Zeiten zu erfassen.</p>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input 
            aria-label="Vor- und Nachname"
            autoComplete="username"
            type="text" 
            placeholder="Dein Vor- und Nachname" 
            className="input-field" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            autoFocus
          />
          <input 
            aria-label="Passwort"
            autoComplete="current-password"
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
