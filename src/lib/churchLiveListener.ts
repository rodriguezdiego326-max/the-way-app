import {
  Room,
  RoomEvent,
  Track,
  type Participant,
  type RemoteParticipant,
  type RemoteTrack,
  type RemoteTrackPublication,
} from 'livekit-client';
import { getChurchLiveListenerToken } from '@/lib/churchLiveTranslationEngine';

export type ChurchLiveListenerState = 'connecting' | 'waiting' | 'listening' | 'closed';

export interface ChurchLiveListenerCallbacks {
  onStateChange?: (state: ChurchLiveListenerState) => void;
  onSourceTranscript?: (transcript: string) => void;
  onTranslationTranscript?: (transcript: string) => void;
  onNeedsAudioStart?: (needed: boolean) => void;
  onError?: (message: string) => void;
}

export interface ChurchLiveListenerSession {
  startAudio(): Promise<void>;
  stop(): Promise<void>;
}

type TranscriptTurn = {
  order: number;
  text: string;
};

const MAX_TRANSCRIPT_TURNS = 120;
const TRANSLATION_STATUS_TOPIC = 'solapath.translation.status';
const TRANSLATION_STATUS_KEY = 'solapath.translation.status';
const TRANSLATION_MESSAGE_KEY = 'solapath.translation.message';
const DEFAULT_TRANSLATION_SERVICE_ERROR =
  'The church feed is connected, but the translation service could not start. Please try again shortly.';

function transcriptFromTurns(turns: Map<string, TranscriptTurn>): string {
  return Array.from(turns.values())
    .sort((a, b) => a.order - b.order)
    .map((turn) => turn.text.trim())
    .filter(Boolean)
    .join('\n');
}

function trimTurns(turns: Map<string, TranscriptTurn>) {
  if (turns.size <= MAX_TRANSCRIPT_TURNS) return;
  const oldest = Array.from(turns.entries())
    .sort((a, b) => a[1].order - b[1].order)
    .slice(0, turns.size - MAX_TRANSCRIPT_TURNS);
  oldest.forEach(([key]) => turns.delete(key));
}

export interface ChurchLiveListenerConnection {
  url: string;
  token: string;
  roomName: string;
}

