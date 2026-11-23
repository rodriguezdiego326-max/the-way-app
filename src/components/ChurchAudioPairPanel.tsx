import { useCallback, useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { useLanguage } from "@/lib/i18n";
import {
  audioPairRequest,
  pairingMessage,
  type PairResponse,
} from "@/lib/churchAudioPair";
import { createChurchAudioSender } from "@/lib/churchAudioSender";
import {
  startChurchLiveListenerFromConnection,
  type ChurchLiveListenerSession,
  type ChurchLiveListenerState,
} from "@/lib/churchLiveListener";

export default function ChurchAudioPairPanel({
  churchId,
}: {
  churchId: string;
}) {
  const { t } = useLanguage();
  const [status, setStatus] = useState<PairResponse | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const [generated, setGenerated] = useState("");
  const [language, setLanguage] = useState<"en" | "es">("en");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [device, setDevice] = useState("");
  const [senderState, setSenderState] = useState<
    "connecting" | "sending" | "reconnecting" | "closed"
  >("closed");
  const [level, setLevel] = useState(0);
  const [listenerState, setListenerState] =
    useState<ChurchLiveListenerState>("closed");
  const [original, setOriginal] = useState("");
  const [translation, setTranslation] = useState("");
  const [needsAudio, setNeedsAudio] = useState(false);
  const proof = useRef("");
  const sender = useRef<ReturnType<typeof createChurchAudioSender> | null>(
    null,
  );
  const listener = useRef<ChurchLiveListenerSession | null>(null);
  const mounted = useRef(true);
  const generation = useRef(0);
  const sequence = useRef(0);
  const pending = useRef(false);
  const showError = (cause: unknown) =>
    setError(
      pairingMessage(
        cause instanceof DOMException
          ? cause.name
          : cause instanceof Error
            ? cause.message
            : "",
      ),
    );
  const stopLocal = useCallback(async () => {
    generation.current++;
    const sending = sender.current;
    sender.current = null;
    const listening = listener.current;
    listener.current = null;
    await Promise.allSettled([sending?.stop(), listening?.stop()]);
    if (mounted.current) {
      setSenderState("closed");
      setListenerState("closed");
      setNeedsAudio(false);
      setLevel(0);
    }
  }, []);
  const refresh = useCallback(async () => {
    if (pending.current) return;
    const id = ++sequence.current;
    try {
      const next = await audioPairRequest(churchId, "get");
      if (mounted.current && id === sequence.current) {
        setStatus(next);
        setError("");
      }
    } catch (cause) {
      if (mounted.current && id === sequence.current)
        setError(pairingMessage(cause instanceof Error ? cause.message : ""));
    }
  }, [churchId]);
  useEffect(() => {
    mounted.current = true;
    void refresh();
    const timer = window.setInterval(() => {
      if (!document.hidden) void refresh();
    }, 5000);
    const hide = () => {
      void stopLocal();
    };
    window.addEventListener("pagehide", hide);
    const invalidate = () => {
      sequence.current++;
    };
    return () => {
      mounted.current = false;
      invalidate();
      window.clearInterval(timer);
      window.removeEventListener("pagehide", hide);
      void stopLocal();
    };
  }, [refresh, stopLocal]);
  useEffect(() => {
    if (
      status &&
      (!status.paired ||
        !!status.error ||
        (!!status.expiresAt && status.expiresAt < Date.now()))
    )
      void stopLocal();
  }, [status, stopLocal]);
  async function mutate(action: "create" | "pair" | "stop") {
    if (!status?.canManage || pending.current) return;
    if (
      action === "stop" &&
      !window.confirm(t("Stop this paired audio connection for everyone?"))
    )
      return;
    pending.current = true;
    sequence.current++;
    setBusy(true);
    setError("");
    try {
      if (action !== "pair") await stopLocal();
      const next = await audioPairRequest(churchId, action, {
        revision: status.revision,
        sourceLanguage: language,
        code,
      });
      if (!mounted.current) return;
      setStatus(next);
      if (action === "create") {
        proof.current = next.proof ?? "";
        setGenerated(next.code ?? "");
      }
      if (action === "stop") {
        proof.current = "";
        setGenerated("");
        setCode("");
      }
      if (action === "pair") setCode("");
    } catch (cause) {
      if (mounted.current) showError(cause);
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  async function listInputs() {
    setError("");
    let media: MediaStream | undefined;
    try {
      media = await navigator.mediaDevices.getUserMedia({ audio: true });
      const inputs = (await navigator.mediaDevices.enumerateDevices()).filter(
        (d) => d.kind === "audioinput",
      );
      if (mounted.current) {
        setDevices(inputs);
        setDevice((current) =>
          inputs.some((d) => d.deviceId === current)
            ? current
            : (inputs[0]?.deviceId ?? ""),
        );
      }
    } catch (cause) {
      if (mounted.current) showError(cause);
    } finally {
      media?.getTracks().forEach((track) => track.stop());
    }
  }
  async function startSender() {
    if (!proof.current || sender.current || pending.current) return;
    await stopLocal();
    const id = ++generation.current;
    const current = () => mounted.current && generation.current === id;
    setError("");
    setSenderState("connecting");
    try {
      const response = await audioPairRequest(churchId, "publisher_token", {
        proof: proof.current,
      });
      if (!current()) return;
      if (!response.connection) throw new Error("feed_not_ready");
      const active = createChurchAudioSender(
        (state) => {
          if (current()) {
            setSenderState(state);
            if (state === "closed") sender.current = null;
          }
        },
        (value) => {
          if (current()) setLevel(value);
        },
      );
      sender.current = active;
      await active.start(response.connection, device);
      if (!current()) await active.stop();
    } catch (cause) {
      if (current()) {
        sender.current = null;
        setSenderState("closed");
        showError(cause);
      }
    }
  }
  async function listen() {
    if (listenerState !== "closed") return;
    await stopLocal();
    const id = ++generation.current;
    const current = () => mounted.current && generation.current === id;
    setListenerState("connecting");
    setError("");
    setOriginal("");
    setTranslation("");
    try {
      const response = await audioPairRequest(churchId, "listener_token");
      if (!current()) return;
      if (!response.connection) throw new Error("feed_not_ready");
      const active = await startChurchLiveListenerFromConnection(
        response.connection,
        response.connection.sourceIdentity,
        {
          onStateChange: (value) => {
            if (current()) setListenerState(value);
          },
          onSourceTranscript: (value) => {
            if (current()) setOriginal(value);
          },
          onTranslationTranscript: (value) => {
            if (current()) setTranslation(value);
          },
          onNeedsAudioStart: (value) => {
            if (current()) setNeedsAudio(value);
          },
          onError: (value) => {
            if (current()) setError(value);
          },
        },
      );
      if (!current()) {
        await active.stop();
        return;
      }
      listener.current = active;
    } catch (cause) {
      if (current()) {
        setListenerState("closed");
        showError(cause);
      }
    }
  }
  const isWeb = !Capacitor.isNativePlatform();
  return (
    <section className="premium-card p-5 mb-4">
      <h3 className="font-serif text-xl mb-2">{t("Pair church audio")}</h3>
      <p className="text-xs text-ivory-400 mb-4">
        {t(
          "On your computer, sign in to SOLAPATH and open this church’s Pair church audio screen. Generate a code there, then enter it in the phone app. Both devices need authorized church access.",
        )}
      </p>
      {!isWeb && (
        <p className="text-sm mb-4 break-all">
          {t("Open this test sender address on your computer:")}
          <br />
          <span className="select-all">
            https://solapath-audio-sender-test.rodriguezdiego326.chatgpt.site
          </span>
        </p>
      )}
      {!status ? (
        <p>{t("Loading...")}</p>
      ) : (
        <>
          <p role="status" className="text-sm text-gold-300 mb-3">
            {t(
              status.canListen
                ? "Source audio received"
                : status.paired
                  ? "Paired. Start sending audio on the computer."
                  : status.exists
                    ? "Waiting for the phone to pair."
                    : "No audio sender is paired.",
            )}
          </p>
          {status.error && (
            <p role="alert" className="text-clay-300 text-xs mb-3">
              {t(pairingMessage(status.error))}
            </p>
          )}
          {status.canManage && (
            <>
              {!status.paired && (
                <div className="grid gap-3 mb-5">
                  <label className="text-sm">
                    {t("Pairing code")}
                    <input
                      className="input-field w-full mt-1"
                      value={code}
                      maxLength={16}
                      autoCapitalize="characters"
                      autoCorrect="off"
                      placeholder="ABCD-1234-EF56"
                      onChange={(e) => setCode(e.target.value)}
                      disabled={busy}
                    />
                  </label>
                  <button
                    className="btn-primary w-full"
                    disabled={busy || !code.trim()}
                    onClick={() => void mutate("pair")}
                  >
                    {t("Pair this sender")}
                  </button>
                </div>
              )}
              {isWeb && (
                <div className="border-t border-ink-700 pt-4 grid gap-3 mb-4">
                  <p className="ui-label">{t("Computer audio sender")}</p>
                  {!status.hasSession && (
                    <>
                      <label className="text-sm">
                        {t("Translation Direction")}
                        <select
                          className="input-field w-full mt-1"
                          value={language}
                          disabled={busy}
                          onChange={(e) =>
                            setLanguage(e.target.value as "en" | "es")
                          }
                        >
                          <option value="en">
                            {t("English")} → {t("Spanish")}
                          </option>
                          <option value="es">
                            {t("Spanish")} → {t("English")}
                          </option>
                        </select>
                      </label>
                      <button
                        className="btn-secondary w-full"
                        disabled={busy}
                        onClick={() => void mutate("create")}
                      >
                        {t("Generate pairing code")}
                      </button>
                    </>
                  )}
                  {generated && !status.paired && (
                    <div>
                      <p className="font-mono text-xl tracking-wider select-all break-all">
                        {generated}
                      </p>
                      <p className="text-xs text-ivory-400 mt-2">
                        {t(
                          "Enter this code on your phone within 10 minutes. Generating another code replaces this one.",
                        )}
                      </p>
                    </div>
                  )}
                  {proof.current && status.paired && (
                    <>
                      <button
                        className="btn-secondary w-full"
                        disabled={senderState !== "closed"}
                        onClick={() => void listInputs()}
                      >
                        {t("Choose audio input")}
                      </button>
                      <label className="text-sm">
                        {t("Audio input")}
                        <select
                          className="input-field w-full mt-1"
                          value={device}
                          disabled={senderState !== "closed"}
                          onChange={(e) => setDevice(e.target.value)}
                        >
                          <option value="">{t("Default microphone")}</option>
                          {devices.map((d, i) => (
                            <option key={d.deviceId} value={d.deviceId}>
                              {d.label || `${t("Audio input")} ${i + 1}`}
                            </option>
                          ))}
                        </select>
                      </label>
                      <p className="text-xs text-ivory-400">
                        {t(
                          "Use headphones on the listening phone. Keep this computer tab open. Audio is sent only after you press Start sending audio.",
                        )}
                      </p>
                      <meter
                        className="w-full"
                        min={0}
                        max={1}
                        value={level}
                        aria-label={t("Audio level")}
                      />
                      <p role="status" className="text-sm">
                        {t(
                          senderState === "sending"
                            ? "Sending live audio"
                            : senderState === "reconnecting"
                              ? "Reconnecting audio..."
                              : senderState === "connecting"
                                ? "Connecting..."
                                : "Sender stopped",
                        )}
                      </p>
                      {senderState === "closed" ? (
                        <button
                          className="btn-primary w-full"
                          disabled={busy || !!status.error}
                          onClick={() => void startSender()}
                        >
                          {t("Start sending audio")}
                        </button>
                      ) : (
                        <button
                          className="btn-secondary w-full"
                          onClick={() => void stopLocal()}
                        >
                          {t("Stop sending audio")}
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
              {status.exists && (
                <button
                  className="btn-ghost text-clay-300 w-full mb-4"
                  disabled={busy}
                  onClick={() => void mutate("stop")}
                >
                  {t("Stop paired connection")}
                </button>
              )}
            </>
          )}
          {status.canListen &&
            senderState === "closed" &&
            listenerState === "closed" && (
              <button
                className="btn-primary w-full"
                onClick={() => void listen()}
              >
                {t("Listen to Translation")}
              </button>
            )}
          {listenerState !== "closed" && (
            <>
              <button
                className="btn-secondary w-full"
                onClick={() => void stopLocal()}
              >
                {t("Stop Listening")}
              </button>
              {needsAudio && (
                <button
                  className="btn-primary w-full mt-2"
                  onClick={() => {
                    void listener.current?.startAudio().catch(showError);
                  }}
                >
                  {t("Start Translated Audio")}
                </button>
              )}
              <p className="ui-label mt-4">{t("Original Sermon")}</p>
              <p className="text-sm whitespace-pre-wrap">
                {original || t("Waiting for the pastor to begin speaking...")}
              </p>
              <p className="ui-label mt-4">{t("Translated Sermon")}</p>
              <p className="text-sm whitespace-pre-wrap">
                {translation || t("Waiting for translation...")}
              </p>
            </>
          )}
        </>
      )}
      {error && (
        <p role="alert" className="text-clay-300 text-xs mt-4">
          {t(error)}
        </p>
      )}
      <button
        className="btn-ghost text-xs mt-4"
        disabled={busy}
        onClick={() => void refresh()}
      >
        {t("Refresh feed status")}
      </button>
    </section>
  );
}
