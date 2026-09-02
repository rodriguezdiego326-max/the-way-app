import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// Capacitor's WKWebView loads assets from capacitor://localhost, a custom
// scheme whose handler does not return CORS headers. Vite emits crossorigin
// attributes on script/stylesheet tags, which forces a CORS fetch that fails
// silently in the native shell — the JS bundle never runs and the app shows
// a black screen. This plugin strips those attributes from the built HTML.
function stripCrossorigin(): Plugin {
  return {
    name: 'strip-crossorigin',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(/ crossorigin(="")?(?=[\s>])/gi, '');
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), stripCrossorigin()],
  // Capacitor loads assets from a relative path inside the native WebView.
  // Setting base to './' ensures asset paths work in both browser and native shell.
  base: './',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // Redirect the Node.js "ws" package to a browser shim that uses
      // globalThis.WebSocket. @supabase/realtime-js only references "ws"
      // inside error-message strings, but this alias ensures any bare
      // "ws" specifier resolves safely in the browser/Capacitor bundle.
      ws: fileURLToPath(new URL('./src/shims/ws-browser.ts', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
