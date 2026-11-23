import unittest
from pair_lifecycle import watch_pair


class PairLifecycleTest(unittest.IsolatedAsyncioTestCase):
    async def run_watch(self, present):
        now = 0
        closed = []

        async def sleep(seconds):
            nonlocal now
            now += seconds

        async def close():
            closed.append(now)

        await watch_pair(lambda: present(now), close, clock=lambda: now, sleep=sleep)
        return closed

    async def test_missing_sender_closes_after_three_minutes(self):
        self.assertEqual(await self.run_watch(lambda _: False), [180])

    async def test_reconnected_sender_resets_grace_period(self):
        self.assertEqual(await self.run_watch(lambda t: t == 175), [355])

    async def test_present_sender_is_limited_to_four_hours(self):
        self.assertEqual(await self.run_watch(lambda _: True), [14400])


if __name__ == '__main__':
    unittest.main()
