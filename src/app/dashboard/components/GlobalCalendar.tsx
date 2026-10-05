'use client';
import { useState } from 'react';
import Link from 'next/link';
import { upcomingEvents, type CalendarTask } from '@/lib/upcoming-events';

export default function GlobalCalendar({ tasks, user, refetch }: { tasks: CalendarTask[]; user: { id: string; name: string }; refetch: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState('');
  const events = upcomingEvents(tasks);
  const visible = expanded ? events : events.slice(0, 6);
  const dateOptions = { timeZone: 'Europe/Berlin' };

  const handleVote = async (taskId: string, proposalId: string, vote: string) => {
    setSaving(proposalId);
    setError('');
    try {
      const response = await fetch(`/api/tasks/${taskId}/proposals/${proposalId}/vote`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, userName: user.name, vote }),
      });
      if (!response.ok) throw new Error('Deine Antwort konnte nicht gespeichert werden. Bitte erneut versuchen.');
      refetch();
    } catch { setError('Deine Antwort konnte nicht gespeichert werden. Bitte erneut versuchen.'); }
    finally { setSaving(null); }
  };

  return (
    <section className="glass-card maker-agenda" aria-label="Nächste Termine">
      <div className="maker-section-heading"><h2>Nächste Termine</h2><span className="maker-eyebrow">{events.length} {events.length === 1 ? 'Termin' : 'Termine'}</span></div>
      {error && <p role="alert" className="maker-error">{error}</p>}
      {!events.length && <p className="agenda-empty">Aktuell stehen keine kommenden Termine oder Terminvorschläge an.</p>}
      <ol className="agenda-list">{visible.map(event => {
        const date = new Date(event.date);
        const proposal = event.proposal;
        const myVote = proposal?.votes?.find(vote => vote.userId === user.id)?.vote;
        const yes = proposal?.votes?.filter(vote => vote.vote === 'YES').length || 0;
        const times = proposal?.startTime ? proposal.startTime + (proposal.endTime ? '–' + proposal.endTime : '') + ' Uhr' : 'Uhrzeit noch offen';
        return <li key={event.id} className="agenda-event">
          <div className="agenda-date" aria-hidden="true"><strong>{date.toLocaleDateString('de-DE', { ...dateOptions, day: '2-digit' })}</strong><span>{date.toLocaleDateString('de-DE', { ...dateOptions, month: 'short' })}</span></div>
          <div className="agenda-content"><div className="agenda-title"><Link href={'/dashboard/tasks/' + event.taskId}>{event.title}</Link><span className={'agenda-status ' + (event.type === 'FIXED' ? 'fixed' : '')}>{event.type === 'FIXED' ? 'Fester Termin' : event.type === 'PROPOSAL' ? 'Terminvorschlag' : 'Noch offen'}</span></div>
            <p><time dateTime={event.day}>{date.toLocaleDateString('de-DE', { ...dateOptions, weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}</time> · {times}{event.type === 'PROPOSAL' ? ' · ' + yes + ' Zusagen' : event.creatorName ? ' · ' + event.creatorName : ''}</p>
          </div>
          {event.type === 'PROPOSAL' && proposal && <div className="agenda-votes" aria-label={'Deine Teilnahme: ' + event.title}>{([{ value: 'NO', label: 'Kann nicht' }, { value: 'MAYBE', label: 'Vielleicht' }, { value: 'YES', label: 'Bin dabei' }] as const).map(option => <button key={option.value} aria-pressed={myVote === option.value} disabled={saving !== null} onClick={() => handleVote(event.taskId, proposal.id, option.value)}>{saving === proposal.id ? '…' : option.label}</button>)}</div>}
          {event.type !== 'PROPOSAL' && <Link className="agenda-details" href={'/dashboard/tasks/' + event.taskId}>Details ↗</Link>}
        </li>;
      })}</ol>
      {events.length > 6 && <button className="maker-button secondary agenda-more" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? 'Weniger anzeigen' : 'Alle ' + events.length + ' Termine anzeigen'}</button>}
    </section>
  );
}
