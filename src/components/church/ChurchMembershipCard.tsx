import { useCallback, useEffect, useState } from 'react';
import { LockKeyhole, UserCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/i18n';
import type { ChurchMembership } from '@/lib/togetherTypes';

interface Connection {
  membership_id: string;
  display_name: string | null;
  membership_status: 'visitor' | 'member';
  invitation_id: string | null;
  invitation_expires_at: string | null;
}

export default function ChurchMembershipCard({ membership, isAppOwner = false, onChange }: {
  membership: ChurchMembership;
  isAppOwner?: boolean;
  onChange: () => Promise<void>;
}) {
  const { language } = useLanguage();
  const tr = (en: string, es: string) => language === 'es' ? es : en;
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const canInvite = isAppOwner || membership.verified_church_role === 'PASTOR' || membership.verified_church_role === 'CHURCH_ADMIN';
  const isMember = isAppOwner || membership.membership_status === 'member';
  const load = useCallback(async () => {
    const { data, error: failure } = await supabase.rpc('list_church_membership_connections', { p_church_id: membership.church_id });
    if (failure) throw failure;
    return (data || []) as Connection[];
  }, [membership.church_id]);

  useEffect(() => {
    let live = true;
    setLoaded(false);
    setError(false);
    void load().then(rows => { if (live) { setConnections(rows); setLoaded(true); } }).catch(() => { if (live) setError(true); });
    return () => { live = false; };
  }, [load, membership]);

  async function act(name: 'invite_church_member' | 'revoke_church_member_invitation' | 'respond_church_member_invitation', args: Record<string, string | boolean>) {
    if (busy) return;
    setBusy(true);
    setError(false);
    try {
      const { error: failure } = await supabase.rpc(name, args);
      if (failure) throw failure;
      setConnections(await load());
      await onChange();
    } catch { setError(true); }
    finally { setBusy(false); }
  }
  const own = connections.find(c => c.membership_id === membership.id);
  const visitors = connections.filter(c => c.membership_status === 'visitor' && c.membership_id !== membership.id);
  return <section className="premium-card p-5 mb-4 text-ivory-100" aria-label={tr('Church membership', 'Membresía de la iglesia')}>
    <div className="flex items-center gap-2 mb-2">
      {isMember ? <UserCheck size={18} /> : <LockKeyhole size={18} />}
      <h3 className="font-medium">{isAppOwner ? tr('App Owner · Full church access', 'Propietario de la app · Acceso completo a la iglesia') : isMember ? tr('Church member', 'Miembro de la iglesia') : tr('Visitor', 'Visitante')}</h3>
    </div>
    {!isMember && <>
      <p className="text-sm text-ivory-300 mb-3">{tr('Church prayer, church studies, and small groups are for approved members. Your pastor or church admin can send you an invitation here.', 'La oración, los estudios y los grupos pequeños de la iglesia son para miembros aprobados. Tu pastor o administrador puede enviarte una invitación aquí.')}</p>
      {own?.invitation_id && <div className="rounded-xl border border-gold-500/40 p-3">
        <p className="text-sm mb-3">{tr('Your church has invited you to become a member.', 'Tu iglesia te ha invitado a ser miembro.')}</p>
        <div className="flex flex-wrap gap-2">
          <button disabled={busy} className="btn-primary" onClick={() => void act('respond_church_member_invitation', { p_invitation_id: own.invitation_id!, p_accept: true })}>{tr('Accept membership', 'Aceptar membresía')}</button>
          <button disabled={busy} className="btn-secondary" onClick={() => void act('respond_church_member_invitation', { p_invitation_id: own.invitation_id!, p_accept: false })}>{tr('Decline', 'Rechazar')}</button>
        </div>
      </div>}
    </>}
    {canInvite && <>
      <h4 className="font-medium mt-4 mb-2">{tr('Invite church members', 'Invitar miembros de la iglesia')}</h4>
      <p className="text-sm text-ivory-300 mb-3">{tr('Ask the person to add this church as a visitor first. Invitations appear in their My Church screen and expire after 14 days.', 'Pide a la persona que agregue esta iglesia como visitante primero. Las invitaciones aparecen en Mi Iglesia y vencen después de 14 días.')}</p>
      {loaded && visitors.length === 0 && <p className="text-sm">{tr('No visitors waiting for an invitation.', 'No hay visitantes esperando una invitación.')}</p>}
      {visitors.map(c => <div key={c.membership_id} className="border-t border-gold-500/20 py-3">
        <p className="font-medium mb-2">{c.display_name || tr('SOLAPATH user', 'Usuario de SOLAPATH')}</p>
        {c.invitation_id ? <>
          <p className="text-sm mb-2">{tr('Invitation pending', 'Invitación pendiente')}</p>
          <button disabled={busy} className="btn-secondary text-sm" onClick={() => void act('revoke_church_member_invitation', { p_membership_id: c.membership_id })}>{tr('Cancel invitation', 'Cancelar invitación')}</button>
        </> : <button disabled={busy} className="btn-primary text-sm" onClick={() => void act('invite_church_member', { p_membership_id: c.membership_id })}>{tr('Invite as member', 'Invitar como miembro')}</button>}
      </div>)}
    </>}
    {!loaded && !error && <p className="text-sm">{tr('Checking membership…', 'Consultando membresía…')}</p>}
    {error && <p role="alert" className="text-error text-sm mt-3">{tr('Could not update membership. Refresh and try again. The invitation may have expired or been canceled.', 'No se pudo actualizar la membresía. Actualiza e inténtalo de nuevo. La invitación puede haber vencido o sido cancelada.')}</p>}
    <button disabled={busy} className="btn-secondary text-sm mt-3" onClick={() => {
      setBusy(true); setError(false);
      void load().then(async rows => { setConnections(rows); setLoaded(true); await onChange(); }).catch(() => setError(true)).finally(() => setBusy(false));
    }}>{busy ? tr('Working…', 'Procesando…') : tr('Refresh membership', 'Actualizar membresía')}</button>
  </section>;
}
