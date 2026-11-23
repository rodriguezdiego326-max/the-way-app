import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { supabase } from "@/lib/supabase";
import { LanguageProvider, useLanguage } from "@/lib/i18n";
import ChurchAudioPairPanel from "@/components/ChurchAudioPairPanel";
import "./index.css";

export function Sender() {
  const { t, setLanguage, language } = useLanguage();
  const [user, setUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [churches, setChurches] = useState<{ id: string; name: string }[]>([]);
  const [church, setChurch] = useState("");
  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data, error }) => {
      if (active) {
        setUser(data.session?.user.id ?? null);
        setLoading(false);
        if (error) setError("Please sign in again.");
      }
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setUser(session?.user.id ?? null);
        setLoading(false);
      }
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    let active = true;
    setChurch("");
    setChurches([]);
    if (!user) return;
    void supabase
      .from("church_memberships")
      .select("church_id, church_profiles(name)")
      .eq("profile_id", user)
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setError("Could not load your churches. Please sign in again.");
          return;
        }
        const options = (data ?? []).map((row) => ({
          id: row.church_id,
          name:
            (Array.isArray(row.church_profiles)
              ? row.church_profiles[0]
              : row.church_profiles
            )?.name ?? "My Church",
        }));
        setChurches(options);
        setChurch(options[0]?.id ?? "");
      });
    return () => {
      active = false;
    };
  }, [user]);
  async function login(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) setError("Sign-in failed. Check your email and password.");
      else setPassword("");
    } catch {
      setError("Sign-in failed. Check your email and password.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="min-h-screen bg-ink-950 text-ivory-100 px-5 py-10">
      <div className="max-w-xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <p className="tracking-widest text-gold-300">SOLAPATH</p>
          <button
            className="btn-ghost"
            onClick={() => setLanguage(language === "en" ? "es" : "en")}
          >
            {language === "en" ? "Español" : "English"}
          </button>
        </div>
        <h1 className="font-serif text-3xl mb-3">
          {t("Computer audio sender")}
        </h1>
        <p className="text-ivory-400 mb-6">
          {t(
            "Send your microphone or USB mixer audio directly to your church’s live translation. Keep this page open during the service.",
          )}
        </p>
        {loading ? (
          <p>{t("Loading...")}</p>
        ) : !user ? (
          <form
            className="premium-card p-6 grid gap-4"
            onSubmit={(event) => void login(event)}
          >
            <p>{t("Sign in with your SOLAPATH church leader account.")}</p>
            <label>
              {t("Email")}
              <input
                type="email"
                autoComplete="username"
                className="input-field w-full mt-1"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              {t("Password")}
              <input
                type="password"
                autoComplete="current-password"
                className="input-field w-full mt-1"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button className="btn-primary" disabled={busy}>
              {t(busy ? "Loading..." : "Sign In")}
            </button>
          </form>
        ) : (
          <>
            <label className="block mb-5">
              {t("My Church")}
              <select
                className="input-field w-full mt-1"
                value={church}
                onChange={(e) => setChurch(e.target.value)}
              >
                {churches.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            {church ? (
              <ChurchAudioPairPanel
                key={`${user}:${church}`}
                churchId={church}
              />
            ) : (
              <p>
                {t(
                  "Join your church in the SOLAPATH app before using the sender.",
                )}
              </p>
            )}
            <button
              className="btn-secondary mt-4"
              onClick={() => {
                setUser(null);
                void supabase.auth.signOut();
              }}
            >
              {t("Sign Out")}
            </button>
          </>
        )}
        {error && (
          <p role="alert" className="text-clay-300 mt-4">
            {t(error)}
          </p>
        )}
      </div>
    </main>
  );
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LanguageProvider>
      <Sender />
    </LanguageProvider>
  </StrictMode>,
);
