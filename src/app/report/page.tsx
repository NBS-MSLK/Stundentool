'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ACTIVITIES } from '@/lib/activities';

function getGroupForActivity(activityName: string | null) {
  if (!activityName) return '-';
  for (const [group, acts] of Object.entries(ACTIVITIES)) {
    if (acts.includes(activityName)) {
      return group.replace(/^\d+\.\s*/, '');
    }
  }
  return 'Allgemein';
}

function ReportContent() {
  const [entries, setEntries] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const showAll = searchParams.get('all') === 'true';

  useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (!userJson) {
      router.push('/');
      return;
    }
    const u = JSON.parse(userJson);
    setUser(u);
    
    const fetchUrl = showAll ? '/api/entries?all=true' : `/api/entries?userId=${u.id}`;
    
    fetch(fetchUrl).then(res => res.json()).then(data => {
      if (data.entries) {
        setEntries(data.entries.filter((e: any) => e.isConfirmed && e.endTime !== null));
      }
    });
  }, [router, showAll]);

  if (!user) return null;

  // Split entries into chunks of 12
  const chunks = [];
  for (let i = 0; i < entries.length; i += 12) {
    chunks.push(entries.slice(i, i + 12));
  }
  if (chunks.length === 0) chunks.push([]); // Always render at least one empty page

  return (
    <div style={{ maxWidth: '100%', margin: '0 auto', padding: '2rem', backgroundColor: 'white', color: 'black', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print { 
          .no-print { display: none !important; } 
          @page { size: landscape; margin: 10mm; }
          body { background-color: white !important; font-size: 12pt; }
          .report-page:not(:last-child) { page-break-after: always; }
        }
        .report-table th, .report-table td {
          border: 1px solid black;
          padding: 0.5rem;
          vertical-align: middle;
        }
        .report-table th {
          font-weight: normal;
          text-align: center;
        }
      ` }} />
      
      <div className="no-print" style={{ marginBottom: '2rem' }}>
        <button onClick={() => router.back()} className="btn-primary" style={{ marginRight: '1rem', backgroundColor: 'var(--text-secondary)' }}>Zurück</button>
        <button onClick={() => window.print()} className="btn-primary">Jetzt Drucken</button>
      </div>

      {chunks.map((chunk, index) => {
        const pageTotalHours = chunk.reduce((acc: number, e: any) => {
          const diff = new Date(e.endTime).getTime() - new Date(e.startTime).getTime();
          let hours = Math.ceil(diff / (1000 * 60 * 60));
          if (hours < 1) hours = 1;
          return acc + hours;
        }, 0);

        return (
          <div key={index} className="report-page" style={{ padding: '0', marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '2rem', fontSize: '1.2rem', fontWeight: 'bold' }}>Stundenzettel / Dokumentation der geleisteten Arbeitsstunden im Rahmen bürgerschaftlichen Engagements (Seite {index + 1}/{chunks.length})</h3>
            
            <table style={{ marginBottom: '2rem', borderCollapse: 'collapse', width: 'auto' }}>
              <tbody>
                <tr>
                  <td style={{ paddingRight: '1rem', paddingBottom: '0.5rem' }}>LEADER-Projekt:</td>
                  <td style={{ borderBottom: '1px solid black', paddingBottom: '0.5rem' }}>MakerSpace Lübbecke</td>
                </tr>
                <tr>
                  <td style={{ paddingRight: '1rem' }}>Aktenzeichen:</td>
                  <td style={{ borderBottom: '1px solid black' }}>33.04.01 - 017/2025-001</td>
                </tr>
              </tbody>
            </table>

            <div style={{ overflowX: 'auto', marginBottom: '1rem', width: '100%' }}>
              <table className="report-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                <thead>
                  <tr style={{ height: '80px' }}>
                    <th>Datum</th>
                    <th>geleistete Arbeit</th>
                    <th>Gewerk / Arbeitsbereich</th>
                    <th>Anzahl<br/>Stunden</th>
                    <th>Name<br/>der Leistungserbringerin/<br/>des Leistungserbringers<br/>(Blockschrift)</th>
                    <th>Unterschrift<br/>der Leistungserbringerin/<br/>des Leistungserbringers</th>
                  </tr>
                </thead>
                <tbody>
                  {chunk.map((e: any) => {
                    const start = new Date(e.startTime);
                    const end = new Date(e.endTime);
                    const diffMs = end.getTime() - start.getTime();
                    let hours = Math.ceil(diffMs / (1000 * 60 * 60));
                    if (hours < 1) hours = 1;
                    const personName = e.user ? e.user.name : user.name;
                    
                    return (
                      <tr key={e.id} style={{ height: '40px' }}>
                        <td style={{ textAlign: 'center' }}>{start.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                        <td>{e.activity || 'Arbeitstreffen'}{e.note ? ` - ${e.note}` : ''}</td>
                        <td>{getGroupForActivity(e.activity)}</td>
                        <td style={{ textAlign: 'right' }}>{hours}</td>
                        <td>{personName}</td>
                        <td></td>
                      </tr>
                    );
                  })}
                  <tr style={{ height: '40px' }}>
                    <td colSpan={3} style={{ border: '1px solid black', textAlign: 'right', paddingRight: '1rem' }}>Zwischensumme Seite {index + 1}:</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', border: '1px solid black' }}>{pageTotalHours.toFixed(1).replace('.0', '')}</td>
                    <td colSpan={2} style={{ border: '1px solid black' }}></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '2rem', marginBottom: '4rem' }}>
              Ich bestätige, dass die o.g. Arbeitsleistungen im Rahmen der von mir beantragten Fördermaßnahme erbracht wurden.
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4rem' }}>
              <div style={{ width: '30%', borderTop: '1px solid black', paddingTop: '0.5rem' }}>Ort, Datum</div>
              <div style={{ width: '50%', borderTop: '1px solid black', paddingTop: '0.5rem', textAlign: 'center' }}>Unterschrift der/des Vertretungsberechtigten</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Report() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem' }}>Lade Bericht...</div>}>
      <ReportContent />
    </Suspense>
  );
}
