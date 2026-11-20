import prisma from '@/lib/prisma';
import {secureRoute,AccessError} from '@/lib/api-access';
import {field, boundedForm, MAX_PDF, uploadRoot} from '@/lib/forum';
import {mkdir, writeFile, unlink} from 'node:fs/promises';
import {createHash, randomUUID} from 'node:crypto';
import path from 'node:path';
export const runtime='nodejs';
type Context={params:Promise<{id:string}>};

async function deletePdf(pdfKey: string | null) {
 if (!pdfKey || !/^[a-f0-9-]+\.pdf$/.test(pdfKey)) return;
 try {
  await unlink(path.join(/* turbopackIgnore: true */ uploadRoot(), pdfKey));
 } catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
   console.error('Could not remove forum PDF', error);
  }
 }
}

export const GET=secureRoute("/api/forum/[id]",async (_request:Request,context:Context)=>{
 const {id}=await context.params; const topic=await prisma.forumTopic.findUnique({where:{id},include:{comments:{orderBy:{createdAt:'asc'},include:{user:{select:{name:true}}}}}});
 if(!topic) throw new AccessError(404,'Thema nicht gefunden.');
 const {pdfKey,...safe}=topic;
 const pdfVersion = pdfKey ? createHash('sha256').update(pdfKey).digest('hex').slice(0, 16) : null;
 return Response.json({topic:{...safe,hasPdf:!!pdfKey,pdfVersion,comments:topic.comments.map(c=>({...c,content:c.hiddenAt?'':c.content,reference:c.hiddenAt?null:c.reference}))}});
});
export const PUT=secureRoute("/api/forum/[id]",async(request:Request,context:Context)=>{
 const {id}=await context.params;
 const topic=await prisma.forumTopic.findUnique({where:{id}});
 if(!topic) throw new AccessError(404,'Thema nicht gefunden.');
 const multipart=request.headers.get('content-type')?.startsWith('multipart/form-data');
 const form=multipart?await boundedForm(request):null;
 const pdfOnly = form?.get('pdfOnly') === 'true';
 const body = form ? {title: form.get('title'), description: form.get('description')} : await request.json();
 const details = pdfOnly ? {} : {title: field(body.title, 160, true), description: field(body.description, 10000)};
 const file=form?.get('pdf');
 const hasFile = file instanceof File && !!file.size;
 if (pdfOnly && !hasFile) {
  throw new AccessError(400, 'Bitte eine neue PDF-Datei auswählen.');
 }
 let pdfKey:string|undefined, pdfName:string|undefined, newPath:string|undefined;
 if(hasFile) {
  if(file.size>MAX_PDF) throw new AccessError(413,'PDF darf höchstens 10 MB groß sein.');
  const bytes=Buffer.from(await file.arrayBuffer());
  const validType = !file.type || file.type === 'application/pdf' || file.type === 'application/octet-stream';
  if(!validType || bytes.subarray(0,5).toString()!=='%PDF-') throw new AccessError(400,'Bitte eine gültige PDF-Datei wählen.');
  pdfKey=randomUUID()+'.pdf';pdfName=file.name.replace(/[\\/\r\n\x00-\x1f]/g,'_').slice(0,180);
  const root=uploadRoot();await mkdir(root,{recursive:true});
  newPath=path.join(/* turbopackIgnore: true */ root,pdfKey);
  await writeFile(newPath,bytes,{flag:'wx'});
 }
 try {
  // Optimistic concurrency keeps simultaneous edits from orphaning replacements.
  const attachment = pdfKey ? {pdfKey, pdfName} : {};
  const result=await prisma.forumTopic.updateMany({where:{id,updatedAt:topic.updatedAt,pdfKey:topic.pdfKey},data:{...details,...attachment}});
  if(!result.count) throw new AccessError(409,'Das Thema wurde inzwischen geändert. Bitte erneut laden.');
 } catch(error) {
  if(newPath) await unlink(newPath).catch(()=>{});
  throw error;
 }
 if (pdfKey) await deletePdf(topic.pdfKey);
 return Response.json({ok:true});
});

export const DELETE = secureRoute("/api/forum/[id]", async (_request: Request, context: Context) => {
 const {id} = await context.params;
 const pdfKey = await prisma.$transaction(async tx => {
  const topic = await tx.forumTopic.findUnique({where: {id}, select: {pdfKey: true}});
  if (!topic) throw new AccessError(404, 'Thema nicht gefunden.');

  // SQLite checks the reply relation's RESTRICT constraint during the topic's cascade.
  await tx.forumComment.updateMany({where: {topicId: id, parentId: {not: null}}, data: {parentId: null}});
  await tx.forumTopic.delete({where: {id}, select: {id: true}});
  return topic.pdfKey;
 });
 await deletePdf(pdfKey);
 return Response.json({ok: true});
});
