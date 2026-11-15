import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import styles from './forum.module.css';

export default async function ForumLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/');
  return (
    <div className={styles.layout}>
      <div className={styles.main}>{children}</div>
    </div>
  );
}
