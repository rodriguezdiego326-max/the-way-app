import {
  AudioPresets,
  Room,
  RoomEvent,
  Track,
  createLocalAudioTrack,
  type LocalAudioTrack,
} from "livekit-client";
import type { PairConnection } from "./churchAudioPair";

export function createChurchAudioSender(
  onState: (
    state: "connecting" | "sending" | "reconnecting" | "closed",
  ) => void,
  onLevel: (level: number) => void,
) {
  const room = new Room({ adaptiveStream: false, dynacast: false });
  let track: LocalAudioTrack | undefined;
  let stopped = false;
  let context: AudioContext | undefined;
  let timer: ReturnType<typeof setInterval> | undefined;
  const state = (
    value: "connecting" | "sending" | "reconnecting" | "closed",
  ) => {
    if (!stopped) onState(value);
  };
  room.on(RoomEvent.Reconnecting, () => state("reconnecting"));
  room.on(RoomEvent.Reconnected, () => state("sending"));
  const stop = async () => {
    if (stopped) return;
    stopped = true;
    clearInterval(timer);
    track?.stop();
    onLevel(0);
    await context?.close().catch(() => undefined);
    await room.disconnect().catch(() => undefined);
    onState("closed");
  };
  room.on(RoomEvent.Disconnected, () => {
    void stop();
  });
  return {
    stop,
    async start(connection: PairConnection, deviceId: string) {
      state("connecting");
      let deadline: ReturnType<typeof setTimeout> | undefined;
      const connect = async () => {
        track = await createLocalAudioTrack({
          deviceId: deviceId ? { exact: deviceId } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
          channelCount: 1,
        });
        if (stopped) {
          track.stop();
          return;
        }
        track.mediaStreamTrack.addEventListener("ended", () => {
          void stop();
        });
        // The meter is optional. Failure must not interrupt a working media publication.
        try {
          context = new AudioContext();
          await context.resume();
          if (stopped) {
            await context.close().catch(() => undefined);
            track.stop();
            return;
          }
          const source = context.createMediaStreamSource(
            new MediaStream([track.mediaStreamTrack]),
          );
          const analyser = context.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          const samples = new Uint8Array(analyser.fftSize);
          timer = setInterval(() => {
            analyser.getByteTimeDomainData(samples);
            let energy = 0;
            for (const sample of samples) energy += ((sample - 128) / 128) ** 2;
            onLevel(Math.min(1, Math.sqrt(energy / samples.length) * 4));
          }, 100);
        } catch {
          await context?.close().catch(() => undefined);
          context = undefined;
        }
        if (stopped) {
          track.stop();
          return;
        }
        await room.connect(connection.url, connection.token, {
          autoSubscribe: false,
        });
        if (stopped) {
          await room.disconnect();
          return;
        }
        await room.localParticipant.publishTrack(track, {
          source: Track.Source.Microphone,
          audioPreset: AudioPresets.speech,
          dtx: true,
        });
        if (stopped) {
          track.stop();
          await room.disconnect();
          return;
        }
        state("sending");
      };
      try {
        await Promise.race([
          connect(),
          new Promise<never>((_, reject) => {
            deadline = setTimeout(
              () => reject(new Error("sender_timeout")),
              45000,
            );
          }),
        ]);
      } catch (error) {
        await stop();
        throw error;
      } finally {
        clearTimeout(deadline);
      }
    },
  };
}
