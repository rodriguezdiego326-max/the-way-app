import unittest
from types import SimpleNamespace
from measurement import TranslationMeasurement


class MeasurementTests(unittest.TestCase):
    def test_elapsed_and_metric_whitelist(self):
        samples = []
        now = [10]
        meter = TranslationMeasurement(samples.append, "room", "church", lambda: now[0])
        meter.event("started")
        now[0] = 40
        meter.event("metrics", SimpleNamespace(input_tokens=10, output_tokens=20,
                    audio_duration=float("nan"), prompt="private sermon", transcript="private"))
        self.assertEqual(samples[-1]["elapsed_seconds"], 30)
        self.assertEqual(samples[-1]["metrics"], {"input_tokens": 10, "output_tokens": 20})
        self.assertNotIn("private", str(samples))
        meter.event("closed")
        meter.event("closed")
        self.assertEqual(len(samples), 3)

    def test_logging_failure_does_not_break_translation(self):
        def fail(_):
            raise RuntimeError("offline")
        TranslationMeasurement(fail, "room", "church").event("started")


if __name__ == "__main__":
    unittest.main()
