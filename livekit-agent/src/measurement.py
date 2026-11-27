"""Content-free diagnostic samples; these are not billing records."""
import math
import time
import uuid


class TranslationMeasurement:
    def __init__(self, emit, room, church, clock=time.monotonic):
        self.emit = emit
        self.clock = clock
        self.started = clock()
        self.session_id = str(uuid.uuid4())
        self.room = room
        self.church = church
        self.closed = False

    def event(self, event, metrics=None):
        if self.closed:
            return
        payload = {
            "event": "translation_measurement",
            "sample": event,
            "session_id": self.session_id,
            "room": self.room,
            "church_id": self.church,
            "elapsed_seconds": round(max(0, self.clock() - self.started), 3),
            "measurement_only": True,
        }
        if metrics is not None:
            # Never serialize the whole SDK object: it may contain user content.
            payload["metric_type"] = type(metrics).__name__
            payload["metrics"] = {
                key: value for key in (
                    "duration", "audio_duration", "input_tokens", "output_tokens",
                    "total_tokens", "prompt_tokens", "completion_tokens",
                ) if isinstance(value := getattr(metrics, key, None), (float, int))
                and not isinstance(value, bool) and math.isfinite(value) and value >= 0
            }
        try:
            self.emit(payload)
        except Exception:
            pass  # Diagnostics must never interrupt the sermon.
        if event == "closed":
            self.closed = True
