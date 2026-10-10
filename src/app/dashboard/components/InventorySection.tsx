'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type InventoryItem = { id: string; title: string; quantity: number; inventoryNumber: number; category: string };

export default function InventorySection() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    fetch('/api/equipment', { cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw new Error('Inventar nicht verfügbar');
        const data = await response.json();
        if (active) setItems(data.categories.flatMap((category: { title: string; suggestions: (InventoryItem & { status: string })[] }) =>
          category.suggestions.filter(item => item.status === 'PURCHASED').map(item => ({ ...item, category: category.title }))
        ).sort((a: InventoryItem, b: InventoryItem) => a.inventoryNumber - b.inventoryNumber));
      })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return <section className="glass-card">
    <h2>Ausstattung</h2>
    <p style={{ color: 'var(--text-secondary)', margin: '0.75rem 0 1.5rem' }}>Das Inventar unseres Makerspaces. Angeschaffte Dinge werden automatisch übernommen; ihre Kosten bleiben im Anschaffungsbudget enthalten.</p>
    {loading ? <p role="status">Inventar wird geladen …</p> : error ? <p role="alert">Das Inventar konnte nicht geladen werden. Bitte lade die Seite erneut.</p> : items.length === 0 ? <p>Noch keine Anschaffungen als „Angeschafft“ markiert.</p> : <>
      <p>{items.length} Inventarpositionen · {items.reduce((sum, item) => sum + item.quantity, 0)} Stück</p>
      <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <caption className="sr-only">Inventarliste des Makerspaces</caption>
          <thead><tr>{['Inventarnummer', 'Bezeichnung', 'Kategorie', 'Menge'].map(label => <th key={label} scope="col" style={{ padding: '0.75rem', borderBottom: '2px solid var(--border-color)' }}>{label}</th>)}</tr></thead>
          <tbody>{items.map(item => <tr key={item.id}>
            <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>INV-{String(item.inventoryNumber).padStart(4, '0')}</td>
            <td style={{ padding: '0.75rem' }}><Link href={`/dashboard/equipment/${item.id}`}>{item.title}</Link></td>
            <td style={{ padding: '0.75rem' }}>{item.category}</td>
            <td style={{ padding: '0.75rem' }}>{item.quantity}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </>}
  </section>;
}
