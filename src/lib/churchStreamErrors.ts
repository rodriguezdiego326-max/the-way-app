/** Supabase puts a non-2xx response body in error.context, not in data. */
export async function churchStreamErrorCode(error: unknown): Promise<string | null> {
  const response = (error as { context?: unknown } | null)?.context;
  if (!(response instanceof Response)) return null;
  try {
    const body: unknown = await response.clone().json();
    const code = (body as { error?: unknown } | null)?.error;
    if (typeof code === 'string') return code;
  } catch { /* Proxy errors may have an empty or non-JSON body. */ }
  return response.headers.get('x-solapath-error');
}

/** A lost response must not leave Connect disabled indefinitely. */
export function withStreamDeadline<T>(
  request: Promise<T>,
  onLateResult: (result: T) => Promise<unknown>,
  timeoutMs = 45_000,
): Promise<T> {
  return new Promise((resolve, reject) => {
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      reject(new Error('youtube_connection_timeout'));
    }, timeoutMs);
    request.then((result) => {
      clearTimeout(timer);
      if (timedOut) {
        // A late successful start can allocate an ingress. Remove only that
        // request's session; never silently adopt it after reporting a timeout.
        void onLateResult(result).catch(() => undefined);
      } else {
        resolve(result);
      }
    }, (error) => {
      clearTimeout(timer);
      if (!timedOut) reject(error);
    });
  });
}
