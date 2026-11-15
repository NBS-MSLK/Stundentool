'use client';

import { Suspense, useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import DashboardSidebar, { type DashboardTab } from './components/DashboardSidebar';

function DashboardFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [user, setUser] = useState({ name: 'Mitglied', role: 'USER' });
  const [equipmentTab, setEquipmentTab] = useState<DashboardTab>('INVENTORY');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth', { cache: 'no-store' }).then(async response => {
      if (!response.ok) return;
      const data = await response.json();
      if (!cancelled) setUser(data.user);
    }).catch(() => { /* AuthBoundary handles session failures. */ });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!pathname.startsWith('/dashboard/equipment/') || pathname.endsWith('/purchased')) return;
    let cancelled = false;
    const id = pathname.split('/')[3];
    fetch(`/api/equipment/suggestions/${encodeURIComponent(id)}`).then(async response => {
      if (!response.ok) return;
      const data = await response.json();
      if (!cancelled && data.suggestion) setEquipmentTab(data.suggestion.status === 'PURCHASED' ? 'INVENTORY' : 'EQUIPMENT');
    }).catch(() => { /* Keep the navigation available when details fail to load. */ });
    return () => { cancelled = true; };
  }, [pathname]);

  const requestedTab = searchParams.get('tab');
  const tabs: DashboardTab[] = ['WEBHEIMAT', 'STUNDEN', 'TASKS', 'EQUIPMENT', 'INVENTORY', 'LEADER'];
  const activeTab = pathname.startsWith('/dashboard/forum') ? 'FORUM'
    : pathname.startsWith('/dashboard/tasks') ? 'TASKS'
    : pathname.startsWith('/dashboard/equipment') ? (pathname.endsWith('/purchased') ? 'INVENTORY' : equipmentTab)
    : /^\/dashboard\/(new|edit|highscore)(\/|$)/.test(pathname) ? 'STUNDEN'
    : tabs.find(tab => tab === requestedTab) || 'WEBHEIMAT';

  return <div className="maker-shell">
    <DashboardSidebar user={user} activeTab={activeTab} />
    <div style={{ minWidth: 0 }}>{children}</div>
  </div>;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<p role="status">Dashboard wird geladen …</p>}><DashboardFrame>{children}</DashboardFrame></Suspense>;
}
