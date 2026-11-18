import json
import logging

from livekit import rtc
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    JobContext,
    TurnHandlingOptions,
    cli,
    inference,
    room_io,
)

logger = logging.getLogger("solapath-sermon-translator")
logging.basicConfig(level=logging.INFO)

AGENT_NAME = "solapath-sermon-translator"


class SermonInterpreter(Agent):
    def __init__(self, source_language: str, target_language: str) -> None:
        source_name = "English" if source_language == "en" else "Spanish"
        target_name = "English" if target_language == "en" else "Spanish"

        super().__init__(
            instructions=(
                f"You are SOLAPATH's live sermon interpreter. "
                f"Translate the main sermon speaker faithfully from {source_name} into {target_name}. "
                "Output only the translation. Never answer the preacher, summarize, explain, comment, "
                "add application, or add doctrinal material that was not spoken. "
                "Preserve names, Scripture references, quotations, numbers, negation, theological terms, "
                "and doctrinal meaning. Translate complete thoughts rather than fragments. "
                "When the speaker pauses briefly inside a sentence, preserve the unfinished thought and "
                "finish the sentence naturally once enough context arrives. "
                "Keep the translation concise enough to stay close to the sermon without dropping content. "
                "Use natural pastoral language appropriate for a church service. "
                "Do not react to audience noise or side speech because your linked participant is the "
                "church's dedicated sermon feed."
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

    target_voice_language = target_language

    ctx.log_context_fields = {
        "room_name": ctx.room.name,
        "church_id": str(metadata.get("churchId", "")),
        "source_language": source_language,
        "target_language": target_language,
        "source_participant": source_identity,
    }

    session = AgentSession(
        stt=inference.STT(
            model="openai/gpt-live-transcribe",
            language=source_language,
            sample_rate=24000,
        ),
        vad=inference.VAD(
            model="silero",
            activation_threshold=0.68,
            min_speech_duration=0.12,
            min_silence_duration=0.45,
            prefix_padding_duration=0.35,
            max_buffered_speech=90.0,
        ),
        llm=inference.LLM(
            model="openai/gpt-5.4-mini",
            extra_kwargs={
                "reasoning_effort": "minimal",
            },
        ),
        tts=inference.TTS(
            model="inworld/inworld-tts-2",
            voice="Diego",
            language=target_voice_language,
            extra_kwargs={
                "speaking_rate": 1.08,
                "delivery_mode": "STABLE",
            },
        ),
        turn_handling=TurnHandlingOptions(
            turn_detection=inference.TurnDetector(),
            endpointing={
                "mode": "fixed",
                "min_delay": 0.75,
                "max_delay": 3.0,
            },
            interruption={
                "enabled": False,
                "discard_audio_if_uninterruptible": False,
            },
            preemptive_generation={
                "enabled": False,
            },
        ),
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


if __name__ == "__main__":
    cli.run_app(server)
