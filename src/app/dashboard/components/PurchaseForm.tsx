'use client';

import { useState } from 'react';
import styles from './InventorySection.module.css';

type Choice = { id: number; name: string };
export default function PurchaseForm({ categories, locations, busy, onSave }: {
  categories: Choice[]; locations: Choice[]; busy: boolean;
  onSave: (body: object) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [requestId, setRequestId] = useState('');
  const [title, setTitle] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [locationId, setLocationId] = useState('');
  const total = Number(quantity) * Number(price);
  if (!open) return <button className={`${styles.button} ${styles.primary}`} style={{ marginBottom: '1.25rem' }} disabled={busy} onClick={() => { setRequestId(crypto.randomUUID()); setOpen(true); }}>+ Anschaffung nachtragen</button>;
  return <form className={styles.purchaseForm} onSubmit={async event => {
    event.preventDefault();
    if (busy) return;
    if (await onSave({ requestId, title, quantity: Number(quantity), price: Number(price), categoryId: Number(categoryId), locationId: locationId ? Number(locationId) : null })) {
      setOpen(false); setTitle(''); setQuantity('1'); setPrice(''); setCategoryId(''); setLocationId('');
    }
  }}>
    <h3>Anschaffung nachtragen</h3>
    <p>Für bereits gekaufte Gegenstände. Der Gesamtpreis wird im Anschaffungsbudget als Ausgabe berücksichtigt. Die Inventarnummer wird automatisch vergeben.</p>
    <div className={styles.purchaseFields}>
      <label>Bezeichnung<input className="input-field" value={title} onChange={event => setTitle(event.target.value)} maxLength={200} required disabled={busy} autoFocus /></label>
      <label>Inventarkategorie<select className="input-field" value={categoryId} onChange={event => setCategoryId(event.target.value)} required disabled={busy}><option value="">Bitte auswählen</option>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
      <label>Menge<input className="input-field" type="number" min="1" max="100000" step="1" value={quantity} onChange={event => setQuantity(event.target.value)} required disabled={busy} /></label>
      <label>Kaufpreis pro Stück (€)<input className="input-field" type="number" min="0" max="10000000" step="0.01" value={price} onChange={event => setPrice(event.target.value)} required disabled={busy} /></label>
      <label>Ort (optional)<select className="input-field" value={locationId} onChange={event => setLocationId(event.target.value)} disabled={busy}><option value="">Kein Ort zugeordnet</option>{locations.map(location => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
    </div>
    {!categories.length && <p>Bitte zuerst unten eine Inventarkategorie anlegen.</p>}
    <p><strong>Gesamtausgabe: {Number.isFinite(total) ? total.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }) : '–'}</strong></p>
    <div className={styles.actions}><button className={`${styles.button} ${styles.primary}`} disabled={busy || !categories.length}>Anschaffung speichern</button><button type="button" className={styles.button} disabled={busy} onClick={() => setOpen(false)}>Abbrechen</button></div>
  </form>;
}
