import { Capacitor, registerPlugin } from '@capacitor/core';
import { supabase } from '@/lib/supabase';
import { getAppAdminRole } from '@/lib/appAdminEngine';

export type AppleProduct = { id: string; name: string; price: string; eligibleForIntro: boolean; trialValue?: number; trialUnit?: string };
export type VerifiedAppleSample = { verified: true; environment: 'Sandbox'; grantsAccess: false; transactionId: string; productId: string; expiresAt: string; state: 'active_sample' | 'expired' | 'revoked' | 'superseded' };
const native = registerPlugin<{
  products(): Promise<{ environment: string; products: AppleProduct[] }>;
  purchase(options: { productId: string; accountToken: string }): Promise<{ status: string; signedTransaction?: string }>;
  transactions(): Promise<{ transactions: string[] }>;
  restore(): Promise<{ transactions: string[] }>;
  finish(options: { transactionId: string }): Promise<void>;
  manage(): Promise<void>;
}>('AppleSubscriptions');

async function requireOwner() {
  if (Capacitor.getPlatform() !== 'ios') throw new Error('ios_required');
  const { data: { session } } = await supabase.auth.getSession();
  if (!session || await getAppAdminRole() !== 'APP_OWNER') throw new Error('app_owner_required');
  return session.user.id;
}
export async function loadAppleProducts() {
  await requireOwner();
  const result = await native.products();
  if (result.environment !== 'Sandbox') throw new Error('sandbox_required');
  return result.products;
}
async function verifySample(signedTransaction: string): Promise<VerifiedAppleSample> {
  const { data, error } = await supabase.functions.invoke('apple-subscription-sandbox', { body: { signedTransaction } });
  if (error || data?.verified !== true || data?.environment !== 'Sandbox' || data?.grantsAccess !== false || typeof data?.transactionId !== 'string') throw new Error('verification_failed');
  await native.finish({ transactionId: data.transactionId });
  return data;
}
export async function testApplePurchase(productId: string) {
  const accountToken = await requireOwner();
  const result = await native.purchase({ productId, accountToken });
  if (result.status === 'cancelled' || result.status === 'pending') return { status: result.status, samples: [] };
  if (result.status !== 'purchased' || !result.signedTransaction) throw new Error('purchase_failed');
  return { status: 'verified', samples: [await verifySample(result.signedTransaction)] };
}
export async function restoreAppleSamples(restore: boolean) {
  await requireOwner();
  const result = restore ? await native.restore() : await native.transactions();
  const samples: VerifiedAppleSample[] = [];
  for (const transaction of result.transactions) samples.push(await verifySample(transaction));
  return samples;
}
export async function manageAppleSubscriptions() { await requireOwner(); await native.manage(); }
