import {
  Room,
  RoomEvent,
  Track,
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

export async function startChurchLiveListener(
  churchId: string,
  callbacks: ChurchLiveListenerCallbacks,
): Promise<ChurchLiveListenerSession> {
  callbacks.onStateChange?.('connecting');

  const connection = await getChurchLiveListenerToken(churchId);
  if (!connection) {
    throw new Error('Could not connect to the church translation feed.');
  }

  const room = new Room({
    adaptiveStream: false,
    dynacast: false,
  });

  const sourceIdentity = `church-feed-${churchId}`;
  const sourceTurns = new Map<string, TranscriptTurn>();
  const translationTurns = new Map<string, TranscriptTurn>();
  let nextSourceOrder = 0;
  let nextTranslationOrder = 0;
  const attachedAudio = new Set<HTMLMediaElement>();
  let stopped = false;

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

    callbacks.onStateChange?.('listening');
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

  room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
    subscribeAgentAudio(participant);
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
