import { supabase } from "@/lib/supabase";
import {
  churchStreamErrorCode,
  withStreamDeadline,
} from "@/lib/churchStreamErrors";
export interface PairState {
  revision: number;
  canManage: boolean;
  exists: boolean;
  paired: boolean;
  hasSession: boolean;
  canListen: boolean;
  expiresAt: number | null;
  sourceLanguage: "en" | "es";
  error: string | null;
}
export interface PairConnection {
  url: string;
  token: string;
  roomName: string;
  sourceIdentity: string;
}
export type PairResponse = PairState & {
  code?: string;
  proof?: string;
  connection?: PairConnection;
};
export async function audioPairRequest(
  churchId: string,
  action:
    | "get"
    | "create"
    | "pair"
    | "stop"
    | "publisher_token"
    | "listener_token",
  values: Record<string, unknown> = {},
): Promise<PairResponse> {
  const result = await withStreamDeadline(
    supabase.functions.invoke<PairResponse>("church-audio-pair", {
      body: { churchId, action, ...values },
    }),
    async () => undefined,
    60000,
  );
  if (result.error)
    throw new Error(
      (await churchStreamErrorCode(result.error)) ?? "pair_update_failed",
    );
  if (!result.data) throw new Error("pair_update_failed");
  // Status responses may contain a recoverable source error; only an error-only response rejects.
  if (result.data.error && typeof result.data.revision !== "number")
    throw new Error(result.data.error);
  return result.data;
}
export function pairingMessage(code: string) {
  switch (code) {
    case "pair_expired":
      return "This pairing expired. Stop the connection and generate a new code on the computer.";
    case "pair_invalid":
      return "That code does not match this church’s sender. Check the code and try again.";
    case "sender_not_authorized":
      return "This browser is not the paired sender. Generate a new pairing code.";
    case "source_changed":
    case "operation_in_progress":
      return "The connection changed. Refresh its status before trying again.";
    case "stop_before_editing":
      return "Stop the current paired connection before creating another.";
    case "translation_agent_failed":
      return "The translation service could not start. Generate a new pairing code.";
    case "stream_cleanup_failed":
      return "The connection could not be stopped completely. Try Stop connection again.";
    case "leadership_required":
      return "Only authorized church leaders can pair an audio sender.";
    case "feed_not_ready":
      return "No sender audio is arriving yet. Start sending audio on the computer.";
    case "NotAllowedError":
      return "Microphone access was denied. Allow access in your browser settings.";
    case "NotFoundError":
      return "No audio input was found. Connect a microphone or USB audio interface.";
    case "NotReadableError":
      return "This audio input is unavailable or being used by another application.";
    case "youtube_connection_timeout":
    case "sender_timeout":
      return "The audio connection timed out. Check your internet connection and try again.";
    default:
      return "The audio connection could not be completed. Refresh its status and try again.";
  }
}
