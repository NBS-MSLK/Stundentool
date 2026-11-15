import prisma from '@/lib/prisma';
import {secureRoute,AccessError} from '@/lib/api-access';
import {field, boundedForm, MAX_PDF, uploadRoot} from '@/lib/forum';
import {mkdir, writeFile, unlink} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
export const runtime='nodejs';
type Context={params:Promise<{id:string}>};
export const GET=secureRoute("/api/forum/[id]",async (_request:Request,context:Context)=>{
 const {id}=await context.params; const topic=await prisma.forumTopic.findUnique({where:{id},include:{comments:{orderBy:{createdAt:'asc'},include:{user:{select:{name:true}}}}}});
 if(!topic) throw new AccessError(404,'Thema nicht gefunden.');
 const {pdfKey,...safe}=topic;
 return Response.json({topic:{...safe,hasPdf:!!pdfKey,comments:topic.comments.map(c=>({...c,content:c.hiddenAt?'':c.content,reference:c.hiddenAt?null:c.reference}))}});
});
export const PUT=secureRoute("/api/forum/[id]",async(request:Request,context:Context)=>{
 const {id}=await context.params;
 const topic=await prisma.forumTopic.findUnique({where:{id}});
 if(!topic) throw new AccessError(404,'Thema nicht gefunden.');
 const multipart=request.headers.get('content-type')?.startsWith('multipart/form-data');
 const form=multipart?await boundedForm(request):null;
 const body=form?{title:form.get('title'),description:form.get('description')}:await request.json();
 const title=field(body.title,160,true),description=field(body.description,10000);
 const file=form?.get('pdf');
 let pdfKey:string|undefined, pdfName:string|undefined, newPath:string|undefined;
 if(file instanceof File && file.size) {
  if(file.size>MAX_PDF) throw new AccessError(413,'PDF darf höchstens 10 MB groß sein.');
  const bytes=Buffer.from(await file.arrayBuffer());
  if(file.type!=='application/pdf' || bytes.subarray(0,5).toString()!=='%PDF-') throw new AccessError(400,'Bitte eine gültige PDF-Datei wählen.');
  pdfKey=randomUUID()+'.pdf';pdfName=file.name.replace(/[\\/\r\n\x00-\x1f]/g,'_').slice(0,180);
  const root=uploadRoot();await mkdir(root,{recursive:true});
  newPath=path.join(/* turbopackIgnore: true */ root,pdfKey);
  await writeFile(newPath,bytes,{flag:'wx'});
 }
 try {
  // Optimistic concurrency keeps simultaneous edits from orphaning replacements.
  const result=await prisma.forumTopic.updateMany({where:{id,updatedAt:topic.updatedAt},data:{title,description,...(pdfKey?{pdfKey,pdfName}:{})}});
  if(!result.count) throw new AccessError(409,'Das Thema wurde inzwischen geändert. Bitte erneut laden.');
 } catch(error) {
  if(newPath) await unlink(newPath).catch(()=>{});
  throw error;
 }
 if(pdfKey && topic.pdfKey && /^[a-f0-9-]+\.pdf$/.test(topic.pdfKey)) {
  await unlink(path.join(/* turbopackIgnore: true */ uploadRoot(),topic.pdfKey)).catch(()=>{});
 }
 return Response.json({ok:true});
});
