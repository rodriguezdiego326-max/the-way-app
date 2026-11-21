import asyncio
import json
import logging

from livekit import rtc
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    AutoSubscribe,
    JobContext,
    cli,
    inference,
    room_io,
)
from livekit.plugins import openai

logger = logging.getLogger("solapath-sermon-translator")
logging.basicConfig(level=logging.INFO)

AGENT_NAME = "solapath-sermon-translator"
TRANSLATION_STATUS_TOPIC = "solapath.translation.status"
TRANSLATION_STATUS_KEY = "solapath.translation.status"
TRANSLATION_MESSAGE_KEY = "solapath.translation.message"
TRANSLATION_ERROR_MESSAGE = (
    "The church feed is connected, but the translation service could not start. "
    "Please try again shortly."
)


async def publish_translation_status(
    ctx: JobContext,
    status: str,
    message: str = "",
) -> None:
    payload = json.dumps({"status": status, "message": message})
    try:
        await ctx.room.local_participant.set_attributes(
            {
                TRANSLATION_STATUS_KEY: status,
                TRANSLATION_MESSAGE_KEY: message,
            }
        )
        await ctx.room.local_participant.publish_data(
            payload,
            reliable=True,
            topic=TRANSLATION_STATUS_TOPIC,
        )
    except Exception:
        logger.exception("failed to publish translation service status")


class SermonInterpreter(Agent):
    def __init__(self, source_language: str, target_language: str) -> None:
        source_name = "English" if source_language == "en" else "Spanish"
        target_name = "English" if target_language == "en" else "Spanish"

        super().__init__(
            instructions=(
                f"You are SOLAPATH's simultaneous live sermon interpreter. "
                f"Continuously interpret the main sermon speaker from {source_name} into {target_name}. "
                "Speak only the translation. Never answer the preacher, acknowledge the preacher, "
                "say filler such as 'okay' or 'mm-hmm', summarize, explain, comment, add application, "
                "or add doctrinal material that was not spoken. "
                "Listen while you are speaking and keep interpreting as new source audio arrives. "
                "Do not treat continued sermon speech as an interruption. "
                "CRITICAL LOW-LATENCY RULE: perform the sermon translation directly in the voice model. "
                "Never delegate ordinary sermon translation to the backend model. Delegation adds delay. "
                "Begin speaking the translation as soon as roughly 3 to 8 meaningful source words form "
                "a coherent clause. Do not wait for sentence-ending punctuation, a complete sentence, "
                "a paragraph, or a long theological thought. Translate clause by clause continuously, "
                "using natural target-language word order, and keep silence between translated clauses "
                "as short as possible. Target an interpreter lag of about 1 to 2 seconds when the source "
                "audio is clear. If the preacher continues without pausing, keep listening while speaking "
                "and continue with the next clause instead of waiting for a turn boundary. "
                "Preserve names, Scripture references, quotations, numbers, negation, theological terms, "
                "and doctrinal meaning. Use concise, natural pastoral language. "
                "If keeping pace requires compression, remove only disfluencies, repeated filler, or "
                "self-corrections; never omit substantive meaning or change doctrine. "
                "Your linked participant is the church's dedicated sermon feed, so ignore side conversation "
                "and perform interpretation only."
            )
        )


server = AgentServer()


@server.rtc_session(agent_name=AGENT_NAME)
async def sermon_translator(ctx: JobContext) -> None:
    metadata = json.loads(ctx.job.metadata or "{}")

    source_language = metadata.get("sourceLanguage", "en")
    target_language = metadata.get("targetLanguage", "es")
    source_identity = metadata.get("sourceParticipantIdentity")

    if source_language not in {"en", "es"}:
        source_language = "en"
    if target_language not in {"en", "es"} or target_language == source_language:
        target_language = "es" if source_language == "en" else "en"
    if not isinstance(source_identity, str) or not source_identity:
        raise RuntimeError("sourceParticipantIdentity is required")

    source_name = "English" if source_language == "en" else "Spanish"
    target_name = "English" if target_language == "en" else "Spanish"

    ctx.log_context_fields = {
        "room_name": ctx.room.name,
        "church_id": str(metadata.get("churchId", "")),
        "source_language": source_language,
        "target_language": target_language,
        "source_participant": source_identity,
    }

    # Keep VAD local so the church translator does not consume LiveKit Inference
    # credits for voice activity detection.
    session_vad = inference.VAD(
        model="silero",
        activation_threshold=0.60,
        min_speech_duration=0.08,
        min_silence_duration=0.28,
        prefix_padding_duration=0.25,
        max_buffered_speech=90.0,
    )
    transcription_vad = inference.VAD(
        model="silero",
        activation_threshold=0.60,
        min_speech_duration=0.08,
        min_silence_duration=0.28,
        prefix_padding_duration=0.25,
        max_buffered_speech=90.0,
    )

    session = AgentSession(
        # Direct OpenAI plugin: OpenAI bills this transcription stream directly
        # instead of routing it through LiveKit Inference credits.
        stt=openai.STT(
            model="gpt-live-transcribe",
            language=source_language,
            use_realtime=True,
            vad=transcription_vad,
        ),
        vad=session_vad,
        # Direct OpenAI GPT-Live plugin. This preserves the full-duplex behavior
        # that lets the interpreter listen while it speaks, but usage is billed
        # to OPENAI_API_KEY rather than the LiveKit Inference allowance.
        llm=openai.realtime.GPTLiveModel(
            model="gpt-live-1",
            voice="cedar",
            responses_options={
                "model": "gpt-5.6-luna",
                "instructions": (
                    f"The voice model should normally translate the sermon directly from "
                    f"{source_name} into {target_name} without delegating. If delegation still "
                    "occurs, return only a very short faithful translation of the pending clause "
                    "immediately, with no explanation, commentary, or added doctrine."
                ),
                "tool_choice": "none",
                "reasoning": {"effort": "none"},
                "text": {"verbosity": "low"},
            },
        ),
    )

    # RoomOptions pins this session to the church ingress participant.
    # Connect first so RoomIO can safely resolve the agent's local participant.
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    await publish_translation_status(ctx, "starting")

    @session.on("error")
    def on_session_error(event) -> None:
        if getattr(event.error, "recoverable", False):
            return
        logger.error("unrecoverable translation service error: %s", event.error)
        asyncio.create_task(
            publish_translation_status(
                ctx,
                "error",
                TRANSLATION_ERROR_MESSAGE,
            )
        )

    @session.on("user_input_transcribed")
    def on_source_transcript(event) -> None:
        if event.is_final:
            logger.info(
                "source transcript committed",
                extra={"transcript_chars": len(event.transcript or "")},
            )

    await session.start(
        agent=SermonInterpreter(
            source_language=source_language,
            target_language=target_language,
        ),
        room=ctx.room,
        room_options=room_io.RoomOptions(
            participant_identity=source_identity,
            participant_kinds=[
                rtc.ParticipantKind.PARTICIPANT_KIND_INGRESS,
            ],
            text_input=False,
            video_input=False,
            audio_input=room_io.AudioInputOptions(
                auto_gain_control=False,
            ),
            audio_output=True,
        ),
    )

    await publish_translation_status(ctx, "ready")


if __name__ == "__main__":
    cli.run_app(server)
