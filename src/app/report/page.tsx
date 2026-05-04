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
          setEntries(data.entries.filter((e: any) => e.isConfirmed && e.endTime !== null && !e.isSubmitted));
        }
      });
  }, [router, showAll]);

  if (!user) return null;

  // Split entries into chunks of 8 to ensure everything fits on one page
  const chunks = [];
  for (let i = 0; i < entries.length; i += 8) {
    chunks.push(entries.slice(i, i + 8));
  }
  if (chunks.length === 0) chunks.push([]); // Always render at least one empty page

  return (
    <div className="print-wrapper" style={{ maxWidth: '100%', margin: '0 auto', padding: '2rem', backgroundColor: 'white', color: 'black', minHeight: '100vh', fontFamily: 'Arial, sans-serif', boxSizing: 'border-box' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print { 
          .no-print { display: none !important; } 
          @page { size: landscape; margin: 10mm; }
          body { 
            background-color: white !important; 
            font-size: 10pt !important; 
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
          }
          .print-wrapper {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          .report-page { 
            width: 100% !important;
            margin-bottom: 0 !important; 
            padding: 0 !important; 
            box-sizing: border-box !important;
          }
          .report-page:not(:last-child) { page-break-after: always; }
          .table-wrapper { overflow: visible !important; width: 100% !important; }
          .report-table { 
            width: 100% !important; 
            max-width: 100% !important;
            table-layout: fixed !important;
          }
          .report-table th, .report-table td {
            font-size: 9pt !important;
            padding: 0.2rem !important;
            word-wrap: break-word;
            overflow-wrap: anywhere;
            word-break: break-word;
            hyphens: auto;
          }
          h3 { margin-bottom: 1rem !important; font-size: 12pt !important; }
          .leader-info { margin-bottom: 1rem !important; font-size: 9pt !important; }
          .signature-confirm { margin-top: 0.5rem !important; margin-bottom: 1rem !important; font-size: 9pt !important; }
          .signature-area { margin-top: 1.5rem !important; font-size: 9pt !important; }
        }
        .report-table th, .report-table td {
          border: 1px solid black;
          padding: 0.3rem 0.5rem;
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
            
            <table className="leader-info" style={{ marginBottom: '2rem', borderCollapse: 'collapse', width: 'auto' }}>
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

            <div className="table-wrapper" style={{ overflowX: 'auto', marginBottom: '1rem', width: '100%' }}>
              <table className="report-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ height: '60px' }}>
                    <th style={{ width: '10%' }}>Datum</th>
                    <th style={{ width: '22%' }}>geleistete Arbeit</th>
                    <th style={{ width: '24%' }}>Gewerk / Arbeitsbereich</th>
                    <th style={{ width: '8%' }}>Anzahl<br/>Stunden</th>
                    <th style={{ width: '18%' }}>Name<br/>der Leistungserbringerin/<br/>des Leistungserbringers<br/>(Blockschrift)</th>
                    <th style={{ width: '18%' }}>Unterschrift<br/>der Leistungserbringerin/<br/>des Leistungserbringers</th>
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
                        <td>{e.activity || 'Arbeitstreffen'}</td>
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

            <div className="signature-confirm" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
              Ich bestätige, dass die o.g. Arbeitsleistungen im Rahmen der von mir beantragten Fördermaßnahme erbracht wurden.
            </div>

            <div className="signature-area" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4rem' }}>
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
