import prisma from '@/lib/prisma';
import { secureRoute, AccessError } from '@/lib/api-access';
import {getSession} from '@/lib/session';
import {boundedForm, field, MAX_PDF, uploadRoot} from '@/lib/forum';
import {mkdir, writeFile, unlink} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
export const runtime = 'nodejs';
export const GET = secureRoute("/api/forum", async (request: Request) => {
 if (new URL(request.url).searchParams.get('recent') === 'true') {
  const records = await prisma.forumTopic.findMany({select:{
   id:true,title:true,updatedAt:true,author:{select:{name:true}},
   comments:{where:{hiddenAt:null},orderBy:[{updatedAt:'desc'},{id:'asc'}],take:1,select:{id:true,updatedAt:true,user:{select:{name:true}}}},
  }});
  const topics = records.map(topic => {
   const comment = topic.comments[0];
   const hasReply = comment && comment.updatedAt > topic.updatedAt;
   return {id:topic.id,title:topic.title,lastActivityAt:hasReply ? comment.updatedAt : topic.updatedAt,
    authorName:(hasReply ? comment.user?.name : topic.author?.name) || 'Gelöschtes Mitglied',
    activity:hasReply ? 'Kommentar' : 'Thema',commentId:hasReply ? comment.id : null};
  }).sort((a,b)=>b.lastActivityAt.getTime()-a.lastActivityAt.getTime() || a.id.localeCompare(b.id)).slice(0,3);
  return Response.json({topics});
 }
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
