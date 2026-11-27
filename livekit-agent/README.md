# SOLAPATH Sermon Translator Agent

This LiveKit Agent listens only to the church's dedicated Ingress participant and publishes translated sermon audio back into the private SOLAPATH room.

## Pipeline

- Source: church mixer / OBS via LiveKit Ingress
- STT: direct OpenAI `gpt-live-transcribe`.
- Translation/audio: direct OpenAI `gpt-live-1`, voice `cedar`.
- Optional delegation backend: `gpt-5.6-luna`.

The agent requires `OPENAI_API_KEY` in its deployment secrets. OpenAI bills these calls directly; LiveKit Inference credits do not cover them. LiveKit hosting and transport are separate.

Content-free `translation_measurement` JSON logs record agent-instance runtime and available SDK metric counters. These are measurement-only diagnostics, not invoices; reconcile them against provider usage before pricing. A missing close log indicates incomplete telemetry. No audio, transcript, source URL, token, or API key is included.

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
