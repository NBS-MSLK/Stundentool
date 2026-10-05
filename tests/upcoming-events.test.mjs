import test from 'node:test';
import assert from 'node:assert/strict';
import { upcomingEvents } from '../src/lib/upcoming-events.ts';
const now = new Date('2026-10-05T10:00:00Z');
const task = (id, extra) => ({ id, title: id, status: 'OPEN', ...extra });
test('shows only actual future events, including appointments beyond four weeks', () => {
  const events = upcomingEvents([
    task('past', { dueDate: '2026-10-04T12:00:00Z' }),
    task('later', { dueDate: '2026-12-15T12:00:00Z', status: 'SCHEDULED' }),
    task('empty', {}),
    task('done', { dueDate: '2026-10-08T12:00:00Z', status: 'DONE' }),
    task('invalid', { dueDate: 'not-a-date' }),
    task('today', { dueDate: '2026-10-05T12:00:00Z' }),
  ], now);
  assert.deepEqual(events.map(event => event.taskId), ['today', 'later']);
});
test('orders proposal dates and start times and retains voting data', () => {
  const events = upcomingEvents([task('work', { dateProposals: [
    { id: 'evening', date: '2026-10-08T12:00:00Z', startTime: '18:00' },
    { id: 'later', date: '2026-10-10T12:00:00Z', startTime: '08:00' },
    { id: 'morning', date: '2026-10-08T12:00:00Z', startTime: '09:00', votes: [{ userId: 'member', vote: 'YES' }] },
  ] })], now);
  assert.deepEqual(events.map(event => event.proposal.id), ['morning', 'evening', 'later']);
  assert.equal(events[0].proposal.votes[0].vote, 'YES');
});
test('fixed dates replace proposals and match clock times on the same Berlin day', () => {
  const events = upcomingEvents([task('fixed', { status: 'SCHEDULED', dueDate: '2026-10-08T00:00:00Z', dateProposals: [
    { id: 'chosen', date: '2026-10-08T12:00:00Z', startTime: '18:00', endTime: '21:00' },
    { id: 'unused', date: '2026-10-09T12:00:00Z' },
  ] })], now);
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'FIXED');
  assert.equal(events[0].proposal.startTime, '18:00');
});
test('uses Berlin calendar days across midnight and year boundaries', () => {
  const events = upcomingEvents([
    task('berlin-today', { dueDate: '2026-12-31T23:15:00Z' }),
    task('berlin-yesterday', { dueDate: '2026-12-31T12:00:00Z' }),
  ], new Date('2026-12-31T23:30:00Z'));
  assert.deepEqual(events.map(event => event.day), ['2027-01-01']);
});
