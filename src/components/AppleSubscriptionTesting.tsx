import { useRef, useState } from 'react';
import { useLanguage } from '@/lib/i18n';
import { loadAppleProducts, manageAppleSubscriptions, restoreAppleSamples, testApplePurchase, type AppleProduct, type VerifiedAppleSample } from '@/lib/appleSubscriptions';

export default function AppleSubscriptionTesting() {
  const { language } = useLanguage();
  const t = (en: string, es: string) => language === 'es' ? es : en;
  const locked = useRef(false);
  const [busy, setBusy] = useState(false);
  const [products, setProducts] = useState<AppleProduct[]>([]);
  const [samples, setSamples] = useState<VerifiedAppleSample[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<AppleProduct | null>(null);
  const title = (p: AppleProduct) => p.id.includes('.family.') ? t('Family', 'Familia') : 'Personal Plus';
  const interval = (p: AppleProduct) => p.id.endsWith('.annual') ? t('per year, billed annually', 'al año, con pago anual') : t('per month', 'al mes');
  const hasWeekTrial = (p: AppleProduct) => p.eligibleForIntro && p.trialValue === 1 && p.trialUnit === 'week';
  const run = async (action: () => Promise<void>) => {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError(''); setMessage('');
    try { await action(); }
    catch (err) {
      const code = err instanceof Error ? err.message : '';
      setError(code.includes('sandbox_required') ? t('Use the TestFlight build. Purchases are blocked in production.', 'Usa la versión de TestFlight. Las compras están bloqueadas en producción.')
        : code.includes('ios_16_required') || code.includes('ios_required') ? t('Use an iPhone with iOS 16 or later.', 'Usa un iPhone con iOS 16 o posterior.')
        : code.includes('app_owner_required') ? t('Only the signed-in app owner can run this test.', 'Solo el propietario de la aplicación puede realizar esta prueba.')
        : code.includes('trial_unavailable') ? t('Apple no longer confirms a seven-day trial. Reload the plans or use a fresh sandbox test account.', 'Apple ya no confirma una prueba de siete días. Recarga los planes o usa una nueva cuenta de prueba sandbox.')
        : t('Could not complete the test. Check your connection and retry. An unverified purchase will stay pending for verification; do not purchase again. Use Refresh purchases.', 'No se pudo completar la prueba. Revisa tu conexión y vuelve a intentarlo. Una compra sin verificar quedará pendiente; no vuelvas a comprar. Usa Actualizar compras.'));
    } finally { locked.current = false; setBusy(false); }
  };
  return <section className="premium-card p-5 space-y-4">
    <h2 className="font-serif text-xl text-ivory-100">{t('Apple subscription testing', 'Pruebas de suscripción de Apple')}</h2>
    <p className="text-sm text-ivory-300">{t('App owner only · Apple Sandbox · No real charges. This checks checkout and signed transactions; it does not change anyone’s access. Your free access remains in place.', 'Solo el propietario · Sandbox de Apple · Sin cargos reales. Verifica compras y transacciones firmadas; no cambia el acceso de nadie. Tu acceso gratuito se mantiene.')}</p>
    <p className="text-sm text-ivory-300">{t('Apple controls trial eligibility and sandbox renewal timing. A pending purchase requires approval. Return here and refresh after approval, cancellation, or renewal.', 'Apple controla la elegibilidad de la prueba y los tiempos de renovación del sandbox. Una compra pendiente requiere aprobación. Regresa y actualiza después de aprobar, cancelar o renovar.')}</p>
    <div className="flex flex-wrap gap-2">
      <button className="btn-secondary" disabled={busy} onClick={() => void run(async () => {
        setSelected(null); setProducts([]); const rows = await loadAppleProducts(); setProducts(rows);
        if (!rows.length) setMessage(t('No products returned by Apple. Check product availability and Paid Apps agreement status in App Store Connect.', 'Apple no devolvió productos. Revisa su disponibilidad y el acuerdo de apps de pago en App Store Connect.'));
      })}>{t('Load Apple plans', 'Cargar planes de Apple')}</button>
      <button className="btn-secondary" disabled={busy} onClick={() => void run(async () => {
        setSamples([]); const rows = await restoreAppleSamples(false); setSamples(rows);
        setMessage(rows.length ? t('Purchase samples verified.', 'Muestras de compra verificadas.') : t('No current or unfinished purchases.', 'No hay compras actuales ni pendientes.'));
      })}>{t('Refresh purchases', 'Actualizar compras')}</button>
      <button className="btn-secondary" disabled={busy} onClick={() => void run(async () => {
        setSamples([]); const rows = await restoreAppleSamples(true); setSamples(rows);
        setMessage(rows.length ? t('Restored purchase samples verified.', 'Muestras restauradas verificadas.') : t('No purchases found for this Apple account.', 'No se encontraron compras para esta cuenta de Apple.'));
      })}>{t('Restore Purchases', 'Restaurar compras')}</button>
      <button className="btn-secondary" disabled={busy} onClick={() => void run(manageAppleSubscriptions)}>{t('Manage subscription', 'Administrar suscripción')}</button>
    </div>
    {busy && <p role="status">{t('Working with Apple…', 'Conectando con Apple…')}</p>}
    {error && <p role="alert" className="text-error">{error}</p>}
    {message && <p role="status" className="text-ivory-200">{message}</p>}
    {products.map(p => <div key={p.id} className="rounded-xl border border-ink-600 p-4 space-y-2">
      <h3 className="text-ivory-100">{title(p)} — {p.price} {interval(p)}</h3>
      <p className="text-sm text-ivory-300">{hasWeekTrial(p) ? t('7 days free, then automatic renewal at the price above unless canceled.', '7 días gratis; después se renueva automáticamente al precio indicado salvo cancelación.') : t('Apple has not confirmed a seven-day trial for this account and product. Trial checkout is unavailable.', 'Apple no ha confirmado una prueba de siete días para esta cuenta y producto. La compra de prueba no está disponible.')}</p>
      <button className="btn-secondary" disabled={busy || !hasWeekTrial(p)} onClick={() => setSelected(p)}>{t('Review trial test', 'Revisar prueba')}</button>
    </div>)}
    {selected && <div className="rounded-xl border border-gold-500 p-4 space-y-3" role="group" aria-label={t('Confirm sandbox trial', 'Confirmar prueba sandbox')}>
      <p className="text-ivory-100">{title(selected)} — {t('7 days free, then', '7 días gratis, después')} {selected.price} {interval(selected)}.</p>
      <p className="text-sm text-ivory-300">{t('Sandbox test only. Confirm the offer in Apple’s purchase sheet. Cancel through Manage subscription to stop renewal. Sandbox time may run faster than seven calendar days.', 'Solo prueba sandbox. Confirma la oferta en la pantalla de compra de Apple. Cancela en Administrar suscripción para detener la renovación. El tiempo del sandbox puede ser más rápido que siete días naturales.')}</p>
      <button className="btn-primary" disabled={busy} onClick={() => void run(async () => {
        const result = await testApplePurchase(selected.id); setSelected(null); setSamples(result.samples);
        setMessage(result.status === 'cancelled' ? t('Purchase canceled.', 'Compra cancelada.') : result.status === 'pending' ? t('Awaiting Apple approval. Refresh after approval.', 'Pendiente de aprobación de Apple. Actualiza después de aprobar.') : t('Apple transaction verified by the server. Access is unchanged.', 'Transacción de Apple verificada por el servidor. El acceso no ha cambiado.'));
        setProducts([]); // Reload eligibility before any second trial attempt.
      })}>{t('Continue to Apple test checkout', 'Continuar a la compra de prueba de Apple')}</button>
      <button className="btn-secondary ml-2" disabled={busy} onClick={() => setSelected(null)}>{t('Cancel', 'Cancelar')}</button>
    </div>}
    {samples.map(s => <div key={s.transactionId} className="rounded-xl border border-ink-600 p-3 text-sm text-ivory-200">
      <p>{s.productId}</p>
      <p>{t('Verified sandbox sample', 'Muestra sandbox verificada')}: {s.state === 'active_sample' ? t('Active at signed snapshot', 'Activa en la muestra firmada') : s.state === 'expired' ? t('Expired', 'Vencida') : s.state === 'revoked' ? t('Revoked', 'Revocada') : t('Replaced by an upgrade', 'Reemplazada por una mejora')}</p>
      <p>{t('Sample expiration', 'Vencimiento de la muestra')}: {new Date(s.expiresAt).toLocaleString(language === 'es' ? 'es-US' : 'en-US')}</p>
    </div>)}
  </section>;
}
