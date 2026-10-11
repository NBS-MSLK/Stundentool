import Link from 'next/link';
import { purchasedGroups } from '@/lib/equipment-budget';
import styles from './PurchasedOverview.module.css';

const money = (value: number) => value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });

export default function PurchasedOverview({ categories }: { categories: Parameters<typeof purchasedGroups>[0] }) {
  const groups = purchasedGroups(categories);
  const total = groups.reduce((sum, group) => sum + group.total, 0);
  return <section className={`glass-card ${styles.overview}`} aria-labelledby="purchased-heading">
    <header className={styles.header}>
      <div><h2 id="purchased-heading">Bereits angeschafft</h2><p>Ausgaben nach Anschaffungskategorie – zum Aufklappen und Nachsehen.</p></div>
      <div className={styles.total}><span>Insgesamt ausgegeben</span><strong>{money(total)}</strong></div>
    </header>
    {!groups.length ? <p>Noch keine Anschaffungen abgeschlossen.</p> : <div className={styles.groups}>
      {groups.map(group => <details key={group.title} className={styles.group}>
        <summary className={styles.summary}>
          <span className={styles.chevron} aria-hidden="true">›</span>
          <span className={styles.name}><strong>{group.title}</strong><small>{group.items.length} {group.items.length === 1 ? 'Anschaffung' : 'Anschaffungen'}</small></span>
          <strong className={styles.amount}>{money(group.total)}</strong>
        </summary>
        <ul className={styles.items}>{group.items.map(item => <li key={item.id}>
          <div><Link href={`/dashboard/equipment/${item.id}`}>{item.title}</Link><small>{item.quantity || 1} Stück · {item.category}</small></div>
          <span className={styles.amount}>{money(item.cost)}</span>
        </li>)}</ul>
      </details>)}
    </div>}
    <p className={styles.note}>Enthalten sind nur als „Angeschafft“ markierte Positionen, inklusive Mengen und Zubehör. Diese Ausgaben sind bereits im Budget oben verrechnet. <Link href="/dashboard?tab=INVENTORY">Zum Inventar →</Link></p>
  </section>;
}
