const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const { DatabaseSync } = require('node:sqlite');
const { createHash } = require('node:crypto');
// Exercise real route handlers and SQLite, with only Next's request-cookie adapter mocked.
test('forum handlers: permissions, uploads, replies, moderation and persistence', async () => {
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'forum-handlers-'));
 process.env.DATABASE_URL='file:'+path.join(dir,'test.sqlite').replaceAll('\\','/');
 process.env.FORUM_UPLOAD_DIR=path.join(dir,'uploads');
 new DatabaseSync(path.join(dir,'test.sqlite')).close();
 const init=require('node:child_process').spawnSync(process.execPath,['node_modules/prisma/build/index.js','db','push','--skip-generate'],{env:process.env,encoding:'utf8'});
 assert.equal(init.status,0,init.stdout+init.stderr);
 const originalLoad=Module._load;
 let token;
 Module._load=function(name,parent,isMain){
  if(name==='next/headers')return {cookies:async()=>({get:()=>token?{value:token}:undefined})};
  if(name.startsWith('@/'))name=path.join(process.cwd(),'src',name.slice(2));
  return originalLoad.call(this,name,parent,isMain);
 };
 const previousTS=require.extensions['.ts'];
 require.extensions['.ts']=(module,filename)=>module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,filename);
 const prisma=require('../src/lib/prisma.ts').default;
 try {
  const script=fs.readFileSync('scripts/prepare-forum.mjs','utf8');
  const statements=[...script.matchAll(/executeRawUnsafe\('([^']+)'\)/g)].map(m=>m[1]);
  for(const sql of statements)await prisma.$executeRawUnsafe(sql);
  for(const sql of statements)await prisma.$executeRawUnsafe(sql); // idempotent preparation
  const tokens={};
  for(const [id,role] of [['admin','ADMIN'],['alice','USER'],['bob','USER']]){
   await prisma.user.create({data:{id,name:id,role}});
   tokens[id]=id==='admin'?'a'.repeat(64):id==='alice'?'b'.repeat(64):'c'.repeat(64);
   await prisma.session.create({data:{tokenHash:createHash('sha256').update(tokens[id]).digest('hex'),userId:id,expiresAt:new Date(Date.now()+3600000)}});
  }
  const topics=require('../src/app/api/forum/route.ts');
  const detail=require('../src/app/api/forum/[id]/route.ts');
  const comments=require('../src/app/api/forum/[id]/comments/route.ts');
  const edit=require('../src/app/api/forum/comments/[id]/route.ts');
  const pdf=require('../src/app/api/forum/[id]/pdf/route.ts');
  async function call(handler,who,{id,body,method='GET',origin='http://localhost'}={}){
   token=tokens[who]; const headers={origin};
   if(body && !(body instanceof FormData))headers['content-type']='application/json';
   return handler(new Request('http://localhost/api/forum',{method,headers,body:body instanceof FormData?body:body?JSON.stringify(body):undefined}),{params:Promise.resolve({id})});
  }
  const form=(bytes='%PDF-1.4\n%%EOF',type='application/pdf')=>{const f=new FormData();f.set('title','Test');f.set('description','Discussion');f.set('pdf',new Blob([bytes],{type}),'test.pdf');return f;};
  assert.equal((await call(topics.GET)).status,401);
  assert.equal((await call(topics.POST,'alice',{method:'POST',body:form()})).status,403);
  assert.equal((await call(topics.POST,'admin',{method:'POST',body:form(),origin:'https://evil.example'})).status,403);
  assert.equal((await call(topics.POST,'admin',{method:'POST',body:form('not a pdf')})).status,400);
  assert.equal((await call(topics.POST,'admin',{method:'POST',body:form('x'.repeat(10*1024*1024+1))})).status,413);
  const made=await call(topics.POST,'admin',{method:'POST',body:form()});assert.equal(made.status,201,await made.clone().text());const {id}=await made.json();
  assert.equal((await call(pdf.GET,undefined,{id})).status,401);
  const downloaded=await call(pdf.GET,'alice',{id});assert.equal(downloaded.status,200);assert.equal(await downloaded.text(),'%PDF-1.4\n%%EOF');
  assert.equal((await call(comments.POST,'alice',{id,method:'POST',body:{content:'Question',reference:'§ 4'}})).status,201);
  let rows=await prisma.forumComment.findMany({where:{topicId:id}});const main=rows[0].id;
  assert.equal((await call(edit.PUT,'bob',{id:main,method:'PUT',body:{content:'Forgery'}})).status,403);
  assert.equal((await call(edit.PUT,'alice',{id:main,method:'PUT',body:{content:'Edited'}})).status,200);
  assert.equal((await call(comments.POST,'bob',{id,method:'POST',body:{content:'Reply',parentId:main}})).status,201);
  rows=await prisma.forumComment.findMany({where:{topicId:id}});const reply=rows.find(r=>r.parentId).id;
  assert.equal((await call(comments.POST,'bob',{id,method:'POST',body:{content:'Too deep',parentId:reply}})).status,400);
  const other=await prisma.forumTopic.create({data:{title:'Other',description:''}});
  assert.equal((await call(comments.POST,'bob',{id:other.id,method:'POST',body:{content:'Wrong topic',parentId:main}})).status,400);
  assert.equal((await call(edit.DELETE,'alice',{id:main,method:'DELETE'})).status,403);
  assert.equal((await call(edit.DELETE,'admin',{id:main,method:'DELETE'})).status,200);
  const shown=(await (await call(detail.GET,'bob',{id})).json()).topic;
  assert.equal(shown.comments.find(c=>c.id===main).content,'');assert.equal(shown.comments.find(c=>c.id===main).reference,null);assert.equal(shown.comments.length,2);
  assert.equal((await call(comments.POST,'bob',{id,method:'POST',body:{content:'Hidden parent',parentId:main}})).status,400);
  await prisma.user.delete({where:{id:'alice'}});assert.equal((await prisma.forumComment.findUnique({where:{id:main}})).userId,null);
  await prisma.$disconnect();assert.equal(await prisma.forumTopic.count(),2);assert.equal(fs.readdirSync(process.env.FORUM_UPLOAD_DIR).length,1);
 } finally {await prisma.$disconnect();Module._load=originalLoad;if(previousTS)require.extensions['.ts']=previousTS;else delete require.extensions['.ts'];}
});
