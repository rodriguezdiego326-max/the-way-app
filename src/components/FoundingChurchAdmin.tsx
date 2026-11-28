import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/i18n';
import ChurchSourceBadge from '@/components/ChurchSourceBadge';
import { getChurchChoices, type ChurchChoice } from '@/lib/churchChoices';

type Allocation = { slot: number; church_id: string | null; church_name: string; city: string | null; assigned_at: string; note: string };
export default function FoundingChurchAdmin() {
  const { language } = useLanguage();
  const text = (en: string, es: string) => language === 'es' ? es : en;
  const [rows, setRows] = useState<Allocation[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ChurchChoice[]>([]);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<ChurchChoice | null>(null);
  const [note, setNote] = useState('');
  const [review, setReview] = useState(false);
  const [saved, setSaved] = useState(false);
  const refresh = useCallback(async () => {
    const { data, error: err } = await supabase.rpc('list_founding_church_discounts').abortSignal(AbortSignal.timeout(15000));
    if (err) throw err;
    setRows(data || []); setLoaded(true);
  }, []);
  const run = async (action: () => Promise<void>) => {
    setBusy(true); setError(''); setSaved(false);
    try { await action(); } catch (err) { setError(err && typeof err === 'object' && 'message' in err ? String(err.message) : 'request_failed'); }
    finally { setBusy(false); }
  };
  useEffect(() => { void refresh().catch(() => setError('load_failed')); }, [refresh]);
  const search = async () => {
    const { data, error: err } = await supabase.rpc('search_complimentary_targets', { p_kind: 'church', p_query: query.trim() }).abortSignal(AbortSignal.timeout(15000));
    if (err) throw err;
    const choices = await getChurchChoices((data || []).map((c: { id: string }) => c.id));
    setResults(choices.filter(c => !c.hidden)); setSearched(true); setSelected(null);
  };
  const assign = async () => {
    if (!selected) return;
    const { error: err } = await supabase.rpc('assign_founding_church_discount', { p_church_id: selected.id, p_note: note.trim() }).abortSignal(AbortSignal.timeout(15000));
    if (err) throw err;
    setReview(false); setSelected(null); setNote(''); setResults([]); setSearched(false);
    await refresh(); setSaved(true);
  };
  const errorMessage = error.includes('slots_full') ? text('All 10 founding-church slots have been assigned.', 'Ya se asignaron los 10 lugares de iglesias fundadoras.')
    : error.includes('already_free') ? text('This church already has free subscription access. It does not need a discount slot.', 'Esta iglesia ya tiene acceso gratuito a la suscripción. No necesita un lugar de descuento.')
    : error.includes('unavailable') ? text('This church is no longer available. Search again and select its current record.', 'Esta iglesia ya no está disponible. Busca y selecciona su registro actual.')
    : text('Could not complete this request. Refresh to check the saved list before retrying.', 'No se pudo completar la solicitud. Actualiza para consultar la lista guardada antes de reintentar.');
  return <section className="premium-card p-4 space-y-4">
    <h3 className="font-serif text-2xl">{text('Founding churches', 'Iglesias fundadoras')}</h3>
    <p>{text('50% off the church subscription for life. Translation usage and members’ personal subscriptions are excluded.', '50% de descuento de por vida en la suscripción de la iglesia. No incluye el uso de traducción ni las suscripciones personales de los miembros.')}</p>
    <p className="text-sm">{text('Eligibility only. Billing is not active; assigning a slot does not charge anyone or change an Apple subscription.', 'Solo elegibilidad. La facturación no está activa; asignar un lugar no genera cargos ni cambia una suscripción de Apple.')}</p>
    <p role="status">{loaded ? `${rows.length}/10 ${text('assigned', 'asignados')} · ${10 - rows.length} ${text('remaining', 'disponibles')}` : text('Loading slots…', 'Cargando lugares…')}</p>
    {error && <p role="alert" className="text-error">{errorMessage}</p>}
    {saved && <p role="status">{text('Lifetime subscription discount saved.', 'Descuento de suscripción de por vida guardado.')}</p>}
    <button type="button" className="btn-secondary" disabled={busy || review} onClick={() => void run(refresh)}>{busy ? text('Working…', 'Procesando…') : text('Refresh founding churches', 'Actualizar iglesias fundadoras')}</button>
    {loaded && rows.length < 10 && !review && <form className="space-y-3" onSubmit={e => { e.preventDefault(); void run(search); }}>
      <label className="block">{text('Search church name', 'Buscar nombre de iglesia')}
        <input className="complimentary-access-field" maxLength={100} value={query} disabled={busy} onChange={e => { setQuery(e.target.value); setResults([]); setSelected(null); setSearched(false); setSaved(false); }} />
      </label>
      <button className="btn-secondary" disabled={busy || query.trim().length < 2}>{text('Search', 'Buscar')}</button>
      {searched && results.length === 0 && <p>{text('No matching churches.', 'No hay iglesias coincidentes.')}</p>}
      {results.map(c => <div key={c.id} className="border border-ink-600 rounded-xl p-3 space-y-2">
        <p>{c.name}{c.city ? ` — ${c.city}` : ''}</p>
        {c.website && <p className="text-sm break-all">{c.website}</p>}
        <ChurchSourceBadge source={c.source} mine={c.is_mine} />
        <button type="button" className="btn-secondary" disabled={busy || rows.some(r => r.church_id === c.id)} onClick={() => { setSelected(c); setSaved(false); }}>{rows.some(r => r.church_id === c.id) ? text('Already assigned', 'Ya asignada') : selected?.id === c.id ? text('Selected', 'Seleccionada') : text('Select', 'Seleccionar')}</button>
      </div>)}
      {selected && <>
        <label className="block">{text('Reason / internal note', 'Motivo / nota interna')}
          <input className="complimentary-access-field" maxLength={300} value={note} disabled={busy} onChange={e => setNote(e.target.value)} />
        </label>
        <button type="button" className="btn-primary" disabled={busy || !note.trim()} onClick={() => setReview(true)}>{text('Review lifetime discount', 'Revisar descuento de por vida')}</button>
      </>}
    </form>}
    {review && selected && <div className="space-y-3 border border-gold-500 rounded-xl p-3" role="alert">
      <p className="font-semibold">{selected.name}{selected.city ? ` — ${selected.city}` : ''}</p>
      <p>{text('Assign one of the 10 lifetime slots: 50% off the church subscription only. No expiration. Slots are not reused.', 'Asigna uno de los 10 lugares de por vida: 50% de descuento solo en la suscripción de la iglesia. Sin vencimiento. Los lugares no se reutilizan.')}</p>
      <p className="text-sm">{note}</p>
      <button type="button" className="btn-primary" disabled={busy} onClick={() => void run(assign)}>{text('Confirm lifetime discount', 'Confirmar descuento de por vida')}</button>
      <button type="button" className="btn-secondary" disabled={busy} onClick={() => { setReview(false); setError(''); }}>{text('Cancel', 'Cancelar')}</button>
    </div>}
    {rows.map(r => <div key={r.slot} className="border-t border-gold-500/20 pt-3">
      <p>#{r.slot} · {r.church_name}{r.city ? ` — ${r.city}` : ''}</p>
      <p>{text('50% · Subscription only · No expiration', '50% · Solo suscripción · Sin vencimiento')}</p>
      {!r.church_id && <p>{text('Church removed; lifetime slot retained.', 'Iglesia eliminada; se conserva el lugar de por vida.')}</p>}
      <p className="text-xs">{new Date(r.assigned_at).toLocaleDateString(language === 'es' ? 'es' : 'en')} · {r.note}</p>
    </div>)}
  </section>;
}
