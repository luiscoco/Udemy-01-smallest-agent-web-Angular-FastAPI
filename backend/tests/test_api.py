"""Exercise the real API and service loop; replace only the SDK query boundary."""
from dataclasses import make_dataclass

import pytest
from fastapi.testclient import TestClient

from app import agent_service
from app.config import settings
from app.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def sdk(monkeypatch):
    monkeypatch.setattr(settings, "anthropic_api_key", type(settings.anthropic_api_key)("sk-ant-test-secret"))
    Result = make_dataclass("ResultMessage", ["result", "num_turns", "duration_ms", "total_cost_usd", "is_error"])
    System = make_dataclass("SystemMessage", ["subtype", "data"])
    monkeypatch.setattr(agent_service, "ResultMessage", Result)

    async def fake_query(*, prompt, options):
        assert prompt == prompt.strip()
        assert options.tools == []
        assert options.setting_sources == []
        assert options.strict_mcp_config is True
        assert options.skills == []
        assert options.max_turns == 1
        yield System("init", {"api_key": "sk-ant-test-secret", "cwd": "private"})
        yield Result("**Hello!**", 1, 42, 0.001, False)

    monkeypatch.setattr(agent_service, "query", fake_query)


def test_health():
    response = client.get("/api/health")
    assert response.json() == {"status": "ok", "api_key_configured": True}
    assert "sk-ant" not in response.text


@pytest.mark.parametrize("payload", [{}, {"prompt": ""}, {"prompt": "  "}, {"prompt": "x" * 4001}, {"prompt": None}, {"prompt": 4}])
@pytest.mark.parametrize("path", ["query", "stream"])
def test_validation(payload, path):
    response = client.post(f"/api/agent/{path}", json=payload)
    assert response.status_code == 422
    assert "detail" in response.json()


def test_query():
    response = client.post("/api/agent/query", json={"prompt": " Hello! "})
    assert response.status_code == 200
    assert response.json() == {"result": "**Hello!**", "num_turns": 1, "duration_ms": 42, "total_cost_usd": 0.001, "is_error": False}


def test_stream():
    response = client.post("/api/agent/stream", json={"prompt": "Hello!"})
    assert response.headers["content-type"].startswith("text/event-stream")
    assert response.text.count("event: message") == 2
    assert "ResultMessage" in response.text
    assert "event: done" in response.text
    assert "sk-ant-test-secret" not in response.text
    assert "private" not in response.text


def test_failures_are_safe(monkeypatch):
    async def broken(**kwargs):
        raise RuntimeError("sk-ant-test-secret /private/trace")
        yield
    monkeypatch.setattr(agent_service, "query", broken)
    response = client.post("/api/agent/query", json={"prompt": "Hi"})
    assert response.status_code == 502
    stream = client.post("/api/agent/stream", json={"prompt": "Hi"})
    assert "event: error" in stream.text
    assert "event: done" not in stream.text
    assert "sk-ant-test-secret" not in response.text + stream.text
    assert "/private/trace" not in response.text + stream.text


def test_missing_result(monkeypatch):
    async def empty(**kwargs):
        return
        yield
    monkeypatch.setattr(agent_service, "query", empty)
    assert client.post("/api/agent/query", json={"prompt": "Hi"}).status_code == 502
    assert "event: error" in client.post("/api/agent/stream", json={"prompt": "Hi"}).text


def test_missing_key(monkeypatch):
    monkeypatch.setattr(settings, "anthropic_api_key", type(settings.anthropic_api_key)(""))
    assert client.get("/api/health").json()["api_key_configured"] is False
    assert client.post("/api/agent/query", json={"prompt": "Hi"}).status_code == 503
    assert "event: error" in client.post("/api/agent/stream", json={"prompt": "Hi"}).text


@pytest.mark.parametrize("kind", ["AssistantMessage", "UserMessage"])
def test_redacts_key_before_summary_truncation(monkeypatch, kind):
    Message = make_dataclass(kind, ["content"])
    text = "x" * 150 + "sk-ant-test-secret" + " trailing text"

    async def messages(**kwargs):
        yield Message(text)
        yield agent_service.ResultMessage("Done", 1, 42, None, False)

    monkeypatch.setattr(agent_service, "query", messages)
    response = client.post("/api/agent/stream", json={"prompt": "Hi"})
    assert response.status_code == 200
    assert "sk-ant" not in response.text
    assert "x" * 150 + "[redacted]" in response.text
    assert "event: done" in response.text
