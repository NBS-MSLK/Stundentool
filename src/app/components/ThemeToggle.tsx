'use client';

import { useSyncExternalStore } from 'react';

function subscribe(update: () => void) {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const sync = () => {
    let saved: string | null = null;
    try { saved = localStorage.getItem('makerspace-theme'); } catch { /* Storage may be unavailable. */ }
    document.documentElement.dataset.theme = saved === 'dark' || saved === 'light' ? saved : media.matches ? 'dark' : 'light';
    update();
  };
  window.addEventListener('storage', sync);
  window.addEventListener('makerspace-theme-change', update);
  media.addEventListener('change', sync);
  return () => {
    window.removeEventListener('storage', sync);
    window.removeEventListener('makerspace-theme-change', update);
    media.removeEventListener('change', sync);
  };
}

export default function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, () => document.documentElement.dataset.theme === 'dark', () => false);
  function toggle() {
    const theme = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('makerspace-theme', theme); } catch { /* Keep the choice for this visit. */ }
    window.dispatchEvent(new Event('makerspace-theme-change'));
  }
  return (
    <button className="theme-toggle" type="button" onClick={toggle} aria-pressed={dark} aria-label="Dunkelmodus" title={dark ? 'Zum hellen Design wechseln' : 'Zum dunklen Design wechseln'}>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        {dark ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></> : <path d="M20.5 13.5A9 9 0 0 1 10.5 3 9 9 0 1 0 20.5 13.5Z" />}
      </svg>
      <span>{dark ? 'Hell' : 'Dunkel'}</span>
    </button>
  );
}
