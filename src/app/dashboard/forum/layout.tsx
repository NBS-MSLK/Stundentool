import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import DashboardSidebar from '../components/DashboardSidebar';
import styles from './forum.module.css';

export default async function ForumLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/');
  return (
    <div className={'maker-shell ' + styles.layout}>
      <DashboardSidebar user={{name: session.user.name, role: session.user.role}} activeTab="FORUM" />
      <div className={styles.main}>{children}</div>
    </div>
  );
}
