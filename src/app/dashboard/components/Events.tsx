'use client';
import { useEffect, useState, type FormEvent } from 'react';

type Event = { id: string; title: string; date: string; time: string; location: string; description: string };
const empty = { title: '', date: '', time: '18:00', location: '', description: '' };
export default function Events({ canManage }: { canManage: boolean }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [form, setForm] = useState<Event | typeof empty>(empty);
  const [editing, setEditing] = useState(false);
  const [past, setPast] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  async function load() {
    const response = await fetch('/api/events', { cache: 'no-store' });
    if (!response.ok) throw new Error('Termine konnten nicht geladen werden.');
    setEvents((await response.json()).events);
  }
  useEffect(() => { load().catch(e => setError(e.message)).finally(() => setLoading(false)); }, []);
  async function mutate(method: string, body: unknown) {
    setSaving(true); setError('');
    try {
      const response = await fetch('/api/events', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!response.ok) throw new Error((await response.json()).error || 'Speichern fehlgeschlagen.');
      setEditing(false); setForm(empty);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Verbindung fehlgeschlagen.'); }
    finally { setSaving(false); }
  }
  function save(e: FormEvent) { e.preventDefault(); void mutate('id' in form ? 'PUT' : 'POST', form); }
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(new Date());
  const visible = events.filter(event => past || event.date >= today);
  return <section className="glass-card maker-events" aria-label="Termine">
    <div className="maker-section-heading"><h2>Nächste Termine</h2>{canManage && <button className="maker-button secondary" disabled={saving} onClick={() => { setForm(empty); setEditing(true); }}>＋ Termin</button>}</div>
    {error && <p role="alert" className="maker-error">{error} <button onClick={() => { setError(''); load().catch(e => setError(e.message)); }}>Erneut laden</button></p>}
    {editing && <form onSubmit={save} className="maker-event-form">
      <h3>{'id' in form ? 'Termin bearbeiten' : 'Neuer Termin'}</h3>
      <fieldset disabled={saving}>
        <label>Titel<input required maxLength={160} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label>
        <div className="maker-event-datetime"><label>Datum<input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></label><label>Uhrzeit (Berlin)<input type="time" required value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} /></label></div>
        <label>Ort<input maxLength={250} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></label>
        <label>Beschreibung<textarea rows={3} maxLength={5000} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
        <div className="maker-event-actions"><button className="maker-button" type="submit">{saving ? 'Speichert …' : 'Speichern'}</button><button className="maker-button secondary" type="button" onClick={() => setEditing(false)}>Abbrechen</button></div>
      </fieldset>
    </form>}
    {loading ? <p>Termine werden geladen …</p> : !visible.length && <p className="agenda-empty">Noch keine kommenden Termine eingetragen.</p>}
    <ol className="agenda-list">{visible.map(event => <li key={event.id} className="maker-event">
      <time dateTime={event.date + 'T' + event.time}>{new Date(event.date + 'T12:00:00Z').toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin', weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })} · {event.time} Uhr</time>
      <h3>{event.title}</h3>{event.location && <p>{event.location}</p>}{event.description && <p className="maker-event-description">{event.description}</p>}
      {canManage && <div className="maker-event-actions"><button className="maker-button secondary" disabled={saving} onClick={() => { setForm(event); setEditing(true); }}>Bearbeiten</button><button className="maker-button secondary" disabled={saving} onClick={() => { if (window.confirm('Termin „' + event.title + '“ löschen?')) void mutate('DELETE', { id: event.id }); }}>Löschen</button></div>}
    </li>)}</ol>
    <button className="maker-button secondary" aria-pressed={past} onClick={() => setPast(!past)}>{past ? 'Nur kommende Termine' : 'Vergangene Termine anzeigen'}</button>
  </section>;
}
