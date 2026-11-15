'use client';
import Link from 'next/link';
import Image from 'next/image';
export type DashboardTab = 'WEBHEIMAT' | 'STUNDEN' | 'TASKS' | 'EQUIPMENT' | 'INVENTORY' | 'LEADER';
export default function DashboardSidebar({user, activeTab, onSelect}: {user: {name: string; role: string}; activeTab: DashboardTab | 'FORUM'; onSelect?: (tab: DashboardTab) => void}) {
  const tabs = [{id: 'WEBHEIMAT', label: 'Start', icon: 'grid'}, {id: 'STUNDEN', label: 'Stunden', icon: 'clock'}, {id: 'TASKS', label: 'Aufgaben', icon: 'tasks'}, {id: 'EQUIPMENT', label: 'Anschaffungen', icon: 'money'}, {id: 'INVENTORY', label: 'Ausstattung', icon: 'box'}, {id: 'LEADER', label: 'Übersicht', icon: 'money'}] as const;
  const renderTab = (tab: typeof tabs[number]) => <Link href={"/dashboard?tab=" + tab.id} key={tab.id} className={activeTab === tab.id ? 'maker-nav active' : 'maker-nav'} aria-current={activeTab === tab.id ? 'page' : undefined} onClick={onSelect ? event => { event.preventDefault(); onSelect(tab.id); } : undefined}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">{tab.icon === 'grid' ? <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></> : tab.icon === 'clock' ? <><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></> : tab.icon === 'tasks' ? <><rect x="4" y="3" width="16" height="18" rx="3"/><path d="m8 12 3 3 5-6"/></> : tab.icon === 'money' ? <><rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M5 9h2m10 6h2"/></> : <path d="m12 3 9 5v9l-9 5-9-5V8zm0 10v9M3 8l9 5 9-5M8 5l9 5"/>}</svg>{tab.label}</Link>;
  return (
      <aside className="maker-sidebar">
        <Link href="/dashboard" aria-label="MakerSpace Start"><Image src="/brand/makerspace.png" alt="MakerSpace Lübbecke e. V." className="maker-logo" width={938} height={530} sizes="(max-width: 650px) 135px, 196px" /></Link>
        <span className="maker-eyebrow sidebar-caption">Dein Makerspace</span>
        <nav className="maker-navigation" aria-label="Hauptnavigation">{tabs.filter(tab => ['WEBHEIMAT', 'TASKS', 'INVENTORY'].includes(tab.id)).map(renderTab)}<Link href="/dashboard/forum" className={activeTab === "FORUM" ? "maker-nav active" : "maker-nav"} aria-current={activeTab === "FORUM" ? "page" : undefined}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-3 3V11.5a8.5 8.5 0 0 1 8.5-8.5h3a8.5 8.5 0 0 1 8.5 8.5Z"/><path d="M7 9h8M7 13h6"/></svg>Forum</Link><span className="maker-eyebrow maker-nav-group">LEADER-Förderung</span>{(['LEADER', 'STUNDEN', 'EQUIPMENT'] as const).map(id => renderTab(tabs.find(tab => tab.id === id)!))}</nav>
        <div className="maker-sidebar-note"><span className="maker-eyebrow">Zusammen machen</span><strong>Dein Ort für Ideen.</strong><p>Gemeinsam machen. Wissen teilen. Neues ausprobieren.</p></div>
        <div className="maker-profile"><span className="maker-avatar">{user.name.split(' ').map(part => part[0]).slice(0,2).join('')}</span><div><strong>{user.name}</strong><p>{user.role === 'ADMIN' ? 'Administrator' : 'Mitglied'}</p></div></div>
      </aside>
  );
}
