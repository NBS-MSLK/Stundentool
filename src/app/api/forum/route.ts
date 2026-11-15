import prisma from '@/lib/prisma';
import { secureRoute, AccessError } from '@/lib/api-access';
import {getSession} from '@/lib/session';
import {boundedForm, field, MAX_PDF, uploadRoot} from '@/lib/forum';
import {mkdir, writeFile, unlink} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
export const runtime = 'nodejs';
export const GET = secureRoute("/api/forum", async () => {
 const topics = await prisma.forumTopic.findMany({orderBy: {createdAt:'desc'}, select:{id:true,title:true,description:true,pdfName:true,createdAt:true,_count:{select:{comments:{where:{hiddenAt:null}}}}}});
 return Response.json({topics});
});
export const POST = secureRoute("/api/forum", async (request: Request) => {
 const form = await boundedForm(request);
 const title=field(form.get('title'),160,true), description=field(form.get('description'),10000);
 const file=form.get('pdf'); let pdfKey: string | null=null; let pdfName: string | null=null;
 if(file instanceof File && file.size) {
  if(file.size>MAX_PDF) throw new AccessError(413,'PDF darf höchstens 10 MB groß sein.');
  const bytes=Buffer.from(await file.arrayBuffer());
  if(file.type!=='application/pdf' || bytes.subarray(0,5).toString()!=='%PDF-') throw new AccessError(400,'Bitte eine gültige PDF-Datei wählen.');
  pdfKey=randomUUID()+'.pdf'; pdfName=file.name.replace(/[\\/\r\n\x00-\x1f]/g,'_').slice(0,180);
  await mkdir(uploadRoot(),{recursive:true}); await writeFile(path.join(/* turbopackIgnore: true */ uploadRoot(),pdfKey),bytes,{flag:'wx'});
 }
 try { const session=await getSession(); const topic=await prisma.forumTopic.create({data:{title,description,pdfKey,pdfName,authorId:session!.user.id}}); return Response.json({id:topic.id},{status:201}); }
 catch(error) {if(pdfKey) await unlink(path.join(/* turbopackIgnore: true */ uploadRoot(),pdfKey)).catch(()=>{}); throw error;}
});
