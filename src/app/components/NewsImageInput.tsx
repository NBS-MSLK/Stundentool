'use client';

import { useState } from 'react';

export default function NewsImageInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [error, setError] = useState('');
  return <div style={{ display: 'grid', gap: '0.5rem' }}>
    <label>Bild hochladen (JPEG, PNG, GIF oder WebP, maximal 2 MB)
      <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="input-field" onChange={async event => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        setError('');
        if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
          setError('Bitte ein JPEG-, PNG-, GIF- oder WebP-Bild bis 2 MB auswählen.');
          return;
        }
        try {
          const result = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          });
          onChange(result);
        } catch { setError('Das Bild konnte nicht gelesen werden.'); }
      }} />
    </label>
    {!value.startsWith('data:') && <input aria-label="Alternative Bild-URL" type="url" className="input-field" placeholder="Oder Bild-URL (optional)" value={value} onChange={event => onChange(event.target.value)} />}
    {value && <>
      {/* User-provided URLs and inline uploads cannot use Next image optimization. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={value} alt="Bildvorschau der Nachricht" style={{ maxWidth: '100%', maxHeight: 220, objectFit: 'contain', justifySelf: 'start' }} />
      <button type="button" className="btn-danger btn-compact" style={{ justifySelf: 'start' }} onClick={() => { onChange(''); setError(''); }}>Bild entfernen</button>
    </>}
    {error && <p role="alert">{error}</p>}
  </div>;
}
