import prisma from '@/lib/prisma';
import {secureRoute,AccessError} from '@/lib/api-access';
import {uploadRoot} from '@/lib/forum';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
export const runtime='nodejs';
export const GET=secureRoute("/api/forum/[id]/pdf",async(request:Request,context:{params:Promise<{id:string}>})=>{
 const {id}=await context.params;const topic=await prisma.forumTopic.findUnique({where:{id}});
 if(!topic?.pdfKey || !/^[a-f0-9-]+\.pdf$/.test(topic.pdfKey)) throw new AccessError(404,'PDF nicht gefunden.');
 let bytes;try{bytes=await readFile(path.join(/* turbopackIgnore: true */ uploadRoot(),topic.pdfKey));}catch{throw new AccessError(404,'PDF-Datei nicht verfügbar.');}
 const disposition=new URL(request.url).searchParams.has('download')?'attachment':'inline';
 return new Response(bytes,{headers:{'Content-Type':'application/pdf','Content-Length':String(bytes.length),'X-Content-Type-Options':'nosniff','Content-Disposition':disposition+"; filename=document.pdf; filename*=UTF-8''"+encodeURIComponent(topic.pdfName||'document.pdf')}});
});
