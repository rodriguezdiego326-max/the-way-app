import { supabase } from '@/lib/supabase';

export type LiveTranslationLanguage = 'en' | 'es';
export type LiveTranslationState = 'connecting' | 'connected' | 'closed';

export interface LiveTranslationCallbacks {
  onSourceDelta?: (delta: string) => void;
  onTranslationDelta?: (delta: string) => void;
  onStateChange?: (state: LiveTranslationState) => void;
  onError?: (message: string) => void;
}

export interface LiveTranslationSession {
  setTranslatedAudioEnabled(enabled: boolean): Promise<void>;
  stop(): void;
}

interface TranslationSecretResponse {
  value?: string;
  expires_at?: unknown;
}

const OPENAI_TRANSLATION_CALLS_URL = 'https://api.openai.com/v1/realtime/translations/calls';

function messageFromFunctionError(error: unknown): string {
  const response = (error as { context?: unknown } | null)?.context;
  if (response instanceof Response && response.status === 401) {
    return 'Please sign in again before starting live translation.';
  }
  return 'Live translation could not start. Please try again.';
}

export async function startLiveSermonTranslation(
  targetLanguage: LiveTranslationLanguage,
  callbacks: LiveTranslationCallbacks,
): Promise<LiveTranslationSession> {
  callbacks.onStateChange?.('connecting');

  if (
    typeof navigator === 'undefined'
    || !navigator.mediaDevices?.getUserMedia
    || typeof RTCPeerConnection === 'undefined'
  ) {
    throw new Error('Live microphone translation is not supported on this device.');
  }

  const { data, error } = await supabase.functions.invoke<TranslationSecretResponse>(
    'live-sermon-translation-session',
    { body: { targetLanguage } },
  );

  if (error) throw new Error(messageFromFunctionError(error));
  const clientSecret = data?.value;
  if (!clientSecret) throw new Error('Live translation could not start. Please try again.');

  let sourceStream: MediaStream;
  try {
    sourceStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
      },
    });
  } catch {
    throw new Error('Microphone access is required for live sermon translation.');
  }

  const peer = new RTCPeerConnection();
  const translatedAudio = new Audio();
  translatedAudio.autoplay = true;
  translatedAudio.muted = true;

  const cleanup = () => {
    sourceStream.getTracks().forEach((track) => track.stop());
    translatedAudio.pause();
    translatedAudio.srcObject = null;
    peer.close();
    callbacks.onStateChange?.('closed');
  };

  try {
    const sourceTrack = sourceStream.getAudioTracks()[0];
    if (!sourceTrack) throw new Error('No microphone audio track was available.');
    peer.addTrack(sourceTrack, sourceStream);

    peer.ontrack = ({ streams }) => {
      const stream = streams[0];
      if (stream) {
        translatedAudio.srcObject = stream;
        void translatedAudio.play().catch(() => undefined);
      }
    };

    const events = peer.createDataChannel('oai-events');

    events.onmessage = ({ data: raw }) => {
      try {
        const event = JSON.parse(String(raw)) as {
          type?: string;
          delta?: string;
          error?: { message?: string };
        };

        if (event.type === 'session.input_transcript.delta' && typeof event.delta === 'string') {
          callbacks.onSourceDelta?.(event.delta);
          return;
        }

        if (event.type === 'session.output_transcript.delta' && typeof event.delta === 'string') {
          callbacks.onTranslationDelta?.(event.delta);
          return;
        }

        if (event.type === 'error') {
          callbacks.onError?.('The live translation session reported an error.');
        }
      } catch {
        // Ignore malformed provider events rather than interrupting an active sermon.
      }
    };

    events.onerror = () => {
      callbacks.onError?.('The live translation session reported an error.');
    };

    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'connected') callbacks.onStateChange?.('connected');
      if (peer.connectionState === 'failed') {
        callbacks.onError?.('The live translation connection was lost.');
        cleanup();
      }
    };

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);

    const sdpResponse = await fetch(OPENAI_TRANSLATION_CALLS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${clientSecret}`,
        'Content-Type': 'application/sdp',
      },
      body: offer.sdp ?? '',
    });

    if (!sdpResponse.ok) {
      throw new Error('Live translation could not connect. Please try again.');
    }

    await peer.setRemoteDescription({
      type: 'answer',
      sdp: await sdpResponse.text(),
    });

    return {
      async setTranslatedAudioEnabled(enabled: boolean) {
        translatedAudio.muted = !enabled;
        if (enabled) {
          await translatedAudio.play().catch(() => {
            throw new Error('Translated audio could not play. Try headphones or use live captions.');
          });
        }
      },
      stop: cleanup,
    };
  } catch (cause) {
    cleanup();
    throw cause;
  }
}
