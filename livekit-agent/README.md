# SOLAPATH Sermon Translator Agent

This LiveKit Agent listens only to the church's dedicated Ingress participant and publishes translated sermon audio back into the private SOLAPATH room.

## Pipeline

- Source: church mixer / OBS via LiveKit Ingress
- STT: LiveKit Inference `openai/gpt-live-transcribe`
- Turn detection: Silero VAD + LiveKit semantic turn detector
- Translation: LiveKit Inference `openai/gpt-5.4-mini`
- TTS: LiveKit Inference `inworld/inworld-tts-2`
- Voice: `Diego` (stable male voice)
- Interruptions: disabled so translated sentences finish
- Preemptive generation: disabled so incomplete sermon thoughts are not spoken early

The agent uses LiveKit Inference, so no separate OpenAI or Inworld API key is required.

## Dispatch metadata

The SOLAPATH backend dispatches the agent with JSON metadata:

```json
{
  "churchId": "<church uuid>",
  "sourceLanguage": "en",
  "targetLanguage": "es",
  "sourceParticipantIdentity": "church-feed-<church uuid>"
}
```

The `sourceParticipantIdentity` prevents the translator from listening to member devices in the room.

## Deployment

Deploy this directory to the same LiveKit Cloud project that provides Ingress:

```bash
lk agent create --region us-east .
```

LiveKit Cloud injects its own runtime credentials. Do not commit API keys or secrets.

<!-- deployment-trigger: 2026-11-18 -->
