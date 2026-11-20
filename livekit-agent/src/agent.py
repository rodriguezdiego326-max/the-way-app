import json
import logging

from livekit import rtc
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    AutoSubscribe,
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
                f"You are SOLAPATH's simultaneous live sermon interpreter. "
                f"Continuously interpret the main sermon speaker from {source_name} into {target_name}. "
                "Speak only the translation. Never answer the preacher, acknowledge the preacher, "
                "say filler such as 'okay' or 'mm-hmm', summarize, explain, comment, add application, "
                "or add doctrinal material that was not spoken. "
                "Listen while you are speaking and keep interpreting as new source audio arrives. "
                "Do not treat continued sermon speech as an interruption. "
                "Begin translating as soon as a short coherent phrase is understood; do not wait for "
                "a complete paragraph or long thought. Aim to stay within a few seconds of the source. "
                "Preserve names, Scripture references, quotations, numbers, negation, theological terms, "
                "and doctrinal meaning. Use concise, natural pastoral language. "
                "If keeping pace requires compression, remove only disfluencies or repeated filler; "
                "never omit substantive meaning. "
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

    session = AgentSession(
        # Keep a dedicated STT stream so SOLAPATH can continue showing the
        # original sermon captions in realtime.
        stt=inference.STT(
            model="openai/gpt-live-transcribe",
            language=source_language,
            sample_rate=24000,
        ),
        vad=inference.VAD(
            model="silero",
            activation_threshold=0.60,
            min_speech_duration=0.08,
            min_silence_duration=0.28,
            prefix_padding_duration=0.25,
            max_buffered_speech=90.0,
        ),
        # Full-duplex speech-to-speech interpretation. Unlike the previous
        # STT -> LLM -> TTS conversational pipeline, GPT-Live can listen while
        # it speaks, so continuous sermon audio does not cause later phrases
        # to be skipped while translated audio is playing.
        llm=inference.DuplexModel(
            model="openai/gpt-live-1",
            voice="cedar",
            extra_kwargs={
                "responses_options": {
                    "model": "gpt-5.6-luna",
                    "instructions": (
                        f"If any sermon translation work is delegated, translate faithfully "
                        f"from {source_name} into {target_name}. Return only the translation, "
                        "with no explanation, commentary, or added doctrine."
                    ),
                    "tool_choice": "none",
                    "reasoning": {"effort": "none"},
                    "text": {"verbosity": "low"},
                },
            },
        ),
        # We need VAD for the parallel caption STT, but source sermon speech
        # must never cut off the interpreter's output.
        turn_handling=TurnHandlingOptions(
            interruption={
                "enabled": False,
                "discard_audio_if_uninterruptible": False,
            },
        ),
    )

    # RoomOptions pins this session to the church ingress participant.
    # Connect first so RoomIO can safely resolve the agent's local participant.
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

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
