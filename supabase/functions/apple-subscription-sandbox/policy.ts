export const productIDs = new Set([
  'com.rfgforge.solapath.plus.monthly', 'com.rfgforge.solapath.plus.annual',
  'com.rfgforge.solapath.family.monthly', 'com.rfgforge.solapath.family.annual',
]);

// Input MUST be the output of Apple's SignedDataVerifier, never a decoded-only JWT.
// This diagnostic result grants no access and must not be reused as a billing entitlement.
export function describeVerifiedSample(tx: Record<string, unknown>, userId: string, now = Date.now()) {
  if (tx.environment !== 'Sandbox' || tx.bundleId !== 'com.rfgforge.solapath') throw new Error('sandbox_required');
  if (typeof tx.appAccountToken !== 'string' || tx.appAccountToken.toLowerCase() !== userId.toLowerCase()) throw new Error('account_mismatch');
  if (typeof tx.productId !== 'string' || !productIDs.has(tx.productId) || tx.type !== 'Auto-Renewable Subscription') throw new Error('invalid_product');
  if (tx.inAppOwnershipType !== 'PURCHASED') throw new Error('unsupported_ownership');
  if (typeof tx.transactionId !== 'string' || !/^\d+$/.test(tx.transactionId)) throw new Error('invalid_transaction');
  if (typeof tx.expiresDate !== 'number' || !Number.isFinite(tx.expiresDate) || tx.expiresDate <= 0 ||
      typeof tx.signedDate !== 'number' || !Number.isFinite(tx.signedDate) || tx.signedDate > now + 60000) throw new Error('invalid_dates');
  return {
    verified: true, environment: 'Sandbox', grantsAccess: false,
    transactionId: tx.transactionId, productId: tx.productId,
    expiresAt: new Date(tx.expiresDate).toISOString(),
    state: tx.revocationDate != null ? 'revoked' : tx.isUpgraded === true ? 'superseded' : tx.expiresDate <= now ? 'expired' : 'active_sample',
  };
}
