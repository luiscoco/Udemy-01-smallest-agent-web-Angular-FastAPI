"""Run without reload: preserve Windows subprocess support for the SDK CLI."""
import asyncio
import sys

import uvicorn


if __name__ == "__main__":
    # Uvicorn's reload subprocess can select a Windows loop without subprocess
    # support. An explicit Proactor loop and no reload avoid that failure.
    loop_factory = asyncio.ProactorEventLoop if sys.platform == "win32" else asyncio.new_event_loop
    server = uvicorn.Server(uvicorn.Config("app.main:app", host="127.0.0.1", port=8000, loop="none"))
    if sys.version_info >= (3, 11):
        with asyncio.Runner(loop_factory=loop_factory) as runner:
            runner.run(server.serve())
    else:
        # Python 3.10 has no Runner. asyncio.run handles loop cleanup; select
        # Proactor explicitly on Windows so the SDK can launch its CLI.
        if sys.platform == "win32":
            asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
        asyncio.run(server.serve())
