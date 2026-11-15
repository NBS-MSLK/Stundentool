import { AccessError } from './api-access';
import path from 'node:path';
export const MAX_PDF = 10 * 1024 * 1024;
// PDFs are runtime data on a persistent volume, not deployment dependencies.
export const uploadRoot = () => path.resolve(/* turbopackIgnore: true */ process.env.FORUM_UPLOAD_DIR || 'uploads/forum');
export function field(value: unknown, max: number, required = false): string {
 if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim())) throw new AccessError(400, 'Bitte Eingaben prüfen.');
 return value.trim();
}
export async function boundedForm(request: Request) {
 const reader = request.body?.getReader();
 if (!reader) throw new AccessError(400, 'Upload fehlt.');
 const chunks: Uint8Array[] = []; let size = 0;
 try { while (true) { const {done, value} = await reader.read(); if(done) break; size += value.byteLength; if(size > MAX_PDF + 65536) { await reader.cancel(); throw new AccessError(413, 'PDF darf höchstens 10 MB groß sein.'); } chunks.push(value); } }
 finally { reader.releaseLock(); }
 try { return await new Response(Buffer.concat(chunks), {headers: {'Content-Type': request.headers.get('content-type') || ''}}).formData(); }
 catch { throw new AccessError(400, 'Ungültiger Upload.'); }
}
