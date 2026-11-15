import prisma from '@/lib/prisma';
import {secureRoute,AccessError} from '@/lib/api-access';
import {field} from '@/lib/forum';
type Context={params:Promise<{id:string}>};
export const GET=secureRoute("/api/forum/[id]",async (_request:Request,context:Context)=>{
 const {id}=await context.params; const topic=await prisma.forumTopic.findUnique({where:{id},include:{comments:{orderBy:{createdAt:'asc'},include:{user:{select:{name:true}}}}}});
 if(!topic) throw new AccessError(404,'Thema nicht gefunden.');
 const {pdfKey,...safe}=topic;
 return Response.json({topic:{...safe,hasPdf:!!pdfKey,comments:topic.comments.map(c=>({...c,content:c.hiddenAt?'':c.content,reference:c.hiddenAt?null:c.reference}))}});
});
export const PUT=secureRoute("/api/forum/[id]",async(request:Request,context:Context)=>{
 const {id}=await context.params; const body=await request.json();
 if(!await prisma.forumTopic.findUnique({where:{id}})) throw new AccessError(404,'Thema nicht gefunden.');
 await prisma.forumTopic.update({where:{id},data:{title:field(body.title,160,true),description:field(body.description,10000)}});return Response.json({ok:true});
});
