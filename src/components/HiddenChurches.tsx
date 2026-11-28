import { useEffect, useState } from 'react';
import { getChurchChoices, setChurchHidden, type ChurchChoice } from '@/lib/churchChoices';
import ChurchSourceBadge from '@/components/ChurchSourceBadge';
import { useLanguage } from '@/lib/i18n';
export default function HiddenChurches({ version, onRestore }: { version: number; onRestore: () => void }) {
  const { language } = useLanguage();
  const es = language === 'es';
  const [rows, setRows] = useState<ChurchChoice[]>([]);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { let current = true; getChurchChoices().then(r => { if (current) { setRows(r); setError(false); } }).catch(() => { if (current) setError(true); }); return () => { current = false; }; }, [version]);
  return <details className="premium-card p-3 my-3"><summary className="text-sm cursor-pointer">{es ? 'Iglesias ocultas' : 'Hidden churches'} ({rows.length})</summary>
    <p className="text-xs text-ivory-300 my-2">{es ? 'Ocultar solo cambia tus listas. Conservas tu membresía y los datos de la iglesia.' : 'Hiding only changes your lists. Your membership and church data are preserved.'}</p>
    {error && <p role="alert" className="text-error text-sm">{es ? 'No se pudo actualizar. Inténtalo de nuevo.' : 'Could not update. Please try again.'}</p>}
    {rows.map(row => <div key={row.id} className="border-t border-ink-600 py-3 space-y-2"><p>{row.name}{row.city ? ` — ${row.city}` : ''}</p><ChurchSourceBadge source={row.source} mine={row.is_mine} /><button type="button" disabled={busy} className="btn-secondary text-sm block" onClick={async () => { setBusy(true); setError(false); try { await setChurchHidden(row.id, false); setRows(r => r.filter(c => c.id !== row.id)); onRestore(); } catch { setError(true); } finally { setBusy(false); } }}>{es ? 'Restaurar' : 'Restore'}</button></div>)}
  </details>;
}