async function startChurchLiveListenerWithConnection(
  connection: ChurchLiveListenerConnection,
  sourceIdentity: string,
  callbacks: ChurchLiveListenerCallbacks,
): Promise<ChurchLiveListenerSession> {
  callbacks.onStateChange?.('connecting');

  const room = new Room({
    adaptiveStream: false,
    dynacast: false,
  });

  const sourceTurns = new Map<string, TranscriptTurn>();
  const translationTurns = new Map<string, TranscriptTurn>();
  let nextSourceOrder = 0;
  let nextTranslationOrder = 0;
  const attachedAudio = new Set<HTMLMediaElement>();
  let stopped = false;
  let translationServiceFailed = false;

  const reportTranslationServiceError = (message?: string) => {
    if (translationServiceFailed) return;
    translationServiceFailed = true;
    callbacks.onStateChange?.('waiting');
    callbacks.onError?.(message || DEFAULT_TRANSLATION_SERVICE_ERROR);
  };

  const handleAgentTranslationStatus = (participant: Participant) => {
    if (!participant.isAgent) return;
    const status = participant.attributes[TRANSLATION_STATUS_KEY];
    if (status !== 'error') return;
    reportTranslationServiceError(
      participant.attributes[TRANSLATION_MESSAGE_KEY] || DEFAULT_TRANSLATION_SERVICE_ERROR,
    );
  };

  const publishTranscript = (
    turns: Map<string, TranscriptTurn>,
    segmentId: string,
    message: string,
    isSource: boolean,
  ) => {
    let turn = turns.get(segmentId);
    if (!turn) {
      turn = {
        order: isSource ? nextSourceOrder++ : nextTranslationOrder++,
        text: '',
      };
      turns.set(segmentId, turn);
    }

    turn.text = message;
    trimTurns(turns);

    const transcript = transcriptFromTurns(turns);
    if (isSource) callbacks.onSourceTranscript?.(transcript);
    else callbacks.onTranslationTranscript?.(transcript);
  };

  room.registerTextStreamHandler('lk.transcription', async (reader, participantInfo) => {
    try {
      const message = await reader.readAll();
      const attributes = reader.info.attributes ?? {};
      const segmentId = attributes['lk.segment_id'] || reader.info.id;
      const isTranscription = !!attributes['lk.transcribed_track_id'];
      if (!isTranscription || !message.trim()) return;

      const participant = room.remoteParticipants.get(participantInfo.identity);
      if (participantInfo.identity === sourceIdentity) {
        publishTranscript(sourceTurns, segmentId, message, true);
        return;
      }

      if (participant?.isAgent) {
        publishTranscript(translationTurns, segmentId, message, false);
      }
    } catch {
      // A text stream may be interrupted during reconnect; later final streams
      // repair the caption without stopping translated audio.
    }
  });

  const subscribeAgentAudio = (participant: RemoteParticipant) => {
    if (!participant.isAgent) return;
    participant.audioTrackPublications.forEach((publication) => {
      publication.setSubscribed(true);
    });
  };

  const attachAgentAudio = (
    track: RemoteTrack,
    participant: RemoteParticipant,
  ) => {
    if (!participant.isAgent || track.kind !== Track.Kind.Audio) return;

    const element = track.attach() as HTMLMediaElement;
    element.autoplay = true;
    element.style.position = 'fixed';
    element.style.width = '1px';
    element.style.height = '1px';
    element.style.opacity = '0';
    element.style.pointerEvents = 'none';
    element.setAttribute('aria-hidden', 'true');
    document.body.appendChild(element);
    attachedAudio.add(element);

    void element.play().catch(() => {
      callbacks.onNeedsAudioStart?.(true);
    });

    if (!translationServiceFailed) {
      callbacks.onStateChange?.('listening');
    }
  };

  room.on(
    RoomEvent.TrackPublished,
    (publication: RemoteTrackPublication, participant: RemoteParticipant) => {
      if (participant.isAgent && publication.kind === Track.Kind.Audio) {
        publication.setSubscribed(true);
      }
    },
  );

  room.on(
    RoomEvent.TrackSubscribed,
    (
      track: RemoteTrack,
      _publication: RemoteTrackPublication,
      participant: RemoteParticipant,
    ) => {
      attachAgentAudio(track, participant);
    },
  );

  room.on(
    RoomEvent.TrackUnsubscribed,
    (
      track: RemoteTrack,
      _publication: RemoteTrackPublication,
      participant: RemoteParticipant,
    ) => {
      if (!participant.isAgent) return;
      track.detach().forEach((element) => {
        attachedAudio.delete(element as HTMLMediaElement);
        element.remove();
      });
      callbacks.onStateChange?.('waiting');
    },
  );

  room.on(RoomEvent.AudioPlaybackStatusChanged, () => {
    callbacks.onNeedsAudioStart?.(!room.canPlaybackAudio);
  });

  room.on(
    RoomEvent.ParticipantAttributesChanged,
    (_changed: Record<string, string>, participant: Participant) => {
      handleAgentTranslationStatus(participant);
    },
  );

  room.on(
    RoomEvent.DataReceived,
    (
      payload: Uint8Array,
      participant: Participant | undefined,
      _kind,
      topic?: string,
    ) => {
      if (topic !== TRANSLATION_STATUS_TOPIC || !participant?.isAgent) return;
      try {
        const event = JSON.parse(new TextDecoder().decode(payload)) as {
          status?: string;
          message?: string;
        };
        if (event.status === 'error') {
          reportTranslationServiceError(event.message);
        }
      } catch {
        // Ignore malformed status packets; participant attributes provide a
        // second synchronized source of truth for late-joining listeners.
      }
    },
  );

  room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
    subscribeAgentAudio(participant);
    handleAgentTranslationStatus(participant);
  });

  room.on(RoomEvent.Disconnected, () => {
    if (!stopped) {
      callbacks.onStateChange?.('closed');
      callbacks.onError?.('Church translation audio stopped.');
    }
  });

  try {
    await room.connect(connection.url, connection.token, {
      autoSubscribe: false,
    });

    room.remoteParticipants.forEach((participant) => {
      subscribeAgentAudio(participant);
      handleAgentTranslationStatus(participant);
    });

    callbacks.onStateChange?.('waiting');

    try {
      await room.startAudio();
      callbacks.onNeedsAudioStart?.(!room.canPlaybackAudio);
    } catch {
      callbacks.onNeedsAudioStart?.(true);
    }
  } catch (cause) {
    await room.disconnect().catch(() => undefined);
    callbacks.onStateChange?.('closed');
    throw cause;
  }

  return {
    async startAudio() {
      await room.startAudio();
      for (const element of attachedAudio) {
        await element.play();
      }
      callbacks.onNeedsAudioStart?.(false);
    },

    async stop() {
      if (stopped) return;
      stopped = true;
      room.unregisterTextStreamHandler('lk.transcription');
      attachedAudio.forEach((element) => element.remove());
      attachedAudio.clear();
      await room.disconnect();
      callbacks.onStateChange?.('closed');
    },
  };
}


export async function startChurchLiveListener(
  churchId: string,
  callbacks: ChurchLiveListenerCallbacks,
): Promise<ChurchLiveListenerSession> {
  const connection = await getChurchLiveListenerToken(churchId);
  if (!connection) {
    throw new Error('Could not connect to the church translation feed.');
  }

  return startChurchLiveListenerWithConnection(
    connection,
    `church-feed-${churchId}`,
    callbacks,
  );
}

export async function startChurchLiveListenerFromConnection(
  connection: ChurchLiveListenerConnection,
  sourceIdentity: string,
  callbacks: ChurchLiveListenerCallbacks,
): Promise<ChurchLiveListenerSession> {
  return startChurchLiveListenerWithConnection(connection, sourceIdentity, callbacks);
}
