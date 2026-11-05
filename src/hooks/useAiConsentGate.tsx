import { useCallback, useRef, useState } from 'react';
import type { Profile } from '@/lib/types';
import { grantAiConsent, hasCurrentAiConsent } from '@/lib/aiConsent';
import AIProcessingConsentDialog from '@/components/AIProcessingConsentDialog';

export function useAiConsentGate(profile: Profile | null, onProfileUpdate?: () => void) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const resolverRef = useRef<((granted: boolean) => void) | null>(null);

  const settle = useCallback((granted: boolean) => {
    setDialogOpen(false);
    resolverRef.current?.(granted);
    resolverRef.current = null;
  }, []);

  const ensureAiConsent = useCallback((): Promise<boolean> => {
    if (hasCurrentAiConsent(profile)) return Promise.resolve(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setDialogOpen(true);
    });
  }, [profile]);

  const handleAllow = useCallback(async () => {
    if (!profile) throw new Error('Your profile is still loading. Please try again.');
    await grantAiConsent(profile.id);
    onProfileUpdate?.();
    settle(true);
  }, [profile, onProfileUpdate, settle]);

  const consentDialog = (
    <AIProcessingConsentDialog
      open={dialogOpen}
      onAllow={handleAllow}
      onNotNow={() => settle(false)}
    />
  );

  return { ensureAiConsent, consentDialog };
}
