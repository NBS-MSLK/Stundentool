export type CalendarProposal = { id: string; date: string; startTime?: string; endTime?: string; votes?: { userId: string; vote: string }[] };
export type CalendarTask = { id: string; title: string; status: string; dueDate?: string | null; dateProposals?: CalendarProposal[]; creator?: { name: string } };
export type UpcomingEvent = { id: string; taskId: string; title: string; date: string; day: string; type: 'FIXED' | 'OPEN_DATE' | 'PROPOSAL'; proposal?: CalendarProposal; creatorName?: string };
const dayFormat = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' });

export function upcomingEvents(tasks: CalendarTask[], now = new Date()): UpcomingEvent[] {
  const today = dayFormat.format(now);
  const events: UpcomingEvent[] = [];
  const add = (task: CalendarTask, date: string, type: UpcomingEvent['type'], proposal?: CalendarProposal) => {
    const parsed = new Date(date);
    if (!Number.isFinite(parsed.getTime())) return;
    const day = dayFormat.format(parsed);
    if (day < today) return;
    events.push({ id: task.id + ':' + (type === 'PROPOSAL' ? proposal!.id : type), taskId: task.id, title: task.title, date, day, type, proposal, creatorName: task.creator?.name });
  };
  for (const task of tasks) {
    if (task.status === 'DONE') continue;
    if (task.dueDate) {
      const day = new Date(task.dueDate);
      const matching = Number.isFinite(day.getTime()) ? task.dateProposals?.find(proposal => {
        const date = new Date(proposal.date);
        return Number.isFinite(date.getTime()) && dayFormat.format(date) === dayFormat.format(day);
      }) : undefined;
      add(task, task.dueDate, task.status === 'SCHEDULED' ? 'FIXED' : 'OPEN_DATE', matching);
    } else {
      for (const proposal of task.dateProposals || []) add(task, proposal.date, 'PROPOSAL', proposal);
    }
  }
  return events.sort((a, b) => a.day.localeCompare(b.day) || (a.proposal?.startTime || '00:00').localeCompare(b.proposal?.startTime || '00:00') || a.title.localeCompare(b.title, 'de'));
}
