'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './InventorySection.module.css';

type Item = { id: string; title: string; quantity: number; inventoryNumber: number; categoryId: number | null; locationId: number | null };
type Category = { id: number; name: string };
const numberLabel = (number: number) => `INV-${String(number).padStart(4, '0')}`;

export default function InventorySection({ canManage = false }: { canManage?: boolean }) {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Category[]>([]);
  const [newLocation, setNewLocation] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [number, setNumber] = useState('');
  const [busy, setBusy] = useState(false);
  const [renaming, setRenaming] = useState<number | null>(null);
  const [categoryName, setCategoryName] = useState('');

  async function load() {
    const response = await fetch('/api/inventory', { cache: 'no-store' });
    if (!response.ok) throw new Error('Das Inventar konnte nicht geladen werden. Bitte lade die Seite erneut.');
    const data = await response.json();
    setItems(data.items);
    setCategories(data.categories);
    setLocations(data.locations);
  }
  useEffect(() => {
    load().catch(error => setError(error.message)).finally(() => setLoading(false));
  }, []);

  async function save(method: 'POST' | 'PUT' | 'DELETE', body: object, url = '/api/inventory') {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Änderung konnte nicht gespeichert werden.');
      await load();
      setNotice('Änderung gespeichert.');
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Änderung konnte nicht gespeichert werden.');
      return false;
    } finally { setBusy(false); }
  }

  const groups = [...categories, { id: null, name: 'Nicht zugeordnet' }];
  const duplicate = items.some(item => item.id !== editing && item.inventoryNumber === Number(number));

  return <section className="glass-card">
    <h2>Ausstattung</h2>
    <p style={{ color: 'var(--text-secondary)', margin: '0.75rem 0 1.5rem' }}>Das Inventar unseres Makerspaces, nach Bereichen sortiert. Die Kosten bleiben im Anschaffungsbudget enthalten.</p>
    {error && <p role="alert" style={{ color: 'var(--danger-text)' }}>{error}</p>}
    {notice && <p role="status">{notice}</p>}
    {canManage && <form onSubmit={async event => {
      event.preventDefault();
      if (await save('POST', { name: newCategory })) setNewCategory('');
    }} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'end', marginBottom: '1.5rem' }}>
      <label>Neue Inventarkategorie<input className="input-field" placeholder="z. B. Holzwerkstatt" value={newCategory} onChange={event => setNewCategory(event.target.value)} required maxLength={100} disabled={busy} /></label>
      <button className={`${styles.button} ${styles.primary}`} disabled={busy || !newCategory.trim()}>Kategorie anlegen</button>
    </form>}
    <p style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Orte: {locations.map(location => location.name).join(' · ') || 'werden geladen …'}. Die Zuordnung erfolgt manuell.</p>
    {canManage && <form onSubmit={async event => {
      event.preventDefault();
      if (await save('POST', { name: newLocation }, '/api/inventory/locations')) setNewLocation('');
    }} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'end', marginBottom: '1.5rem' }}>
      <label>Neuer Ort<input className="input-field" placeholder="z. B. Lager" value={newLocation} onChange={event => setNewLocation(event.target.value)} required maxLength={100} disabled={busy} /></label>
      <button className={`${styles.button} ${styles.primary}`} disabled={busy || !newLocation.trim()}>Ort anlegen</button>
    </form>}
    {loading ? <p role="status">Inventar wird geladen …</p> : <>
      <p>{items.length} Inventarpositionen · {items.reduce((sum, item) => sum + item.quantity, 0)} Stück</p>
      {!items.length && <p>Noch keine Anschaffungen als „Angeschafft“ markiert.</p>}
      {groups.map(group => {
        const members = items.filter(item => item.categoryId === group.id);
        if (group.id === null && !members.length) return null;
        return <section key={group.id ?? 'unassigned'} style={{ marginTop: '1.75rem' }}>
          <h3>{group.name} <small style={{ color: 'var(--text-secondary)' }}>({members.length})</small></h3>
          {canManage && group.id !== null && (renaming === group.id ? <form style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }} onSubmit={async event => {
            event.preventDefault();
            if (await save('PUT', { id: group.id, name: categoryName }, '/api/inventory/categories')) setRenaming(null);
          }}>
            <input className="input-field" aria-label="Kategoriename" value={categoryName} onChange={event => setCategoryName(event.target.value)} required maxLength={100} disabled={busy} autoFocus />
            <button className={styles.button} disabled={busy || !categoryName.trim()}>Speichern</button>
            <button type="button" className={styles.button} disabled={busy} onClick={() => setRenaming(null)}>Abbrechen</button>
          </form> : <div className={styles.actions}>
            <button type="button" className={styles.button} disabled={busy} onClick={() => { setRenaming(group.id); setCategoryName(group.name); }}>Umbenennen</button>
            <button type="button" className={`${styles.button} ${styles.danger}`} disabled={busy} onClick={async () => {
              if (confirm(`Kategorie „${group.name}“ löschen? Alle Gegenstände bleiben erhalten und werden „Nicht zugeordnet“.`)) await save('DELETE', { id: group.id }, '/api/inventory/categories');
            }}>Kategorie löschen</button>
          </div>)}
          {!members.length ? <p>Diese Kategorie ist noch leer. Über „Verschieben“ kannst du Gegenstände zuordnen.</p> : <div style={{ overflowX: 'auto', marginTop: '0.75rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <caption className={styles.visuallyHidden}>Inventar: {group.name}</caption>
              <thead><tr>{['Inventarnummer', 'Bezeichnung', 'Menge', 'Ort', ...(canManage ? ['Verschieben'] : [])].map(label => <th key={label} scope="col" style={{ padding: '0.75rem', borderBottom: '2px solid var(--border-color)' }}>{label}</th>)}</tr></thead>
              <tbody>{members.map(item => <tr key={item.id}>
                <td style={{ padding: '0.75rem' }}>{editing === item.id ? <form onSubmit={async event => {
                  event.preventDefault();
                  if (await save('PUT', { id: item.id, inventoryNumber: Number(number) })) setEditing(null);
                }}>
                  <label>INV-<input aria-label={`Inventarnummer für ${item.title}`} type="number" min="1" max="2147483647" step="1" required value={number} onChange={event => setNumber(event.target.value)} disabled={busy} style={{ width: '7rem' }} autoFocus /></label>
                  {duplicate && <p role="alert">Diese Nummer ist bereits vergeben.</p>}
                  <div className={styles.actions}><button className={styles.button} disabled={busy || duplicate || !number}>Speichern</button><button type="button" className={styles.button} disabled={busy} onClick={() => setEditing(null)}>Abbrechen</button></div>
                </form> : <><span style={{ whiteSpace: 'nowrap' }}>{numberLabel(item.inventoryNumber)}</span>{canManage && <button type="button" className={styles.button} disabled={busy} aria-label={`Inventarnummer für ${item.title} ändern`} onClick={() => { setEditing(item.id); setNumber(String(item.inventoryNumber)); setError(''); }} style={{ marginLeft: '0.5rem' }}>Ändern</button>}</>}</td>
                <td style={{ padding: '0.75rem' }}><Link href={`/dashboard/equipment/${item.id}`}>{item.title}</Link></td>
                <td style={{ padding: '0.75rem' }}>{item.quantity}</td>
                <td style={{ padding: '0.75rem' }}>{canManage ? <select className="input-field" aria-label={`Ort für ${item.title}`} value={item.locationId ?? ''} disabled={busy} onChange={event => { void save('PUT', { id: item.id, locationId: event.target.value ? Number(event.target.value) : null }); }}>
                  <option value="">Kein Ort zugeordnet</option>
                  {locations.map(location => <option key={location.id} value={location.id}>{location.name}</option>)}
                </select> : locations.find(location => location.id === item.locationId)?.name || 'Kein Ort zugeordnet'}</td>
                {canManage && <td style={{ padding: '0.75rem' }}><select className="input-field" aria-label={`${item.title} in Kategorie verschieben`} value={item.categoryId ?? ''} disabled={busy} onChange={event => { void save('PUT', { id: item.id, categoryId: event.target.value ? Number(event.target.value) : null }); }}>
                  <option value="">Nicht zugeordnet</option>
                  {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select></td>}
              </tr>)}</tbody>
            </table>
          </div>}
        </section>;
      })}
    </>}
  </section>;
}
