'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ShoppingList() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (!userJson) {
      router.push('/');
      return;
    }
    
    fetch('/api/tasks')
      .then(res => res.json())
      .then(data => {
        if (data.tasks) {
          setTasks(data.tasks);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>Lade Daten...</div>;
  }

  // Filter tasks that have at least one unacquired material
  const tasksWithOpenMaterials = tasks.filter(task => 
    task.materials && task.materials.some((m: any) => !m.isAcquired)
  );

  return (
    <div className="container" style={{ maxWidth: '800px', backgroundColor: 'white', color: 'black', minHeight: '100vh', padding: '2rem' }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; color: black; }
          .container { box-shadow: none; margin: 0; padding: 0; max-width: 100%; }
        }
        .material-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
        .material-table th, .material-table td { border: 1px solid #ccc; padding: 0.75rem; text-align: left; }
        .material-table th { background-color: #f5f5f5; font-weight: bold; }
        .checkbox-cell { width: 40px; text-align: center; }
        .checkbox-box { width: 20px; height: 20px; border: 2px solid black; display: inline-block; }
      `}</style>
      
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <Link href="/admin" style={{ padding: '0.5rem 1rem', backgroundColor: '#e2e8f0', color: '#1e293b', textDecoration: 'none', borderRadius: '4px', fontWeight: 'bold' }}>&larr; Zurück</Link>
        <button onClick={() => window.print()} style={{ padding: '0.5rem 1rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Drucken</button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '2rem', borderBottom: '2px solid black', paddingBottom: '1rem' }}>
        <h1 style={{ fontSize: '2rem', margin: 0 }}>Einkaufsliste</h1>
        <p style={{ margin: '0.5rem 0 0 0', color: '#4b5563' }}>Offene Materialanschaffungen aus dem MS-Taskmanager</p>
        <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.5rem' }}>Generiert am: {new Date().toLocaleDateString('de-DE')}</p>
      </div>

      {tasksWithOpenMaterials.length === 0 ? (
        <p style={{ textAlign: 'center', fontSize: '1.2rem', marginTop: '2rem' }}>Aktuell gibt es keine offenen Materialanschaffungen.</p>
      ) : (
        tasksWithOpenMaterials.map(task => {
          const openMaterials = task.materials.filter((m: any) => !m.isAcquired);
          return (
            <div key={task.id} style={{ marginBottom: '2.5rem', pageBreakInside: 'avoid' }}>
              <h2 style={{ fontSize: '1.3rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ backgroundColor: '#1e293b', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.9rem' }}>Projekt</span>
                {task.title}
              </h2>
              <div style={{ fontSize: '0.9rem', color: '#4b5563', marginBottom: '1rem' }}>
                Erstellt von: {task.creatorName} | Status: {task.status === 'IN_PROGRESS' ? 'In Arbeit' : task.status === 'SCHEDULED' ? 'Terminiert' : 'Offen'}
              </div>
              
              <table className="material-table">
                <thead>
                  <tr>
                    <th className="checkbox-cell">Erledigt</th>
                    <th>Material</th>
                    <th>Kauf-Link / Info</th>
                  </tr>
                </thead>
                <tbody>
                  {openMaterials.map((material: any) => (
                    <tr key={material.id}>
                      <td className="checkbox-cell">
                        <div className="checkbox-box"></div>
                      </td>
                      <td style={{ fontWeight: 500 }}>{material.name}</td>
                      <td>
                        {material.buyLink ? (
                          <a href={material.buyLink} target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'underline', wordBreak: 'break-all' }}>
                            {material.buyLink.length > 50 ? material.buyLink.substring(0, 50) + '...' : material.buyLink}
                          </a>
                        ) : (
                          <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Kein Link hinterlegt</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })
      )}
    </div>
  );
}
