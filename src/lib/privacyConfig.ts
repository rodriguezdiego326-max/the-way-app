import { Browser } from '@capacitor/browser';

export const PRIVACY_POLICY_URL = 'https://rfgforge.com/solapath/privacy';
export const AI_PROCESSING_CONSENT_VERSION = '2026-11-05-v1';

export async function openPrivacyPolicy(): Promise<void> {
  try {
    await Browser.open({ url: PRIVACY_POLICY_URL });
  } catch {
    window.open(PRIVACY_POLICY_URL, '_blank', 'noopener,noreferrer');
  }
}
