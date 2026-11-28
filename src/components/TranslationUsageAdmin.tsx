import ChurchSourceBadge from '@/components/ChurchSourceBadge';
import HiddenChurches from '@/components/HiddenChurches';
import { getChurchChoices, setChurchHidden } from '@/lib/churchChoices';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/i18n';

type Target = { id: string; label: string; detail: string | null; source?: string; is_mine?: boolean };
type Grant = { id: string; target_id: string; kind: 'church' | 'person'; label: string; scope: string; active: boolean; note: string };
type Summary = { church_id: string | null; church_name: string | null; mode: string; people: number; connected_seconds: number; playback_seconds: number };

export default function TranslationUsageAdmin() {
  const { language } = useLanguage();
  const text = (en: string, es: string) => language === 'es' ? es : en;
  const [grants, setGrants] = useState<Grant[]>([]);
  const [summary, setSummary] = useState<Summary[]>([]);
  const [listVersion, setListVersion] = useState(0);
  const [kind, setKind] = useState<'church' | 'person'>('church');
  const [query, setQuery] = useState('');
  const [targets, setTargets] = useState<Target[]>([]);
  const [target, setTarget] = useState('');
  const [scope, setScope] = useState('full');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [searched, setSearched] = useState(false);
  const [confirm, setConfirm] = useState<Grant | 'new' | null>(null);
  const scopeLabel = (s: string) => s === 'full' ? text('Full access', 'Acceso completo') : s === 'translation' ? text('Translation', 'Traducción') : text('Subscription', 'Suscripción');

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const now = new Date();
      const signal = AbortSignal.timeout(15000);
      const [g, s] = await Promise.all([
        supabase.rpc('list_complimentary_access').abortSignal(signal),
        supabase.rpc('translation_measurement_summary', { p_from: new Date(+now - 86400000).toISOString(), p_to: now.toISOString() }).abortSignal(signal),
      ]);
      if (g.error || s.error) throw new Error('load_failed');
      setGrants(g.data || []); setSummary(s.data || []); setLoaded(true); setUpdatedAt(new Date());
    } finally { setRefreshing(false); }
  }, []);
  useEffect(() => { void refresh().catch(() => setError(true)); }, [refresh]);
  const run = async (action: () => Promise<void>) => {
    setBusy(true); setError(false);
    try { await action(); } catch { setError(true); } finally { setBusy(false); }
  };
  const save = async () => {
    if (!confirm) return;
    const revoking = confirm !== 'new';
    const { error: err } = await supabase.rpc('set_complimentary_access', {
      p_kind: revoking ? confirm.kind : kind,
      p_target: revoking ? confirm.target_id : target,
      p_scope: revoking ? confirm.scope : scope,
      p_active: !revoking,
      p_note: revoking ? 'Revoked by App Owner' : note.trim(),
    });
    if (err) throw err;
    setConfirm(null); setNote(''); await refresh();
  };
  return <section className="space-y-4">
    <h2 className="font-serif text-2xl">{text('Translation usage & free access', 'Uso de traducción y acceso gratuito')}</h2>
    <p className="text-sm">{text('Measurement only. No charges. These samples are not invoices or verified provider costs.', 'Solo medición. Sin cargos. Estas muestras no son facturas ni costos verificados del proveedor.')}</p>
    {error && <p role="alert" className="text-error">{text('Could not complete this request. Check your connection and backend setup, then retry.', 'No se pudo completar la solicitud. Revisa la conexión y la configuración del servidor e inténtalo de nuevo.')}</p>}
    <button type="button" className="btn-secondary" disabled={busy || refreshing} aria-busy={refreshing} onClick={() => void run(refresh)}>{refreshing ? text('Refreshing…', 'Actualizando…') : text('Refresh', 'Actualizar')}</button>
    <p role="status" aria-live="polite" className="text-xs text-ivory-400">{refreshing ? text('Checking latest usage…', 'Consultando el uso más reciente…') : updatedAt ? `${text('Updated', 'Actualizado')}: ${updatedAt.toLocaleTimeString(language === 'es' ? 'es' : 'en', { hour: 'numeric', minute: '2-digit', second: '2-digit' })}` : ''}</p>
    <div className="premium-card p-4 space-y-3">
      <h3>{text('Last 24 hours', 'Últimas 24 horas')}</h3>
      {!loaded && !error && <p>{text('Loading…', 'Cargando…')}</p>}
      {loaded && summary.length === 0 && <p>{text('No usage samples yet.', 'Aún no hay muestras de uso.')}</p>}
      {summary.map(row => <div key={`${row.mode}-${row.church_id}`} className="border-b border-gold-500/20 pb-2">
        <p>{row.church_name || text('Personal microphone', 'Micrófono personal')}</p>
        <p className="text-sm">{row.people} {Number(row.people) === 1 ? text('person', 'persona') : text('people', 'personas')} · {(Number(row.connected_seconds) / 60).toFixed(1)} {text('connected minutes', 'minutos conectados')}</p>
        {row.mode === 'church' && <p className="text-sm">{(Number(row.playback_seconds) / 60).toFixed(1)} {text('reported playback minutes', 'minutos de reproducción reportados')}</p>}
      </div>)}
      <p className="text-xs">{text('Overlapping devices and reconnects are counted once per person and church. Missing heartbeats may undercount. Microphone samples measure connected time only.', 'Los dispositivos simultáneos y las reconexiones se cuentan una vez por persona e iglesia. Las muestras faltantes pueden reducir el total. El micrófono solo mide tiempo conectado.')}</p>
    </div>
    <form className="premium-card p-4 space-y-3" onSubmit={e => { e.preventDefault(); setConfirm('new'); }}>
      <h3>{text('Give free access', 'Otorgar acceso gratuito')}</h3>
      <p className="text-xs">{text('Church grants cover that church’s plan and shared translation, not members’ personal subscriptions. Full access includes both subscription and translation. No existing Apple subscription is canceled or refunded here.', 'El acceso de una iglesia cubre su plan y traducción compartida, no las suscripciones personales. El acceso completo incluye suscripción y traducción. Aquí no se cancela ni reembolsa ninguna suscripción de Apple.')}</p>
      <label className="block">{text('Recipient type', 'Tipo de destinatario')}
        <select className="complimentary-access-field" disabled={busy || !!confirm} value={kind} onChange={e => { setKind(e.target.value as 'church' | 'person'); setTargets([]); setTarget(''); setSearched(false); }}>
          <option value="church">{text('Church', 'Iglesia')}</option><option value="person">{text('Person / pastor', 'Persona / pastor')}</option>
        </select>
      </label>
      <label className="block">{text('Search by name (or email for people)', 'Buscar por nombre (o correo para personas)')}
        <input className="complimentary-access-field" value={query} maxLength={100} disabled={busy || !!confirm} onChange={e => { setQuery(e.target.value); setTargets([]); setTarget(''); setSearched(false); }} />
      </label>
      <button type="button" className="btn-secondary" disabled={busy || !!confirm || query.trim().length < 2} onClick={() => void run(async () => {
        const { data, error: err } = await supabase.rpc('search_complimentary_targets', { p_kind: kind, p_query: query.trim() });
        if (err) throw err;
        if (kind === 'church') {
          const details = await getChurchChoices((data || []).map((c: Target) => c.id));
          setTargets(details.filter(c => !c.hidden).map(c => ({ id: c.id, label: c.name, detail: c.city, source: c.source, is_mine: c.is_mine })));
        } else setTargets(data || []);
        setTarget(''); setSearched(true);
      })}>{text('Search', 'Buscar')}</button>
      {searched && targets.length === 0 && <p>{text('No matching accounts or churches.', 'No hay cuentas ni iglesias coincidentes.')}</p>}
      {kind === 'church' && <>
        <HiddenChurches version={listVersion} onRestore={() => { setListVersion(v => v + 1); setTargets([]); setTarget(''); setSearched(false); }} />
        {targets.map(c => <div key={c.id} className="border border-ink-600 rounded-xl p-3 space-y-2">
          <p>{c.label}{c.detail ? ` — ${c.detail}` : ''}</p>
          <ChurchSourceBadge source={c.source} mine={c.is_mine} />
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy || !!confirm} onClick={() => setTarget(c.id)} className="btn-secondary text-sm">{target === c.id ? text('Selected', 'Seleccionada') : text('Select', 'Seleccionar')}</button>
            <button type="button" disabled={busy || !!confirm} className="btn-ghost text-sm" onClick={() => void run(async () => { await setChurchHidden(c.id, true); setTargets(rows => rows.filter(row => row.id !== c.id)); if (target === c.id) setTarget(''); setListVersion(v => v + 1); })}>{text('Hide from my list', 'Ocultar de mi lista')}</button>
          </div>
        </div>)}
      </>}
      <label className="block">{text('Recipient', 'Destinatario')}
        <select required className="complimentary-access-field" value={target} disabled={busy || !!confirm} onChange={e => setTarget(e.target.value)}>
          <option value="">{text('Select a recipient', 'Selecciona un destinatario')}</option>
          {targets.map(t => <option key={t.id} value={t.id}>{t.label} — {t.detail || t.id.slice(0,8)}{t.source ? ` · ${t.source === 'apple_maps' ? text('Apple Maps', 'Apple Maps') : t.is_mine ? text('Created by you', 'Creada por ti') : text('Manually added', 'Agregada manualmente')}` : ''}</option>)}
        </select>
      </label>
      <label className="block">{text('Access', 'Acceso')}
        <select className="complimentary-access-field" value={scope} disabled={busy || !!confirm} onChange={e => setScope(e.target.value)}>
          {['full', 'subscription', 'translation'].map(s => <option key={s} value={s}>{scopeLabel(s)}</option>)}
        </select>
      </label>
      <label className="block">{text('Reason', 'Motivo')}
        <input required maxLength={300} className="complimentary-access-field" value={note} disabled={busy || !!confirm} onChange={e => setNote(e.target.value)} />
      </label>
      <button className="btn-primary" disabled={busy || !!confirm || !target || !note.trim()}>{text('Review free access', 'Revisar acceso gratuito')}</button>
    </form>
    {confirm && <div className="premium-card p-4 space-y-3" role="alert">
      <p>{confirm === 'new'
        ? `${text('Grant', 'Otorgar')}: ${targets.find(t => t.id === target)?.label} — ${scopeLabel(scope)}`
        : `${text('Revoke', 'Revocar')}: ${confirm.label} — ${scopeLabel(confirm.scope)}`}</p>
      <button type="button" className="btn-primary" disabled={busy} onClick={() => void run(save)}>{text('Confirm', 'Confirmar')}</button>
      <button type="button" className="btn-secondary" disabled={busy} onClick={() => setConfirm(null)}>{text('Cancel', 'Cancelar')}</button>
    </div>}
    <div className="premium-card p-4 space-y-3">
      <h3>{text('Free-access grants', 'Accesos gratuitos')}</h3>
      {loaded && grants.length === 0 && <p>{text('No grants yet.', 'Aún no hay accesos otorgados.')}</p>}
      {grants.map(g => <div key={g.id} className="border-b border-gold-500/20 pb-3">
        <p>{g.label} · {scopeLabel(g.scope)} · {g.active ? text('Active', 'Activo') : text('Revoked', 'Revocado')}</p>
        <p className="text-xs">{g.note}</p>
        {g.active && <button type="button" className="btn-secondary" disabled={busy || !!confirm} onClick={() => setConfirm(g)}>{text('Revoke this grant', 'Revocar este acceso')}</button>}
      </div>)}
    </div>
  </section>;
}
