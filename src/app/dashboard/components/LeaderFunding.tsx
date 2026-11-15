'use client';
import { useEffect, useState } from 'react';
import { equipmentBudgetTotals } from '@/lib/equipment-budget';
import FinanceCard from './FinanceCard';
export default function LeaderFunding({ stats }: { stats: { hardcodedBaseHours: number; systemActiveHours: number; totalGoalHours: number } }) {
  const [funding, setFunding] = useState<{ disbursedAmount: number; submittedAmount: number; totalAmount: number; lastSubmittedDate: string | null } | null>(null);
  const [equipmentBudget, setEquipmentBudget] = useState<{ totalAmount: number } | null>(null);
  const [equipmentCategories, setEquipmentCategories] = useState<Parameters<typeof equipmentBudgetTotals>[0]>([]);
  const [error, setError] = useState('');
  useEffect(() => { Promise.all(['/api/funding', '/api/equipment'].map(async url => {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error();
    return response.json();
  })).then(([f, e]) => { setFunding(f.funding); setEquipmentBudget(e.budget); setEquipmentCategories(e.categories); }).catch(() => setError('Förderdaten konnten nicht geladen werden.')); }, []);
  const calculateDaysAgo = (dateStr: string) => {
    if (!dateStr) return null;
    const past = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - past.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'heute';
    if (diffDays === 1) return 'gestern';

    const weeks = Math.floor(diffDays / 7);
    const days = diffDays % 7;

    if (weeks === 0) return `vor ${days} Tagen`;
    return `vor ${weeks} Wochen${days > 0 ? ` und ${days} Tagen` : ''}`;
  };


  const { spentAmount: eqSpentAmount, plannedAmount: eqPlannedAmount } = equipmentBudgetTotals(equipmentCategories);
  const eqTotalBudget = equipmentBudget ? equipmentBudget.totalAmount : 0;

  const eqSpentPercentage = eqTotalBudget > 0 ? (eqSpentAmount / eqTotalBudget) * 100 : 0;
  const eqPlannedDifference = eqPlannedAmount - eqTotalBudget;

  const money = (value: number) => value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const percent = (value: number, total: number) => total > 0 ? Math.max(0, value / total * 100) : 0;

  return <>{error && <p role="alert">{error}</p>}      <div className="maker-finance-grid">
        {funding && <FinanceCard
          title="Gesamtfinanzierung"
          value={money(Number(funding.disbursedAmount) + Number(funding.submittedAmount))}
          target={'von ' + money(Number(funding.totalAmount)) + ' Fördermitteln'}
          progress={percent(Number(funding.disbursedAmount) + Number(funding.submittedAmount), Number(funding.totalAmount))}
          progressLabel="Ausgezahlt & eingereicht"
          amounts={[
            {label: 'Ausgezahlt', value: money(Number(funding.disbursedAmount)), share: percent(Number(funding.disbursedAmount), Number(funding.totalAmount)), color: 'var(--success-text)'},
            {label: 'Eingereicht', value: money(Number(funding.submittedAmount)), share: percent(Number(funding.submittedAmount), Number(funding.totalAmount)), color: 'var(--accent-text)'},
            {label: 'Noch offen', value: money(Math.max(0, Number(funding.totalAmount) - Number(funding.disbursedAmount) - Number(funding.submittedAmount)))}
          ]}
          footnote={funding.lastSubmittedDate ? 'Letzte Einreichung: ' + new Date(funding.lastSubmittedDate).toLocaleDateString('de-DE') + ' (' + calculateDaysAgo(funding.lastSubmittedDate) + ')' : 'Auszahlungen und eingereichte Fördermittel im Überblick.'}
        />}
        <FinanceCard
          title="Stunden-Förderwert"
          value={money((stats.hardcodedBaseHours + stats.systemActiveHours) * 20)}
          target={'von ' + money(stats.totalGoalHours * 20) + ' · ' + (stats.hardcodedBaseHours + stats.systemActiveHours).toLocaleString('de-DE') + ' / ' + stats.totalGoalHours.toLocaleString('de-DE') + ' h'}
          progress={percent(stats.hardcodedBaseHours + stats.systemActiveHours, stats.totalGoalHours)}
          progressLabel="Gemeinsam erarbeitet"
          amounts={[
            {label: 'Eingereicht', value: money(stats.hardcodedBaseHours * 20) + ' · ' + stats.hardcodedBaseHours.toLocaleString('de-DE') + ' h', share: percent(stats.hardcodedBaseHours, stats.totalGoalHours), color: 'var(--success-text)'},
            {label: 'Offen', value: money(stats.systemActiveHours * 20) + ' · ' + stats.systemActiveHours.toLocaleString('de-DE') + ' h', share: percent(stats.systemActiveHours, stats.totalGoalHours), color: 'var(--accent-text)'},
            {label: 'Bis zum Ziel', value: money(Math.max(0, stats.totalGoalHours - stats.hardcodedBaseHours - stats.systemActiveHours) * 20)}
          ]}
          footnote="Jede erfasste Stunde entspricht 20 € Förderwert."
          link={{href: '/dashboard?tab=STUNDEN', label: 'Zur Zeiterfassung'}}
        />
        {equipmentBudget && <FinanceCard
          title="Anschaffungsbudget"
          value={money(eqSpentAmount)}
          target={'von ' + money(eqTotalBudget) + ' Budget'}
          progress={eqSpentPercentage}
          progressLabel="Bereits ausgegeben"
          amounts={[
            {label: 'Ausgegeben', value: money(eqSpentAmount), share: eqSpentPercentage, color: eqSpentAmount > eqTotalBudget ? 'var(--danger-text)' : 'var(--success-text)'},
            {label: 'Budget', value: money(eqTotalBudget)},
            {label: 'Geplant gesamt', value: money(eqPlannedAmount)},
            {label: 'Verfügbar nach Käufen', value: money(eqTotalBudget - eqSpentAmount)},
            {label: eqPlannedDifference > 0 ? 'Planung über Budget' : 'Spielraum zur Planung', value: money(Math.abs(eqPlannedDifference))}
          ]}
          footnote={'Verfügbar nach Käufen: ' + money(eqTotalBudget - eqSpentAmount)}
          link={{href: '/dashboard?tab=EQUIPMENT', label: 'Zu den Anschaffungen'}}
        />}
      </div>
</>;
}
