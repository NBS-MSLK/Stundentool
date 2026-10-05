'use client';

import { useId, useState } from 'react';

type Amount = { label: string; value: string; color?: string; share?: number };
type Props = {
  title: string;
  value: string;
  target: string;
  progress: number;
  progressLabel: string;
  amounts: Amount[];
  footnote: string;
  link?: { href: string; label: string };
};

export default function FinanceCard({ title, value, target, progress, progressLabel, amounts, footnote, link }: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const clamp = (value: number) => Math.min(100, Math.max(0, value));
  const shares = amounts.filter(amount => amount.share !== undefined);
  const segments = shares.map((amount, index) => {
    const used = shares.slice(0, index).reduce((sum, previous) => sum + clamp(previous.share!), 0);
    const width = Math.min(clamp(amount.share!), Math.max(0, 100 - used));
    return { ...amount, width };
  });

  return (
    <section className="finance-card">
      <header className="finance-heading"><h2>{title}</h2>{link && <a href={link.href} aria-label={link.label + ' – ' + title}>↗</a>}</header>
      <div className="finance-value">{value}</div>
      <p className="finance-target">{target}</p>
      <div className="finance-progress-caption"><span>{progressLabel}</span><strong>{Math.round(progress)} %</strong></div>
      <div className="finance-inspect" onMouseEnter={() => setOpen(true)} onMouseLeave={() => { if (!pinned) setOpen(false); }} onFocusCapture={() => setOpen(true)} onBlurCapture={event => { if (!pinned && !event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false); }} onKeyDown={event => { if (event.key === 'Escape') { setPinned(false); setOpen(false); } }}>
        <button className="finance-inspect-button" aria-label={'Einzelbeträge: ' + title} aria-expanded={open} aria-controls={id} onClick={() => { setPinned(!pinned); setOpen(!pinned); }}>
          <span className="finance-track" aria-hidden="true">{segments.map(segment => <span key={segment.label} style={{ width: segment.width + '%', backgroundColor: segment.color }} />)}</span>
          <span className="finance-legend" aria-hidden="true">{segments.map(segment => <span key={segment.label}><i style={{ backgroundColor: segment.color }} />{segment.label}</span>)}</span>
          <span className="finance-detail-hint">Beträge ansehen <span aria-hidden="true">{open ? '−' : '+'}</span></span>
        </button>
        <div id={id} className="finance-popover" hidden={!open}>
          <span className="maker-eyebrow">{title}</span>
          <dl>{amounts.map(amount => <div key={amount.label}><dt>{amount.color && <i style={{ backgroundColor: amount.color }} />}{amount.label}</dt><dd>{amount.value}</dd></div>)}</dl>
        </div>
      </div>
      <p className="finance-footnote">{footnote}</p>
    </section>
  );
}
