import prisma from '@/lib/prisma';
import {secureRoute,AccessError} from '@/lib/api-access';
import {field} from '@/lib/forum';
import {getSession} from '@/lib/session';
type Context={params:Promise<{id:string}>};
export const PUT=secureRoute("/api/forum/comments/[id]",async(request:Request,context:Context)=>{
 const {id}=await context.params,body=await request.json(),session=await getSession();
 const result=await prisma.forumComment.updateMany({where:{id,userId:session!.user.id,hiddenAt:null},data:{content:field(body.content,5000,true),reference:field(body.reference??'',120)}});
 if(!result.count) throw new AccessError(409,'Beitrag nicht mehr bearbeitbar.');return Response.json({ok:true});
});
export const DELETE=secureRoute("/api/forum/comments/[id]",async(_request:Request,context:Context)=>{
 const {id}=await context.params;await prisma.forumComment.update({where:{id},data:{hiddenAt:new Date()}});return Response.json({ok:true});
});
