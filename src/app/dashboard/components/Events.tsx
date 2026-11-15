'use client';
import Link from 'next/link';
import { EVENT_CATEGORIES, type EventCategory } from '@/lib/event-categories';
import { upcomingEvents, type CalendarTask } from '@/lib/upcoming-events';
import { useEffect, useState, type FormEvent } from 'react';

type Event = { id: string; title: string; date: string; time: string; location: string; description: string; category: EventCategory };
type DisplayEvent = Event & { taskId?: string; proposal?: boolean };
const empty = { title: '', date: '', time: '18:00', location: '', description: '', category: 'GENERAL' as EventCategory };
export default function Events({ canManage }: { canManage: boolean }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState<Event | typeof empty>(empty);
  const [editing, setEditing] = useState(false);
  const [past, setPast] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  async function load() {
    const results = await Promise.allSettled(['/api/events', '/api/tasks'].map(async url => {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) throw new Error('Termine konnten nicht vollständig geladen werden.');
      return response.json();
    }));
    if (results[0].status === 'fulfilled') setEvents(results[0].value.events);
    if (results[1].status === 'fulfilled') setTasks(results[1].value.tasks);
    if (results.some(result => result.status === 'rejected')) throw new Error('Termine konnten nicht vollständig geladen werden.');
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
  const taskDates: DisplayEvent[] = upcomingEvents(tasks).map(event => ({
    id: 'task:' + event.id, taskId: event.taskId, title: event.title, date: event.day,
    time: event.proposal?.startTime || '', location: '', description: '', category: 'WORK',
    proposal: event.type !== 'FIXED',
  }));
  const allDates: DisplayEvent[] = [...events.filter(event => past || event.date >= today), ...taskDates]
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time) || a.title.localeCompare(b.title, 'de'));
  const visible = expanded || past ? allDates : allDates.slice(0, 4);
  return <section className="glass-card maker-events" aria-label="Termine">
    <div className="maker-section-heading"><div><span className="maker-eyebrow">Zusammenkommen</span><h2>Termine</h2></div>{canManage && <button className="maker-button secondary" disabled={saving} onClick={() => { setForm(empty); setEditing(true); }}>＋ Termin</button>}</div>
    {error && <p role="alert" className="maker-error">{error} <button onClick={() => { setError(''); load().catch(e => setError(e.message)); }}>Erneut laden</button></p>}
    {editing && <form onSubmit={save} className="maker-event-form">
      <h3>{'id' in form ? 'Termin bearbeiten' : 'Neuer Termin'}</h3>
      <fieldset disabled={saving}>
        <label>Terminart<select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as EventCategory })}>{Object.entries(EVENT_CATEGORIES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Titel<input required maxLength={160} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label>
        <div className="maker-event-datetime"><label>Datum<input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></label><label>Uhrzeit (Berlin)<input type="time" required value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} /></label></div>
        <label>Ort<input maxLength={250} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></label>
        <label>Beschreibung<textarea rows={3} maxLength={5000} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
        <div className="maker-event-actions"><button className="maker-button" type="submit">{saving ? 'Speichert …' : 'Speichern'}</button><button className="maker-button secondary" type="button" onClick={() => setEditing(false)}>Abbrechen</button></div>
      </fieldset>
    </form>}
    {loading ? <p>Termine werden geladen …</p> : !visible.length && <p className="agenda-empty">Noch keine kommenden Termine eingetragen.</p>}
    <ol className="agenda-list">{visible.map(event => <li key={event.id} className={'maker-event maker-event-' + event.category.toLowerCase()}>
      <div className="maker-event-date" aria-hidden="true"><strong>{event.date.slice(8)}</strong><span>{new Date(event.date + 'T12:00:00Z').toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin', month: 'short' })}</span></div>
      <div className="maker-event-body">
        <span className="maker-event-category">{EVENT_CATEGORIES[event.category]}</span>
        <h3>{event.taskId ? <Link href={'/dashboard/tasks/' + event.taskId}>{event.title}</Link> : event.title}</h3>
        <time dateTime={event.date + (event.time ? 'T' + event.time : '')}>{new Date(event.date + 'T12:00:00Z').toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin', weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })} · {event.time ? event.time + ' Uhr' : 'Uhrzeit offen'}</time>
        {event.location && <p>{event.location}</p>}
        {event.description && <details className="maker-event-description"><summary>Mehr zum Termin</summary><p>{event.description}</p></details>}
        {event.taskId ? <Link className="maker-event-task-link" href={'/dashboard/tasks/' + event.taskId}>{event.proposal ? 'Terminvorschlag · Details & Teilnahme ↗' : 'Details & Teilnahme ↗'}</Link> : canManage && <div className="maker-event-actions"><button disabled={saving} onClick={() => { setForm(event); setEditing(true); }}>Bearbeiten</button><button disabled={saving} onClick={() => { if (window.confirm('Termin „' + event.title + '“ löschen?')) void mutate('DELETE', { id: event.id }); }}>Löschen</button></div>}
      </div>
    </li>)}</ol>
    {allDates.length > 4 && !past && <button className="maker-button secondary" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? 'Weniger Termine' : 'Alle ' + allDates.length + ' Termine'}</button>}
    <button className="maker-event-history" aria-pressed={past} onClick={() => setPast(!past)}>{past ? 'Nur kommende Termine' : 'Vergangene Termine anzeigen'}</button>
  </section>;
}
