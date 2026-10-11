'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PurchasedOverview from '../../components/PurchasedOverview';
import type { purchasedGroups } from '@/lib/equipment-budget';

export default function PurchasedPage() {
  const [categories, setCategories] = useState<Parameters<typeof purchasedGroups>[0]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/equipment', { cache: 'no-store', signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('Ausgaben konnten nicht geladen werden.');
        const data = await response.json();
        if (!controller.signal.aborted) setCategories(data.categories);
      })
      .catch(() => { if (!controller.signal.aborted) setError(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  return <main className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
    <Link href="/dashboard?tab=EQUIPMENT">← Zurück zu den Anschaffungen</Link>
    <h1 style={{ fontSize: '1.75rem', margin: '1.5rem 0' }}>Abgeschlossene Anschaffungen</h1>
    {loading ? <p role="status">Ausgaben werden geladen …</p> : error ? <p role="alert">Die Ausgaben konnten nicht geladen werden. Bitte lade die Seite erneut.</p> : <PurchasedOverview categories={categories} />}
  </main>;
}
