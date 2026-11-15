import prisma from '@/lib/prisma';
import {secureRoute,AccessError} from '@/lib/api-access';
import {getSession} from '@/lib/session';
import {field} from '@/lib/forum';
export const POST=secureRoute("/api/forum/[id]/comments",async(request:Request,context:{params:Promise<{id:string}>})=>{
 const {id}=await context.params, body=await request.json(),session=await getSession();
 const content=field(body.content,5000,true),reference=field(body.reference??'',120);
 await prisma.$transaction(async tx=>{
 if(!await tx.forumTopic.findUnique({where:{id}})) throw new AccessError(404,'Thema nicht gefunden.');
 const parentId=body.parentId == null ? null : field(body.parentId,100,true);
 if(parentId){const parent=await tx.forumComment.findUnique({where:{id:parentId}});if(!parent||parent.topicId!==id||parent.parentId||parent.hiddenAt) throw new AccessError(400,'Ungültiger Antwortbezug.');}
 await tx.forumComment.create({data:{topicId:id,userId:session!.user.id,parentId,content,reference}});
 });return Response.json({ok:true},{status:201});
});
