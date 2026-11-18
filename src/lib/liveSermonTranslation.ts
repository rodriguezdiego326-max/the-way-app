import { supabase } from '@/lib/supabase';

export type LiveTranslationLanguage = 'en' | 'es';
export type LiveTranslationState = 'connecting' | 'connected' | 'closed';

export interface LiveTranslationCallbacks {
  onSourceTranscript?: (transcript: string) => void;
  onTranslationTranscript?: (transcript: string) => void;
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

type BufferedRTCRtpReceiver = RTCRtpReceiver & {
  jitterBufferTarget?: number | null;
};

type TranscriptTurn = {
  order: number;
  text: string;
};

type RealtimeEvent = {
  type?: string;
  delta?: string;
  transcript?: string;
  item_id?: string;
  error?: { message?: string };
  response?: { status?: string };
};

const OPENAI_REALTIME_CALLS_URL = 'https://api.openai.com/v1/realtime/calls';
const SMOOTH_TRANSLATION_BUFFER_MS = 700;

function messageFromFunctionError(error: unknown): string {
  const response = (error as { context?: unknown } | null)?.context;
  if (response instanceof Response && response.status === 401) {
    return 'Please sign in again before starting live translation.';
  }
  return 'Live translation could not start. Please try again.';
}

function transcriptFromTurns(turns: Map<string, TranscriptTurn>): string {
  return Array.from(turns.values())
    .sort((a, b) => a.order - b.order)
    .map((turn) => turn.text.trim())
    .filter(Boolean)
    .join('\n');
}

export async function startLiveSermonTranslation(
  sourceLanguage: LiveTranslationLanguage,
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
    { body: { sourceLanguage, targetLanguage } },
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

  const sourceTurns = new Map<string, TranscriptTurn>();
  const translationTurns = new Map<string, TranscriptTurn>();
  let nextSourceOrder = 0;
  let nextTranslationOrder = 0;
  let responseInProgress = false;
  let responseQueued = false;
  let stopped = false;

  const cleanup = () => {
    if (stopped) return;
    stopped = true;
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

    peer.ontrack = ({ streams, receiver }) => {
      const bufferedReceiver = receiver as BufferedRTCRtpReceiver;
      if ('jitterBufferTarget' in bufferedReceiver) {
        try {
          bufferedReceiver.jitterBufferTarget = SMOOTH_TRANSLATION_BUFFER_MS;
        } catch {
          // Fall back to the platform's normal WebRTC buffering.
        }
      }

      const stream = streams[0];
      if (stream) {
        translatedAudio.srcObject = stream;
        void translatedAudio.play().catch(() => undefined);
      }
    };

    const events = peer.createDataChannel('oai-events');

    const requestTranslationResponse = () => {
      if (stopped) return;
      if (responseInProgress || events.readyState !== 'open') {
        responseQueued = true;
        return;
      }

      responseQueued = false;
      responseInProgress = true;
      events.send(JSON.stringify({
        type: 'response.create',
        response: {
          output_modalities: ['audio'],
        },
      }));
    };

    const ensureSourceTurn = (itemId: string) => {
      let turn = sourceTurns.get(itemId);
      if (!turn) {
        turn = { order: nextSourceOrder++, text: '' };
        sourceTurns.set(itemId, turn);
      }
      return turn;
    };

    const ensureTranslationTurn = (itemId: string) => {
      let turn = translationTurns.get(itemId);
      if (!turn) {
        turn = { order: nextTranslationOrder++, text: '' };
        translationTurns.set(itemId, turn);
      }
      return turn;
    };

    events.onmessage = ({ data: raw }) => {
      try {
        const event = JSON.parse(String(raw)) as RealtimeEvent;

        if (event.type === 'input_audio_buffer.committed' && typeof event.item_id === 'string') {
          ensureSourceTurn(event.item_id);
          if (responseInProgress) {
            responseQueued = true;
          } else {
            requestTranslationResponse();
          }
          return;
        }

        if (
          event.type === 'conversation.item.input_audio_transcription.delta'
          && typeof event.item_id === 'string'
          && typeof event.delta === 'string'
        ) {
          const turn = ensureSourceTurn(event.item_id);
          turn.text += event.delta;
          callbacks.onSourceTranscript?.(transcriptFromTurns(sourceTurns));
          return;
        }

        if (
          event.type === 'conversation.item.input_audio_transcription.completed'
          && typeof event.item_id === 'string'
          && typeof event.transcript === 'string'
        ) {
          const turn = ensureSourceTurn(event.item_id);
          turn.text = event.transcript;
          callbacks.onSourceTranscript?.(transcriptFromTurns(sourceTurns));
          return;
        }

        if (
          event.type === 'response.output_audio_transcript.delta'
          && typeof event.item_id === 'string'
          && typeof event.delta === 'string'
        ) {
          const turn = ensureTranslationTurn(event.item_id);
          turn.text += event.delta;
          callbacks.onTranslationTranscript?.(transcriptFromTurns(translationTurns));
          return;
        }

        if (
          event.type === 'response.output_audio_transcript.done'
          && typeof event.item_id === 'string'
          && typeof event.transcript === 'string'
        ) {
          const turn = ensureTranslationTurn(event.item_id);
          turn.text = event.transcript;
          callbacks.onTranslationTranscript?.(transcriptFromTurns(translationTurns));
          return;
        }

        if (event.type === 'response.created') {
          responseInProgress = true;
          return;
        }

        if (event.type === 'response.done') {
          responseInProgress = false;
          if (event.response?.status && event.response.status !== 'completed') {
            callbacks.onError?.('The live translation session reported an error.');
          }
          if (responseQueued) {
            window.setTimeout(requestTranslationResponse, 0);
          }
          return;
        }

        if (event.type === 'conversation.item.input_audio_transcription.failed') {
          callbacks.onError?.('The live translation session reported an error.');
          return;
        }

        if (event.type === 'error') {
          responseInProgress = false;
          callbacks.onError?.('The live translation session reported an error.');
          if (responseQueued) {
            window.setTimeout(requestTranslationResponse, 0);
          }
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

    const sdpResponse = await fetch(OPENAI_REALTIME_CALLS_URL, {
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
