"""Pruebas del servicio de envío (sin red ni credenciales):
    python3 -m unittest scripts.test_garmin_strength
(Fuera de api/ para que Vercel no lo tome por una función.)"""
import unittest

from api import garmin_strength as g

GOOD = {
    "workoutName": "Prueba",
    "sportType": {"sportTypeKey": "strength_training"},
    "workoutSegments": [{"workoutSteps": [{"type": "ExecutableStepDTO"}]}],
}


class ValidatePayload(unittest.TestCase):
    def test_accepts_good(self):
        self.assertIsNone(g.validate_payload(GOOD))

    def test_rejects_non_strength(self):
        bad = {**GOOD, "sportType": {"sportTypeKey": "cycling"}}
        self.assertIn("fuerza", g.validate_payload(bad))

    def test_rejects_empty_and_huge(self):
        self.assertIsNotNone(g.validate_payload({**GOOD, "workoutSegments": []}))
        huge = {**GOOD, "workoutSegments": [{"workoutSteps": [{}] * 201}]}
        self.assertIsNotNone(g.validate_payload(huge))
        self.assertIsNotNone(g.validate_payload("x"))


class RateLimit(unittest.TestCase):
    def test_blocks_second_send_within_window(self):
        g._last_send_by_user.clear()
        self.assertEqual(g.rate_limited("u", now=1000.0), 0.0)
        self.assertGreater(g.rate_limited("u", now=1005.0), 0.0)
        self.assertEqual(g.rate_limited("u", now=1100.0), 0.0)


class Disabled(unittest.TestCase):
    def test_disabled_by_default(self):
        import os
        os.environ.pop("GARMIN_SEND_ENABLED", None)
        self.assertFalse(g.enabled())


if __name__ == "__main__":
    unittest.main()
