import { NextResponse } from 'next/server';
import prisma from './prisma';
import { getSession } from './session';

type Actor = { id: string; name: string; role: string };
type Body = Record<string, unknown>;
type Params = Record<string, string>;

export class AccessError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
const deny = () => { throw new AccessError(403, 'Keine Berechtigung.'); };
const admin = (user: Actor) => { if (user.role !== 'ADMIN') deny(); };
const own = (user: Actor, id: string | null | undefined) => {
  if (user.role !== 'ADMIN' && id !== user.id) deny();
};
function exists<T>(record: T | null): T {
  if (!record) throw new AccessError(404, 'Nicht gefunden.');
  return record;
}
function text(value: unknown): string {
  if (typeof value !== 'string' || !value) throw new AccessError(400, 'Ungültige ID.');
  return value;
}

// Cookies authenticate the caller; browser-origin validation protects mutations from CSRF.
export function checkOrigin(request: Request) {
  if (request.headers.get('sec-fetch-site') === 'cross-site') deny();
  const origin = request.headers.get('origin');
  const expected = process.env.APP_ORIGIN || (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : new URL(request.url).origin);
  if (origin && origin !== expected) deny();
  // Browsers send Origin on mutations. Non-browser clients must also supply it.
  if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) && !origin) deny();
}

// Reject impersonation even for admins; only time-entry administration may target another user.
function identity(body: Body, user: Actor, allowTargetUser = false) {
  for (const field of ['userId', 'creatorId', 'authorId']) {
    if (field === 'userId' && allowTargetUser && user.role === 'ADMIN') continue;
    if (body[field] !== undefined && body[field] !== user.id) deny();
  }
  for (const field of ['userName', 'creatorName']) {
    if (body[field] !== undefined && body[field] !== user.name) deny();
  }
  if (body.userRole !== undefined && body.userRole !== user.role) deny();
}

async function authorize(route: string, request: Request, params: Params, body: Body, user: Actor) {
  const method = request.method;
  const read = method === 'GET' || method === 'HEAD';
  const query = new URL(request.url).searchParams;
  const id = params.id;
  identity(body, user, route === '/api/entries' || route === '/api/entries/start' || route === '/api/entries/stop');

  switch (route) {
    case '/api/inventory': if (!read) admin(user); return;
    case '/api/inventory/categories': admin(user); return;
    case '/api/inventory/locations': admin(user); return;
    case '/api/users': admin(user); return;
    case '/api/users/[id]':
      if (method === 'DELETE') admin(user); else own(user, id);
      return;
    case '/api/logs': admin(user); return;
    case '/api/entries':
      if (read) {
        if (query.get('all') === 'true') admin(user);
        else own(user, query.get('userId'));
      } else own(user, text(body.userId));
      return;
    case '/api/entries/start': case '/api/entries/stop':
      own(user, text(body.userId)); return;
    case '/api/entries/[id]': {
      const entry = exists(await prisma.timeEntry.findUnique({ where: { id } }));
      own(user, entry.userId);
      if (!read && (entry.isArchived || entry.isSubmitted || body.isArchived !== undefined || body.isSubmitted !== undefined)) admin(user);
      return;
    }
    case '/api/funding': case '/api/news': case '/api/news/[id]':
    case '/api/headlines': case '/api/headlines/[id]':
    case '/api/faqs': case '/api/faqs/[id]': case '/api/polls': case '/api/polls/[id]':
      if (!read) admin(user); return;
    case '/api/stats': case '/api/highscore': case '/api/trophies':
      if (!read) deny(); return;
    case '/api/polls/[id]/vote': return;
    case '/api/tasks': return;
    case '/api/tasks/[id]':
      if (!read) own(user, exists(await prisma.task.findUnique({ where: { id } })).creatorId);
      return;
    case '/api/tasks/[id]/step': {
      const step = exists(await prisma.taskStep.findUnique({ where: { id: text(body.stepId) }, include: { task: true } }));
      if (step.taskId !== id) deny();
      if (body.estimatedHours !== undefined) own(user, step.task.creatorId);
      return;
    }
    case '/api/tasks/[id]/material': {
      const material = exists(await prisma.taskMaterial.findUnique({ where: { id: text(body.materialId) } }));
      if (material.taskId !== id) deny();
      return;
    }
    case '/api/tasks/[id]/volunteer':
      if (method === 'DELETE' && query.get('userId') !== user.id) deny();
      return;
    case '/api/tasks/[id]/proposals/[proposalId]/vote': {
      const proposal = exists(await prisma.taskDateProposal.findUnique({ where: { id: params.proposalId } }));
      if (proposal.taskId !== id) deny();
      return;
    }
    case '/api/tasks/[id]/notes': case '/api/tasks/[id]/proposals': return;
    case '/api/equipment': if (!read) admin(user); return;
    case '/api/equipment/categories': return;
    case '/api/equipment/[id]': case '/api/equipment/categories/[id]':
      own(user, exists(await prisma.equipmentCategory.findUnique({ where: { id } })).creatorId); return;
    case '/api/equipment/suggestions': return;
    case '/api/equipment/suggestions/[id]':
      if (!read) {
        own(user, exists(await prisma.equipmentSuggestion.findUnique({ where: { id } })).creatorId);
        if (body.status !== undefined) admin(user);
      }
      return;
    case '/api/equipment/suggestions/[id]/materials':
      own(user, exists(await prisma.equipmentSuggestion.findUnique({ where: { id } })).creatorId); return;
    case '/api/equipment/materials/[id]': {
      const material = exists(await prisma.equipmentMaterial.findUnique({ where: { id }, include: { suggestion: true } }));
      own(user, material.suggestion.creatorId); return;
    }
    case '/api/equipment/notes/[id]':
      own(user, exists(await prisma.equipmentNote.findUnique({ where: { id } })).userId); return;
    case '/api/equipment/suggestions/[id]/notes': case '/api/equipment/suggestions/[id]/votes': case '/api/equipment/priority-vote': return;
    case '/api/equipment/budget': case '/api/equipment/reorder': case '/api/equipment/rename-group': case '/api/equipment/auto-number':
      admin(user); return;
    case '/api/equipment/seed':
      // This legacy GET mutates data. It must not remain reachable through cookie-authenticated navigation.
      throw new AccessError(403, 'Initialisierung ist über die Web-API gesperrt.');
    default: deny(); // New routes require an explicit access policy.
  }
}

export function secureRoute<R extends Request, C>(route: string, handler: (request: R, context: C) => Promise<Response>) {
  return async (request: R, context: C): Promise<Response> => {
    try {
      const session = await getSession();
      if (!session) throw new AccessError(401, 'Bitte erneut anmelden.');
      checkOrigin(request);
      let body: Body = {};
      const bodyText = request.body === null ? '' : await request.clone().text();
      if (bodyText) {
        if (!request.headers.get('content-type')?.includes('application/json')) throw new AccessError(415, 'JSON erforderlich.');
        try { body = JSON.parse(bodyText); } catch { throw new AccessError(400, 'Ungültiges JSON.'); }
        if (!body || typeof body !== 'object' || Array.isArray(body)) throw new AccessError(400, 'Ungültige Anfrage.');
      }
      const params = await (context as { params?: Promise<Params> } | undefined)?.params || {};
      await authorize(route, request, params, body, session.user);
      const response = await handler(request, context);
      response.headers.set('Cache-Control', 'private, no-store');
      return response;
    } catch (error) {
      if (error instanceof AccessError) return NextResponse.json({ error: error.message }, { status: error.status, headers: { 'Cache-Control': 'no-store' } });
      console.error('API access check failed');
      return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 });
    }
  };
}
