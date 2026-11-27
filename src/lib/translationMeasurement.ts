import { supabase } from '@/lib/supabase';
import { createUsageReporter } from '../../shared/translationUsageReporter';

export function startTranslationMeasurement(id?: string | null) {
  if (!id) return { setState() {}, stop() {} } as ReturnType<typeof createUsageReporter>;
  return createUsageReporter(async (sequence, state) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const { error } = await supabase.rpc('observe_translation', {
        p_connection_id: id, p_sequence: sequence, p_state: state,
      }).abortSignal(controller.signal);
      if (error) throw error;
    } finally { clearTimeout(timeout); }
  });
}
