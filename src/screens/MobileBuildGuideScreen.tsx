import { X, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { vibrate } from '@/lib/utils';

interface Props {
  onBack: () => void;
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    vibrate(8);
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  return (
    <div className="relative group">
      <pre className="bg-ink-900/80 border border-ink-700/40 rounded-xl px-4 py-3 text-xs font-mono text-gold-300 overflow-x-auto whitespace-pre-wrap break-all">{code}</pre>
      <button
        onClick={copy}
        className="absolute top-2 right-2 p-1.5 rounded-lg bg-ink-800/80 border border-ink-600/40 text-ivory-500 hover:text-ivory-200 transition-all opacity-0 group-hover:opacity-100"
      >
        {copied ? <Check size={12} className="text-sage-400" /> : <Copy size={12} />}
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="ui-label">{title}</p>
      {children}
    </div>
  );
}

export default function MobileBuildGuideScreen({ onBack }: Props) {
  return (
    <div className="app-container bg-ink-950 min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top pb-4 shrink-0">
        <button onClick={onBack} className="btn-ghost -ml-2">
          <X size={20} />
        </button>
        <div className="text-center">
          <p className="ui-label">Phase 11</p>
          <h1 className="font-serif text-lg text-ivory-50">Mobile Build Guide</h1>
        </div>
        <div className="w-8" />
      </header>

      <div className="flex-1 overflow-y-auto px-4 space-y-6 pb-4">
        {/* Identity card */}
        <div className="premium-card p-4">
          <p className="text-ivory-200 text-sm font-medium mb-1">SOLAPATH — Mobile Build Guide</p>
          <p className="text-ivory-500 text-xs">Version 0.1.0 (Beta) · Capacitor 8 · React/Vite</p>
          <p className="text-ivory-500 text-xs mt-1">Bundle: com.rfgforge.solapath · Deep link: solapath://</p>
        </div>

        {/* Prerequisites */}
        <Section title="1. Prerequisites">
          <div className="premium-card p-4 space-y-3">
            <div>
              <p className="text-ivory-200 text-sm font-medium mb-1">All platforms</p>
              <p className="text-ivory-400 text-xs">Node.js 18+ (project uses 22.x)</p>
              <p className="text-ivory-400 text-xs">npm 9+</p>
            </div>
            <div className="h-px bg-ink-700/40" />
            <div>
              <p className="text-ivory-200 text-sm font-medium mb-1">iOS (macOS only)</p>
              <p className="text-ivory-400 text-xs">macOS 13+ (Ventura or later)</p>
              <p className="text-ivory-400 text-xs">Xcode 15+ from the Mac App Store</p>
              <p className="text-ivory-400 text-xs">Xcode Command Line Tools</p>
              <p className="text-ivory-400 text-xs">Apple Developer account (apple.com/developer)</p>
              <p className="text-ivory-400 text-xs">CocoaPods (gem install cocoapods)</p>
            </div>
            <div className="h-px bg-ink-700/40" />
            <div>
              <p className="text-ivory-200 text-sm font-medium mb-1">Android (any OS)</p>
              <p className="text-ivory-400 text-xs">Android Studio Hedgehog or later</p>
              <p className="text-ivory-400 text-xs">Android SDK (API 22 minimum, API 35 target)</p>
              <p className="text-ivory-400 text-xs">Java 17 (bundled with Android Studio)</p>
            </div>
          </div>
        </Section>

        {/* Install dependencies */}
        <Section title="2. Install Dependencies">
          <CodeBlock code="npm install" />
          <p className="text-ivory-500 text-xs">All Capacitor plugins are in package.json dependencies — no separate install needed.</p>
        </Section>

        {/* Build web app */}
        <Section title="3. Build Web App">
          <CodeBlock code="npm run build:web" />
          <p className="text-ivory-500 text-xs">Outputs to dist/. This is the webDir consumed by Capacitor native projects.</p>
          <p className="text-ivory-500 text-xs mt-1">Verify: dist/index.html must exist before running any cap command.</p>
        </Section>

        {/* Sync Capacitor */}
        <Section title="4. Sync Both Platforms">
          <CodeBlock code="npm run cap:sync" />
          <p className="text-ivory-500 text-xs">Builds web app then copies dist/ into both ios/ and android/ native projects and updates plugins.</p>
          <p className="text-ivory-500 text-xs mt-1">Run this every time you change code before testing on device.</p>
        </Section>

        {/* Sync individual platforms */}
        <Section title="5. Sync Individual Platforms">
          <CodeBlock code={`npm run cap:sync:ios\n# or\nnpm run cap:sync:android`} />
        </Section>

        {/* Open iOS */}
        <Section title="6. Open iOS in Xcode">
          <CodeBlock code="npm run cap:open:ios" />
          <p className="text-ivory-500 text-xs">Opens ios/App/App.xcworkspace in Xcode. Always open the .xcworkspace, not .xcodeproj.</p>
          <div className="premium-card p-3 mt-2">
            <p className="text-ivory-300 text-xs font-medium mb-1">First-time iOS setup in Xcode</p>
            <p className="text-ivory-400 text-xs">1. Select the "App" target</p>
            <p className="text-ivory-400 text-xs">2. Signing & Capabilities tab → set your Team</p>
            <p className="text-ivory-400 text-xs">3. Bundle Identifier: com.rfgforge.solapath (change if needed)</p>
            <p className="text-ivory-400 text-xs">4. Select device or simulator → Run</p>
          </div>
        </Section>

        {/* Open Android */}
        <Section title="7. Open Android in Android Studio">
          <CodeBlock code="npm run cap:open:android" />
          <p className="text-ivory-500 text-xs">Opens android/ in Android Studio.</p>
          <div className="premium-card p-3 mt-2">
            <p className="text-ivory-300 text-xs font-medium mb-1">First-time Android setup</p>
            <p className="text-ivory-400 text-xs">1. Let Gradle sync complete</p>
            <p className="text-ivory-400 text-xs">2. Select device or emulator → Run</p>
            <p className="text-ivory-400 text-xs">3. applicationId: com.rfgforge.solapath</p>
          </div>
        </Section>

        {/* Run on simulator */}
        <Section title="8. Run on Simulator / Emulator">
          <CodeBlock code={`npm run cap:run:ios\n# or\nnpm run cap:run:android`} />
          <p className="text-ivory-500 text-xs">These commands build web, sync, and deploy to the first available connected device or simulator.</p>
        </Section>

        {/* Run on physical device */}
        <Section title="9. Run on Physical Device">
          <div className="premium-card p-4 space-y-2">
            <p className="text-ivory-200 text-sm font-medium">iOS</p>
            <p className="text-ivory-400 text-xs">1. Connect iPhone via USB</p>
            <p className="text-ivory-400 text-xs">2. Trust the computer on the device</p>
            <p className="text-ivory-400 text-xs">3. In Xcode, select the physical device</p>
            <p className="text-ivory-400 text-xs">4. Product → Run (or ⌘R)</p>
            <div className="h-px bg-ink-700/40" />
            <p className="text-ivory-200 text-sm font-medium">Android</p>
            <p className="text-ivory-400 text-xs">1. Enable Developer Options on device</p>
            <p className="text-ivory-400 text-xs">2. Enable USB Debugging</p>
            <p className="text-ivory-400 text-xs">3. Connect via USB</p>
            <p className="text-ivory-400 text-xs">4. In Android Studio, select the device → Run</p>
          </div>
        </Section>

        {/* Build beta */}
        <Section title="10. Build Beta">
          <div className="premium-card p-4 space-y-2">
            <p className="text-ivory-200 text-sm font-medium">iOS — TestFlight</p>
            <CodeBlock code="npm run cap:sync:ios" />
            <p className="text-ivory-400 text-xs">Then in Xcode:</p>
            <p className="text-ivory-400 text-xs">1. Product → Archive</p>
            <p className="text-ivory-400 text-xs">2. Organizer → Distribute App → TestFlight</p>
            <p className="text-ivory-400 text-xs">3. Upload to App Store Connect</p>
            <p className="text-ivory-400 text-xs">4. Add testers in App Store Connect → TestFlight</p>
            <div className="h-px bg-ink-700/40" />
            <p className="text-ivory-200 text-sm font-medium">Android — Internal Testing</p>
            <CodeBlock code="npm run cap:sync:android" />
            <p className="text-ivory-400 text-xs">Then in Android Studio:</p>
            <p className="text-ivory-400 text-xs">1. Build → Generate Signed Bundle (AAB)</p>
            <p className="text-ivory-400 text-xs">2. Upload to Google Play Console → Internal Testing</p>
          </div>
        </Section>

        {/* Version bumping */}
        <Section title="11. Bumping the Version">
          <div className="premium-card p-4">
            <p className="text-ivory-300 text-xs font-medium mb-2">For each release:</p>
            <p className="text-ivory-400 text-xs">1. Edit package.json → "version"</p>
            <p className="text-ivory-400 text-xs">2. iOS: ios/App/App.xcodeproj/project.pbxproj → MARKETING_VERSION and CURRENT_PROJECT_VERSION</p>
            <p className="text-ivory-400 text-xs">3. Android: android/app/build.gradle → versionName and versionCode (increment integer)</p>
            <div className="h-px bg-ink-700/40 my-2" />
            <p className="text-ivory-500 text-xs">Current: 0.1.0 (build 1) — Beta</p>
          </div>
        </Section>

        {/* Troubleshooting */}
        <Section title="12. Troubleshooting">
          <div className="premium-card p-4 space-y-3">
            <div>
              <p className="text-ivory-200 text-xs font-medium">"dist/ not found" on cap sync</p>
              <p className="text-ivory-400 text-xs">Run npm run build:web first.</p>
            </div>
            <div className="h-px bg-ink-700/40" />
            <div>
              <p className="text-ivory-200 text-xs font-medium">iOS: "No such module 'Capacitor'"</p>
              <p className="text-ivory-400 text-xs">Run: cd ios/App && pod install</p>
            </div>
            <div className="h-px bg-ink-700/40" />
            <div>
              <p className="text-ivory-200 text-xs font-medium">Android: Gradle sync fails</p>
              <p className="text-ivory-400 text-xs">File → Sync Project with Gradle Files in Android Studio.</p>
            </div>
            <div className="h-px bg-ink-700/40" />
            <div>
              <p className="text-ivory-200 text-xs font-medium">Supabase calls fail in native app</p>
              <p className="text-ivory-400 text-xs">Ensure androidScheme is "https" in capacitor.config.ts. Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env before building.</p>
            </div>
            <div className="h-px bg-ink-700/40" />
            <div>
              <p className="text-ivory-200 text-xs font-medium">White screen on launch</p>
              <p className="text-ivory-400 text-xs">Rebuild: npm run cap:sync. Check Xcode/Android Studio logs for JS errors.</p>
            </div>
            <div className="h-px bg-ink-700/40" />
            <div>
              <p className="text-ivory-200 text-xs font-medium">Before App Store submission</p>
              <p className="text-ivory-400 text-xs">Replace placeholder app icon with final artwork. Complete real device test matrix. Verify privacy manifest for App Store privacy nutrition label.</p>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
