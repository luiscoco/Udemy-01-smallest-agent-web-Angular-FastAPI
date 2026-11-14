"""The Lesson 0 loop lives here; this is the only module importing the SDK."""
import os

from claude_agent_sdk import ClaudeAgentOptions, ResultMessage, query

from .config import settings

os.environ["ENABLE_CLAUDEAI_MCP_SERVERS"] = "false"


def agent_options() -> ClaudeAgentOptions:
    # Verified against the installed SDK: tools=[] removes built-ins entirely.
    # allowed_tools=[] alone only clears auto-approvals and is NOT a tool ban.
    # Also isolate filesystem settings, skills and external MCP configurations.
    return ClaudeAgentOptions(
        tools=[], allowed_tools=[], permission_mode="dontAsk",
        setting_sources=[], skills=[], mcp_servers={}, strict_mcp_config=True,
        max_turns=settings.agent_max_turns,
        model=settings.claude_model or None,
        system_prompt=settings.agent_system_prompt or None,
        env={"ANTHROPIC_API_KEY": settings.anthropic_api_key.get_secret_value(),
             "ENABLE_CLAUDEAI_MCP_SERVERS": "false"},
    )


def redact(text: str) -> str:
    key = settings.anthropic_api_key.get_secret_value()
    return text.replace(key, "[redacted]") if key else text


def result_data(message: ResultMessage) -> dict:
    return {
        "result": redact(message.result or ""),
        "num_turns": message.num_turns,
        "duration_ms": message.duration_ms,
        "total_cost_usd": message.total_cost_usd,
        "is_error": message.is_error,
    }


async def run_agent(prompt: str) -> dict:
    # Same query -> async loop -> ResultMessage pattern as the terminal lesson.
    async for message in query(prompt=prompt, options=agent_options()):
        if isinstance(message, ResultMessage):
            return result_data(message)
    raise RuntimeError("Agent ended without a result")


async def stream_agent(prompt: str):
    found_result = False
    async for message in query(prompt=prompt, options=agent_options()):
        kind = type(message).__name__
        # Explicit allowlist: never serialize raw SDK objects, environment,
        # filesystem paths, session IDs, tool arguments or thinking blocks.
        if isinstance(message, ResultMessage):
            found_result = True
            data = result_data(message)
            summary = "Agent finished with an error" if message.is_error else "Final answer received"
        elif kind in ("AssistantMessage", "UserMessage"):
            content = getattr(message, "content", [])
            text = content if isinstance(content, str) else " ".join(
                block.text for block in content if hasattr(block, "text")
            )
            safe_text = redact(text)
            data = {"text": safe_text, "model": getattr(message, "model", None)}
            summary = safe_text[:160] or "Message received"
        elif kind == "SystemMessage":
            subtype = str(getattr(message, "subtype", "system"))
            data = {"subtype": subtype}
            summary = "Agent initialized" if subtype == "init" else "System update"
        else:
            data = {}
            summary = "SDK lifecycle message received"
        yield {"type": kind, "summary": summary, "data": data}
    if not found_result:
        raise RuntimeError("Agent ended without a result")
