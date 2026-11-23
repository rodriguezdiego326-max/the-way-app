"""Lifecycle for paired browser rooms; regular encoder rooms are unaffected."""
import asyncio
import time


async def watch_pair(source_present, close_room, *, clock=time.monotonic, sleep=asyncio.sleep):
    started = last_seen = clock()
    while True:
        await sleep(5)
        now = clock()
        if source_present():
            last_seen = now
        if now - last_seen >= 180 or now - started >= 4 * 60 * 60:
            await close_room()
            return
