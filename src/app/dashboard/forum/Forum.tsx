'use client';
import {useEffect,useState,FormEvent} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import s from './forum.module.css';
type User={id:string;name:string;role:string};
type Comment={id:string;userId:string|null;parentId:string|null;content:string;reference:string|null;hiddenAt:string|null;createdAt:string;updatedAt:string;user:{name:string}|null};
type Topic={id:string;title:string;description:string;pdfName:string|null;pdfVersion?:string|null;hasPdf?:boolean;comments?:Comment[];_count?:{comments:number}};
type TopicAction = 'create' | 'edit' | 'replace-pdf';
const topicActionLabels: Record<TopicAction, string> = {
 create: 'Neues Thema',
 edit: 'Thema bearbeiten',
 'replace-pdf': 'PDF ersetzen',
};
async function api(url: string, options?: RequestInit) {
 const response = await fetch(url, options);
 const data = await response.json().catch(() => null);
 if (!response.ok || !data) {
  throw new Error(data?.error || (response.status === 413 ? 'Die Datei ist zu groß für den Upload.' : 'Anfrage fehlgeschlagen.'));
 }
 return data;
}
export default function Forum({id}:{id?:string}){
 const router=useRouter();const [user,setUser]=useState<User|null>(null),[topics,setTopics]=useState<Topic[]>([]),[topic,setTopic]=useState<Topic|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[busy,setBusy]=useState(false),[tab,setTab]=useState('document');
 const [topicAction, setTopicAction] = useState<TopicAction | null>(null);
 const [formError, setFormError] = useState('');
 const [notice, setNotice] = useState('');
 useEffect(() => {
  let active = true;
  Promise.all([api('/api/auth'), api(id ? '/api/forum/' + id : '/api/forum')])
   .then(([auth, data]) => {
    if (!active) return;
    setUser(auth.user);
    if (id) {
     const loadedTopic: Topic = data.topic;
     setTopic(loadedTopic);
     const linkedComment = loadedTopic.comments?.some(comment => window.location.hash === '#beitrag-' + comment.id);
     setTab(linkedComment ? 'discussion' : 'document');
    } else {
     setTopics(data.topics);
    }
   })
   .catch(e => { if (active) setError(e.message); })
   .finally(() => { if (active) setLoading(false); });
  return () => { active = false; };
 }, [id]);
 const loadedTopicId = topic?.id;
 useEffect(() => {
  const hash = window.location.hash;
  if (id && loadedTopicId === id && hash.startsWith('#beitrag-')) {
   document.getElementById(hash.slice(1))?.scrollIntoView({block: 'start'});
  }
 }, [id, loadedTopicId]);
 async function refresh(){if(id){const data=await api('/api/forum/'+id);setTopic(data.topic);}}
 function openTopicForm(action: TopicAction) {
  setFormError('');
  setNotice('');
  setTopicAction(action);
 }
 async function saveTopic(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  if (!topicAction || busy) return;
  const form = new FormData(event.currentTarget);
  const file = form.get('pdf');
  if (file instanceof File && file.size > 10 * 1024 * 1024) {
   setFormError('PDF darf höchstens 10 MB groß sein.');
   return;
  }
  setBusy(true);
  setFormError('');
  try {
   if (topicAction === 'create') {
    const data = await api('/api/forum', {method: 'POST', body: form});
    router.push('/dashboard/forum/' + data.id);
   } else {
    await api('/api/forum/' + id, {method: 'PUT', body: form});
    setTopicAction(null);
    setNotice(topicAction === 'replace-pdf' ? 'PDF wurde ersetzt.' : 'Änderungen gespeichert.');
    if (file instanceof File && file.size) setTab('document');
    await refresh().catch(() => setError('Änderungen wurden gespeichert. Bitte lade die Seite neu, um sie zu sehen.'));
   }
  } catch (e) {
   setFormError((e as Error).message);
  } finally {
   setBusy(false);
  }
 }
 async function deleteTopic() {
  if (!topic || busy || topic.id !== id) return;
  if (!confirm(`„${topic.title}“ endgültig löschen? Alle Kommentare, Antworten und ein vorhandener PDF-Anhang werden ebenfalls gelöscht.`)) return;
  setBusy(true);
  setError('');
  setNotice('');
  try {
   await api('/api/forum/' + topic.id, {method: 'DELETE'});
   setTopicAction(null);
   setTopic(null);
   router.replace('/dashboard/forum');
  } catch (e) {
   setError((e as Error).message);
  } finally {
   setBusy(false);
  }
 }
 const pdfUrl = topic?.pdfVersion ? '/api/forum/' + id + '/pdf?v=' + encodeURIComponent(topic.pdfVersion) : null;
 const actions: TopicAction[] = id
  ? (topic ? (topic.hasPdf ? ['edit', 'replace-pdf'] : ['edit']) : [])
  : ['create'];
 return (
  <main className={s.shell}>
   <header className={s.header}>
    <div>
     <Link href={id ? '/dashboard/forum' : '/dashboard'}>← {id ? 'Alle Themen' : 'Dashboard'}</Link>
     <h1>{topic?.title || 'Forum'}</h1>
    </div>
    {user?.role === 'ADMIN' && <div className={s.actions}>
     {actions.map(action => <button key={action} type="button" disabled={busy} aria-expanded={topicAction === action} onClick={() => openTopicForm(action)}>{topicActionLabels[action]}</button>)}
     {id && topic && <button type="button" className={s.dangerAction} disabled={busy} onClick={deleteTopic}>Thema löschen</button>}
    </div>}
   </header>
   {error && <p className={s.error} role="alert">{error}</p>}
   {notice && <p role="status">{notice}</p>}
   {loading && <p>Themen werden geladen …</p>}
   {topicAction && <section className={s.card}>
    <h2>{topicActionLabels[topicAction]}</h2>
    <form key={topicAction} className={s.form} onSubmit={saveTopic}>
     {topicAction === 'replace-pdf' ? <input type="hidden" name="pdfOnly" value="true" /> : <>
      <label>Titel<input name="title" required maxLength={160} defaultValue={topicAction === 'edit' ? topic?.title : ''} readOnly={busy} /></label>
      <label>Beschreibung<textarea name="description" maxLength={10000} defaultValue={topicAction === 'edit' ? topic?.description : ''} readOnly={busy} /></label>
     </>}
     {topic?.pdfName && <p className={s.muted}>Aktueller Anhang · {topic.pdfName}</p>}
     <label>
      {topic?.hasPdf ? 'Neue PDF-Datei' : 'PDF (optional)'} · maximal 10 MB
      <input name="pdf" type="file" accept=".pdf,application/pdf" required={topicAction === 'replace-pdf'} disabled={busy} />
     </label>
     {topic?.hasPdf && topicAction === 'edit' && <p className={s.muted}>Ohne neue Datei bleibt das bisherige PDF erhalten.</p>}
     {formError && <p className={s.error} role="alert">{formError}</p>}
     <div className={s.actions}>
      <button className={s.primary} disabled={busy}>{busy ? 'Wird gespeichert …' : topicAction === 'replace-pdf' ? topicActionLabels[topicAction] : 'Speichern'}</button>
      <button type="button" disabled={busy} onClick={() => setTopicAction(null)}>Abbrechen</button>
     </div>
    </form>
   </section>}
   {!id && !loading && <>
    {topics.length === 0 && <section className={s.card}>Noch keine Themen. Admins können hier das erste Thema anlegen.</section>}
    {topics.map(t => <Link key={t.id} href={'/dashboard/forum/' + t.id} className={s.card + ' ' + s.topicLink}>
     <h2>{t.title}</h2><p>{t.description.slice(0, 200)}</p>
     <p className={s.muted}>{t.pdfName ? 'PDF · ' : ''}{t._count?.comments || 0} Kommentare</p>
    </Link>)}
   </>}
   {topic && <>
    <p className={s.description}>{topic.description}</p>
    {pdfUrl && <nav className={s.mobileTabs} aria-label="Ansicht">
     <button aria-pressed={tab === 'document'} onClick={() => setTab('document')}>Dokument</button>
     <button aria-pressed={tab === 'discussion'} onClick={() => setTab('discussion')}>Diskussion</button>
    </nav>}
    <div className={pdfUrl ? s.split : ''}>
     {pdfUrl && <section className={s.document + ' ' + (tab !== 'document' ? s.mobileHidden : '')}>
      <div className={s.actions}>
       <a className={s.action} href={pdfUrl} target="_blank" rel="noreferrer">PDF öffnen</a>
       <a className={s.action} href={pdfUrl + '&download=1'}>Herunterladen</a>
      </div>
      <iframe key={pdfUrl} title={topic.title + ' - PDF'} src={pdfUrl} />
      <p className={s.muted}>Falls die Vorschau fehlt, bitte &quot;PDF öffnen&quot; verwenden. Zoom und Seitenwahl bietet der PDF-Betrachter deines Browsers.</p>
     </section>}
     <section className={(pdfUrl ? s.discussion : '') + ' ' + (pdfUrl && tab !== 'discussion' ? s.mobileHidden : '')}>
      <h2>Diskussion</h2>
      <CommentForm url={'/api/forum/' + id + '/comments'} onSaved={refresh} />
      {!topic.comments?.length && <p className={s.muted}>Noch keine Kommentare. Was möchtest du besprechen?</p>}
      {topic.comments?.filter(c => !c.parentId).map(c => <CommentItem key={c.id} comment={c} replies={topic.comments!.filter(r => r.parentId === c.id)} user={user} topicId={topic.id} refresh={refresh} />)}
     </section>
    </div>
   </>}
  </main>
 );
}
function CommentForm({url,parentId,initial,onSaved,onCancel}:{url:string;parentId?:string;initial?:Comment;onSaved:()=>Promise<void>;onCancel?:()=>void}){
 const [content,setContent]=useState(initial?.content||''),[reference,setReference]=useState(initial?.reference||''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function submit(event:FormEvent){event.preventDefault();setBusy(true);setError('');try{await api(url,{method:initial?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({content,reference,parentId})});await onSaved();setContent('');setReference('');onCancel?.();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return (
  <form className={s.form + ' ' + s.card} onSubmit={submit}>
   <label>
    {initial ? 'Beitrag bearbeiten' : parentId ? 'Antwort' : 'Dein Kommentar'}
    <textarea autoFocus={!!initial} required maxLength={5000} readOnly={busy} value={content} onChange={e => setContent(e.target.value)} />
   </label>
   <label>
    Bezug (optional)
    <input maxLength={120} placeholder="z. B. Seite 2, § 4" readOnly={busy} value={reference} onChange={e => setReference(e.target.value)} />
   </label>
   {error && <p role="alert" className={s.error}>{error}</p>}
   <div className={s.actions}>
    <button className={s.primary} disabled={busy || !content.trim()}>
     {busy ? 'Wird gespeichert …' : initial ? 'Änderungen speichern' : 'Speichern'}
    </button>
    {onCancel && <button type="button" disabled={busy} onClick={onCancel}>Abbrechen</button>}
   </div>
  </form>
 );
}
function CommentItem({comment:c,replies=[],user,topicId,refresh}:{comment:Comment;replies?:Comment[];user:User|null;topicId:string;refresh:()=>Promise<void>}){
 const [mode,setMode]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function hide(){if(!confirm('Diesen Beitrag ausblenden?'))return;setBusy(true);try{await api('/api/forum/comments/'+c.id,{method:'DELETE'});await refresh();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 const canEdit = !!user && c.userId === user.id && !c.hiddenAt;
 return (
  <article id={'beitrag-' + c.id} className={s.comment}>
   <header className={s.commentHeader}>
    <p className={s.muted}>
     {c.user?.name || 'Gelöschter Benutzer'} · {new Date(c.createdAt).toLocaleString('de-DE')}
     {!c.hiddenAt && c.updatedAt !== c.createdAt && ' · bearbeitet'}
    </p>
    {canEdit && mode !== 'edit' && <button type="button" onClick={() => setMode('edit')}>Beitrag bearbeiten</button>}
   </header>
   {c.hiddenAt ? <p className={s.content}>Beitrag entfernt</p> : mode === 'edit' ? (
    <CommentForm key="edit" url={'/api/forum/comments/' + c.id} initial={c} onSaved={refresh} onCancel={() => setMode('')} />
   ) : (
    <>
     <p className={s.content}>{c.content}</p>
     {c.reference && <p className={s.muted}>Bezug: {c.reference}</p>}
     <div className={s.actions}>
      {!c.parentId && <button type="button" onClick={() => setMode(mode === 'reply' ? '' : 'reply')}>Antworten</button>}
      {user?.role === 'ADMIN' && <button type="button" disabled={busy} onClick={hide}>Ausblenden</button>}
     </div>
     {mode === 'reply' && <CommentForm url={'/api/forum/' + topicId + '/comments'} parentId={c.id} onSaved={refresh} onCancel={() => setMode('')} />}
    </>
   )}
   {error && <p role="alert">{error}</p>}
   {replies.map(reply => (
    <div key={reply.id} className={s.reply}>
     <CommentItem comment={reply} user={user} topicId={topicId} refresh={refresh} />
    </div>
   ))}
  </article>
 );
}
