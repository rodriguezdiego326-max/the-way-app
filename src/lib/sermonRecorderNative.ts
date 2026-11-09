import { registerPlugin } from '@capacitor/core';

export type SermonRecorderState = 'idle' | 'recording' | 'paused';

export interface SermonRecorderSnapshot {
  state: SermonRecorderState;
  elapsedMs: number;
  interrupted: boolean;
  startedAt: string;
}

export interface FinishedSermonRecording {
  fileName: string;
  durationMs: number;
  startedAt: string;
  interrupted: boolean;
}

export interface SermonPlaybackSnapshot {
  loaded: boolean;
  playing: boolean;
  positionMs: number;
  durationMs: number;
}

export interface SermonRecorderPlugin {
  start(): Promise<SermonRecorderSnapshot>;
  pause(): Promise<SermonRecorderSnapshot>;
  resume(): Promise<SermonRecorderSnapshot>;
  finish(): Promise<FinishedSermonRecording>;
  discard(): Promise<void>;
  status(): Promise<SermonRecorderSnapshot>;
  playRecording(options: { fileName: string }): Promise<SermonPlaybackSnapshot>;
  togglePlayback(): Promise<SermonPlaybackSnapshot>;
  seekPlayback(options: { positionMs: number }): Promise<SermonPlaybackSnapshot>;
  stopPlayback(): Promise<void>;
  playbackStatus(): Promise<SermonPlaybackSnapshot>;
  deleteRecording(options: { fileName: string }): Promise<void>;
  prepareTranscriptionParts(options: { fileName: string }): Promise<PreparedTranscriptionParts>;
  cleanupTranscriptionParts(options: { token: string }): Promise<void>;
  uploadTranscriptionPart(options: TranscriptionPartUploadOptions): Promise<TranscriptionPartUploadResult>;
}

export interface TranscriptionAudioPart {
  partIndex: number;
  startMs: number;
  endMs: number;
  sizeBytes: number;
}

export interface TranscriptionPartUploadOptions {
  token: string;
  partIndex: number;
  uploadUrl: string;
  accessToken: string;
  apiKey: string;
}

export interface TranscriptionPartUploadResult {
  success: boolean;
  httpStatus: number;
  uploadedBytes: number;
}

export interface PreparedTranscriptionParts {
  token: string;
  parts: TranscriptionAudioPart[];
}

export const sermonRecorderNative = registerPlugin<SermonRecorderPlugin>('SermonRecorder');
