export type UsageState = 'waiting' | 'connected' | 'playing' | 'failed' | 'closed';

/** Bounded, serialized, best-effort telemetry. No playback or billing decisions. */
export function createUsageReporter(send: (sequence: number, state: UsageState) => Promise<void>,
  schedule = (fn: () => void) => setInterval(fn, 15_000),
  cancel = (timer: ReturnType<typeof setInterval>) => clearInterval(timer)) {
  let state: UsageState = 'waiting';
  let sequence = 0;
  let running = false;
  let pending = false;
  let closed = false;
  const flush = async () => {
    if (running) { pending = true; return; }
    running = true;
    do {
      pending = false;
      const sent = state;
      try { await send(sequence++, sent); } catch { /* Missing samples never block audio. */ }
    } while (pending);
    running = false;
  };
  const timer = schedule(() => { if (!closed) void flush(); });
  void flush();
  return {
    setState(next: UsageState) {
      if (closed || next === state) return;
      state = next;
      if (next === 'closed') { closed = true; cancel(timer); }
      void flush();
    },
    stop() {
      if (closed) return;
      closed = true;
      cancel(timer);
      state = 'closed';
      void flush();
    },
  };
}
