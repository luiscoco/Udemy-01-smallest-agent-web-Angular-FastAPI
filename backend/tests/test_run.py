"""Check launcher compatibility without starting a server or changing loops."""
import asyncio
from pathlib import Path
import runpy
import sys
from unittest.mock import MagicMock

import pytest
import uvicorn


@pytest.mark.parametrize("version", [(3, 10), (3, 11)])
@pytest.mark.parametrize("platform", ["win32", "linux"])
def test_launcher_selects_supported_loop_api(monkeypatch, version, platform):
    server = MagicMock()
    runner = MagicMock()
    run = MagicMock()
    set_policy = MagicMock()
    policy_factory = MagicMock()
    proactor = MagicMock()
    with monkeypatch.context() as patch:
        patch.setattr(sys, "version_info", version)
        patch.setattr(sys, "platform", platform)
        patch.setattr(uvicorn, "Config", MagicMock())
        patch.setattr(uvicorn, "Server", MagicMock(return_value=server))
        patch.setattr(asyncio, "ProactorEventLoop", proactor, raising=False)
        patch.setattr(asyncio, "run", run)
        patch.setattr(asyncio, "set_event_loop_policy", set_policy)
        patch.setattr(asyncio, "WindowsProactorEventLoopPolicy", policy_factory, raising=False)
        if version >= (3, 11):
            patch.setattr(asyncio, "Runner", runner)
        else:
            # An accidental Runner reference must fail just as on Python 3.10.
            patch.delattr(asyncio, "Runner")
        runpy.run_path(str(Path(__file__).resolve().parents[1] / "run.py"), run_name="__main__")

    if version >= (3, 11):
        runner.assert_called_once_with(loop_factory=proactor if platform == "win32" else asyncio.new_event_loop)
        runner.return_value.__enter__.return_value.run.assert_called_once_with(server.serve.return_value)
        run.assert_not_called()
        set_policy.assert_not_called()
    else:
        run.assert_called_once_with(server.serve.return_value)
        if platform == "win32":
            set_policy.assert_called_once_with(policy_factory.return_value)
        else:
            set_policy.assert_not_called()
