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
  translation_value?: string;
  caption_value?: string;
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
  text?: string;
  item_id?: string;
  error?: { message?: string };
  response?: { status?: string };
};

const OPENAI_REALTIME_CALLS_URL = 'https://api.openai.com/v1/realtime/calls';
const SMOOTH_TRANSLATION_BUFFER_MS = 500;

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

async function connectRealtimePeer(peer: RTCPeerConnection, clientSecret: string) {
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

  const translationSecret = data?.translation_value;
  const captionSecret = data?.caption_value;
  if (!translationSecret || !captionSecret) {
    throw new Error('Live translation could not start. Please try again.');
  }

  let sourceStream: MediaStream;
  try {
    sourceStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: false,
        channelCount: 1,
      },
    });
  } catch {
    throw new Error('Microphone access is required for live sermon translation.');
  }

  const sourceTrack = sourceStream.getAudioTracks()[0];
  if (!sourceTrack) {
    sourceStream.getTracks().forEach((track) => track.stop());
    throw new Error('No microphone audio track was available.');
  }

  const captionTrack = sourceTrack.clone();
  const translationPeer = new RTCPeerConnection();
  const captionPeer = new RTCPeerConnection();
  const translatedAudio = new Audio();
  translatedAudio.autoplay = true;
  translatedAudio.muted = true;

  const sourceTurns = new Map<string, TranscriptTurn>();
  const translationTurns = new Map<string, TranscriptTurn>();
  let nextSourceOrder = 0;
  let nextTranslationOrder = 0;
  let translationConnected = false;
  let captionConnected = false;
  let responseInProgress = false;
  let responseQueued = false;
  let stopped = false;

  const updateConnectedState = () => {
    if (!stopped && translationConnected && captionConnected) {
      callbacks.onStateChange?.('connected');
    }
  };

  const cleanup = () => {
    if (stopped) return;
    stopped = true;
    sourceStream.getTracks().forEach((track) => track.stop());
    captionTrack.stop();
    translatedAudio.pause();
    translatedAudio.srcObject = null;
    translationPeer.close();
    captionPeer.close();
    callbacks.onStateChange?.('closed');
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

  try {
    translationPeer.addTrack(sourceTrack, sourceStream);
    captionPeer.addTrack(captionTrack, new MediaStream([captionTrack]));

    translationPeer.ontrack = ({ streams, receiver }) => {
      const bufferedReceiver = receiver as BufferedRTCRtpReceiver;
      if ('jitterBufferTarget' in bufferedReceiver) {
        try {
          bufferedReceiver.jitterBufferTarget = SMOOTH_TRANSLATION_BUFFER_MS;
        } catch {
          // Fall back to the platform's default WebRTC buffering.
        }
      }

      const stream = streams[0];
      if (stream) {
        translatedAudio.srcObject = stream;
        void translatedAudio.play().catch(() => undefined);
      }
    };

    const translationEvents = translationPeer.createDataChannel('oai-translation-events');
    const captionEvents = captionPeer.createDataChannel('oai-caption-events');

    const requestQueuedResponse = () => {
      if (stopped || !responseQueued || responseInProgress || translationEvents.readyState !== 'open') {
        return;
      }

      responseQueued = false;
      responseInProgress = true;
      translationEvents.send(JSON.stringify({
        type: 'response.create',
        response: {
          output_modalities: ['audio'],
        },
      }));
    };

    translationEvents.onmessage = ({ data: raw }) => {
      try {
        const event = JSON.parse(String(raw)) as RealtimeEvent;

        if (event.type === 'input_audio_buffer.committed') {
          if (responseInProgress) responseQueued = true;
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
          window.setTimeout(requestQueuedResponse, 0);
          return;
        }

        if (event.type === 'error') {
          responseInProgress = false;
          callbacks.onError?.('The live translation session reported an error.');
          window.setTimeout(requestQueuedResponse, 0);
        }
      } catch {
        // Ignore malformed provider events rather than interrupting an active sermon.
      }
    };

    captionEvents.onmessage = ({ data: raw }) => {
      try {
        const event = JSON.parse(String(raw)) as RealtimeEvent;

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
          event.type === 'conversation.item.input_audio_transcription.segment'
          && typeof event.item_id === 'string'
          && typeof event.text === 'string'
        ) {
          const turn = ensureSourceTurn(event.item_id);
          if (!turn.text) {
            turn.text = event.text;
            callbacks.onSourceTranscript?.(transcriptFromTurns(sourceTurns));
          }
          return;
        }

        if (event.type === 'conversation.item.input_audio_transcription.failed' || event.type === 'error') {
          callbacks.onError?.('The live translation session reported an error.');
        }
      } catch {
        // Ignore malformed transcription events and keep the live session running.
      }
    };

    translationEvents.onerror = () => {
      callbacks.onError?.('The live translation session reported an error.');
    };

    captionEvents.onerror = () => {
      callbacks.onError?.('The live translation session reported an error.');
    };

    translationPeer.onconnectionstatechange = () => {
      translationConnected = translationPeer.connectionState === 'connected';
      updateConnectedState();
      if (translationPeer.connectionState === 'failed') {
        callbacks.onError?.('The live translation connection was lost.');
        cleanup();
      }
    };

    captionPeer.onconnectionstatechange = () => {
      captionConnected = captionPeer.connectionState === 'connected';
      updateConnectedState();
      if (captionPeer.connectionState === 'failed') {
        callbacks.onError?.('The live translation connection was lost.');
        cleanup();
      }
    };

    await Promise.all([
      connectRealtimePeer(translationPeer, translationSecret),
      connectRealtimePeer(captionPeer, captionSecret),
    ]);

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
