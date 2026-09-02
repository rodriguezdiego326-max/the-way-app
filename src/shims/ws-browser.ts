// Browser shim for the Node.js "ws" package.
// @supabase/realtime-js references "ws" only inside error-message strings
// for Node.js environments. In the browser/Capacitor WKWebView, the native
// globalThis.WebSocket is used directly via WebSocketFactory.
// This shim ensures any bare "ws" specifier resolves to the browser WebSocket
// constructor instead of a Node-only module that cannot load in WKWebView.

const WS = typeof globalThis !== 'undefined' && typeof globalThis.WebSocket !== 'undefined'
  ? globalThis.WebSocket
  : typeof WebSocket !== 'undefined'
    ? WebSocket
    : undefined;

if (!WS) {
  throw new Error('WebSocket is not available in this environment');
}

const ws = WS;
export default ws;
export { WS as WebSocket };
