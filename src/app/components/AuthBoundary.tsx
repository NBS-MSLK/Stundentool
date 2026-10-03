'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

// localStorage only caches display data. The server session determines identity and access.
export default function AuthBoundary({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [verifiedPath, setVerifiedPath] = useState<string | null>(null);
  const [failedPath, setFailedPath] = useState<string | null>(null);

  useEffect(() => {
    if (pathname === '/') return;
    let cancelled = false;
    fetch('/api/auth', { cache: 'no-store' }).then(async response => {
      if (cancelled) return;
      if (response.status === 401) {
        localStorage.removeItem('user');
        router.replace('/');
        return;
      }
      if (!response.ok) throw new Error('Session check failed');
      const { user } = await response.json();
      if (cancelled) return;
      localStorage.setItem('user', JSON.stringify(user));
      if (pathname.startsWith('/admin') && user.role !== 'ADMIN') {
        router.replace('/dashboard');
        return;
      }
      setVerifiedPath(pathname);
    }).catch(() => { if (!cancelled) setFailedPath(pathname); });
    return () => { cancelled = true; };
  }, [pathname, router]);

  if (pathname === '/') return children;
  if (failedPath === pathname) return <div className="container">Anmeldung konnte nicht geprüft werden. Bitte lade die Seite erneut.</div>;
  if (verifiedPath !== pathname) return <div className="container">Anmeldung wird geprüft …</div>;
  return children;
}
