# The Smallest Agent · Web Edition

A small enterprise-style Angular and FastAPI application for Udemy students building their first AI agent. It keeps the familiar Lesson 0 Python loop recognizable while teaching typed HTTP APIs, request validation, server-side configuration, safe tool configuration, Server-Sent Events (SSE), Angular signals, sanitized Markdown, and a live SDK message inspector. This is a local teaching application; authentication is an exercise before sharing it with other users.

```text
Browser -> Angular (AgentService) -> FastAPI (/api) -> Claude Agent SDK -> Claude
                 timeline + answer <--- SSE <--- SDK messages <------------+
```

## Exact technology versions

| Package / runtime | Version |
| --- | --- |
| Python | 3.10+; verified here with 3.14.5 |
| Node.js | 24 LTS >=24.15 or 26; verified here with 24.22.2 |
| npm | verified here with 11.19.1 |
| claude-agent-sdk | 0.2.179 |
| FastAPI | 0.162.2 |
| uvicorn[standard] | 0.54.0 |
| Pydantic | 2.14.3 |
| pydantic-settings | 2.16.2 |
| pytest | 9.2.0 |
| httpx | 0.28.1 |
| Angular core, common, compiler, forms, router, platform-browser, animations, compiler-cli | 22.2.5 |
| Angular CLI, build, CDK, Material | 22.2.6 |
| TypeScript | 6.0.3 |
| RxJS | 7.8.2 |
| marked | 18.1.3 |
| highlight.js | 11.12.0 |
| Vitest | 5.0.0 |
| jsdom | 30.0.0 |
| tslib | 2.9.1 |
| Prettier | 3.8.1 |

Angular 22's compiler supports TypeScript `>=6.0 <6.1`. Do not install TypeScript 7.x even if npm labels it `latest`. All direct npm dependencies use exact versions, and `package-lock.json` records the resolved dependency tree. The Angular app uses standalone components, zoneless change detection (no zone.js), signals, `@if` / `@for`, and the CLI's Vitest test builder.

References: [Angular version compatibility](https://angular.dev/reference/versions) and [Anthropic's Python Agent SDK](https://github.com/anthropics/claude-agent-sdk-python). The installed package sources were also inspected for the exact API used in this project.

## Project files

The interface follows the course presentation in the [reference application](https://github.com/luiscoco/Udemy-Claude-Agent-SDK-lesson01-app), adapted to this Python/Angular lesson: a blue-and-orange theme, large typography, numbered cards and the course astronaut. Desktop body text is 21px, mobile text is 19px, and helper text is at least 16px. The theme toggle covers the lab and all lesson content.

The navigation provides five hash-linked sections: **Application lab**, **What you will learn**, **How to run**, **Architecture & workflow**, and **Code walkthrough**. For example, open `http://localhost:4200/#setup` for setup instructions. Browser back/forward works, and navigating to a lesson section preserves the lab's prompt, result and active request. The supporting pages describe this application's actual Python service, native SSE and Angular signals. The reference's TypeScript server and file-discovery exercise are not used. See `ASSETS.md` for the illustration source, and `BUILD-PROMPT.txt` for the updated build specification.

Cards use pale blue, lilac, mint and peach surfaces with dark-theme counterparts. Setup commands, Python/TypeScript excerpts, `.env` examples, inspector JSON and supported Markdown code fences have colored syntax tokens. Highlight.js runs locally with just six grammars, and Angular continues sanitizing the rendered HTML. Unknown languages appear as escaped plain text.

The **Architecture & workflow** section includes a UML sequence diagram with five lifelines, numbered calls, streamed returns, a message loop and success/error alternatives. Its labels keep their size on mobile in a horizontally scrollable, keyboard-focusable region. Download the [SVG](frontend/public/workflow.svg) or the [editable PlantUML source](frontend/public/workflow.puml). Regenerate both assets from `frontend` with `python scripts/generate-workflow.py`; no hosted renderer is needed.

Directly below that diagram, all **16 UML interactions** have matching numbered cards with colored source excerpts, filenames and a “How this code explains step N” paragraph. `frontend/src/app/workflow-steps.ts` contains the mapping. Provider transport is identified as SDK-managed and connected to the actual `query()` boundary, rather than inventing application HTTP code. These step explanations complement the separate Code walkthrough section.

| File | Responsibility |
| --- | --- |
| `backend/app/agent_service.py` | The only SDK import; query loop, safe options and message mapping |
| `backend/app/main.py` | FastAPI routes, native SSE, CORS and safe errors |
| `backend/app/schemas.py` | Trimmed prompt validation and result schema |
| `backend/app/config.py` | Environment / backend `.env` settings |
| `backend/run.py` | Cross-platform server startup without reload |
| `backend/tests/test_api.py` | API tests with the SDK query boundary mocked |
| `backend/requirements.txt`, `.env.example` | Exact Python versions and configuration template |
| `frontend/src/app/agent.service.ts` | Typed HTTP calls and POST SSE parsing |
| `frontend/src/app/app.ts`, `app.html` | Signals, prompt controls, answer, health and theme |
| `frontend/src/app/stream-inspector.ts` | Message timeline and expandable safe JSON |
| `frontend/src/styles.scss` | Custom Material 3 blue theme, orange emphasis and responsive light/dark layout |
| `frontend/src/app/lesson-content.ts` | Learning goals, setup, architecture and source walkthrough |
| `frontend/src/app/workflow-steps.ts` | One source excerpt and explanation for each of the 16 UML steps |
| `frontend/src/app/code-block.ts` | Reusable local syntax highlighting with sanitized output |
| `frontend/public/workflow.svg`, `workflow.puml` | UML workflow and editable source |
| `frontend/scripts/generate-workflow.py` | Regenerates both UML assets locally |
| `frontend/public/astronaut.png`, `ASSETS.md` | Local course illustration and source attribution |
| `frontend/proxy.conf.json` | Development `/api` proxy to port 8000 |
| `frontend/src/app/*.spec.ts` | Service, SSE parsing and main component tests |

## Part 1 · Configure and run

Install Python 3.10+ (3.14 recommended), Node 24 LTS >=24.15 or Node 26, and obtain an API key beginning with `sk-ant-` from [Claude Console](https://platform.claude.com). Run the commands from this project folder. The SDK includes its Claude Code CLI; an existing Claude subscription is not needed for this API-key lesson.

### Windows PowerShell — backend

```powershell
python --version
node --version
npm --version
python -m venv .venv
.\.venv\Scripts\Activate.ps1
cd backend
python -m pip install -r requirements.txt
Copy-Item .env.example .env
notepad .env
# Replace the placeholder ANTHROPIC_API_KEY, save, then:
python run.py
```

Open http://localhost:8000/docs. Keep the terminal running.

### macOS / Linux — backend

```bash
python3 --version
node --version
npm --version
python3 -m venv .venv
source .venv/bin/activate
cd backend
python -m pip install -r requirements.txt
cp .env.example .env
# Edit .env and replace the ANTHROPIC_API_KEY placeholder.
python run.py
```

### Frontend — a second terminal, either platform

```text
cd frontend
npm install
npm start
```

Open http://localhost:4200. The frontend proxies `/api` to `http://127.0.0.1:8000`; no key is sent from the browser. Use **Run agent** or **Ctrl+Enter**. Stream mode shows each SDK message; Simple mode returns only the final answer. Expand a timeline row to inspect its safe JSON. Copy the answer or toggle the remembered theme in the header.

> **Keep the API key private:** treat it like a password. Store it only in `backend/.env` (or a server environment variable), never commit it, and never put it in the frontend. `.gitignore` excludes `.env`. The health endpoint returns only a boolean. Do not paste a key into a prompt.

Optional backend settings (restart the backend after changing `.env`):

| Variable | Default / meaning |
| --- | --- |
| `ANTHROPIC_API_KEY` | Required for an actual agent request |
| `CLAUDE_MODEL` | Empty: SDK default model |
| `AGENT_SYSTEM_PROMPT` | Empty: no additional system prompt |
| `AGENT_MAX_TURNS` | `1`, integer from 1 to 10 |
| `CORS_ORIGINS` | JSON array `["http://localhost:4200"]` |

Environment variables override `.env`. The `.env` path is resolved relative to the backend folder, so it does not depend on the terminal's current directory.

## Part 2 · How the app was built

### 1. Begin with the terminal agent

```python
import asyncio
import os
from claude_agent_sdk import query, ResultMessage

os.environ["ENABLE_CLAUDEAI_MCP_SERVERS"] = "false"

async def main():
    async for message in query(prompt="Hello world!"):
        if isinstance(message, ResultMessage):
            print(message.result)

asyncio.run(main())
```

The web service keeps the same core:

```python
async def run_agent(prompt: str) -> dict:
    async for message in query(prompt=prompt, options=agent_options()):
        if isinstance(message, ResultMessage):
            return result_data(message)
    raise RuntimeError("Agent ended without a result")
```

| Terminal lesson | Web application |
| --- | --- |
| `"Hello world!"` | Validated browser prompt |
| `query(prompt=...)` | Same function with server-controlled options |
| `async for message` | Same async iterator |
| `isinstance(message, ResultMessage)` | Same final-message check |
| `print(message.result)` | Return result, turns, duration, cost and error flag |
| `asyncio.run(main())` | FastAPI owns the event loop |

### 2. Configure the agent for a web audience

The option names and semantics were inspected in installed `claude-agent-sdk==0.2.179`, rather than inferred from the terminal example:

```python
ClaudeAgentOptions(
    tools=[],                     # Remove all built-in tools.
    allowed_tools=[],             # No automatic approvals (alone this is NOT a tool ban).
    permission_mode="dontAsk",    # Deny unapproved tool permission requests.
    setting_sources=[],           # Do not inherit filesystem settings or CLAUDE.md.
    skills=[],                    # Disable discovered skills.
    mcp_servers={},
    strict_mcp_config=True,        # Ignore other MCP configurations.
    max_turns=settings.agent_max_turns,
    model=settings.claude_model or None,
    system_prompt=settings.agent_system_prompt or None,
)
```

The actual function also passes the server-side API key into the CLI subprocess environment. Bash, file access, edits and fetch tools are unavailable. The service never serializes raw SDK objects: system events expose only their subtype, conversational messages expose text/model, and results expose the five response fields. Paths, environment, thinking blocks, session identifiers and tool arguments are excluded. Exact occurrences of the configured key are redacted from public text.

### 3. Add a small typed API

`PromptRequest` trims input before enforcing 1–4000 characters. Invalid input returns HTTP 422 with clean JSON that excludes the submitted values. `/api/health` reports readiness and key configuration, `/api/agent/query` returns `AgentResponse`, and `/api/agent/stream` yields the message sequence. Query failures return a generic 502; missing credentials return 503. Tracebacks and SDK exception text are never sent to clients.

### 4. Stream with FastAPI's native SSE

Inspection of installed FastAPI 0.162.2 confirmed `fastapi.sse.EventSourceResponse` and `ServerSentEvent`. No extra SSE library is added by this app (the SDK's transitive MCP dependencies may install one).

```python
@app.post("/api/agent/stream", response_class=EventSourceResponse)
async def stream(body: PromptRequest):
    async for message in stream_agent(body.prompt):
        yield ServerSentEvent(event="message", data=message)
    yield ServerSentEvent(event="done", data={"status": "complete"})
```

The production route also catches failures and emits `error` instead of `done`. Native SSE JSON-encodes `data` once. SDK streaming here means one event per SDK message, not a token-by-token text animation.

### 5. Read POST streams in Angular

`EventSource` cannot POST a JSON body, so `AgentService.stream()` uses `fetch()`:

```typescript
const response = await fetch('/api/agent/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt }),
});
```

`readEvents()` reads the response with `ReadableStream.getReader()`, preserves partial UTF-8 characters with `TextDecoder`, normalizes CRLF, buffers incomplete frames, and splits complete events at blank lines. The service dispatches `message`, surfaces `error`, and requires a final `done` so an interrupted connection cannot look successful. `query()` and `health()` use typed `HttpClient` requests.

### 6. Connect signals to the teaching view

The main component owns signals for state, elapsed time, final result and timeline rows. A running request disables submission, resets previous output, and starts an elapsed-time counter. Each incoming event appends a timestamped row; `ResultMessage` populates the answer. A `finally` block always stops the timer. Failures show a friendly message and Material snackbar.

```typescript
this.messages.update(rows => [...rows, { ...message, elapsed }]);
if (message.type === 'ResultMessage') {
  this.result.set(message.data as unknown as AgentResult);
}
```

`StreamInspector` takes timeline rows as a signal input, renders `@for` rows, assigns a colored message-type badge, and uses native `<details>` for JSON. Markdown goes through `marked` then Angular `[innerHTML]` sanitization; no sanitizer bypass is used. Theme preference is stored in `localStorage` and applies Material's light/dark color scheme.

```text
Browser -> AgentService -> POST /api/agent/stream -> stream_agent() -> query()
        -> Claude -> message stream -> SSE -> timeline + answer card
```

## Validation commands

From `backend`, with the virtual environment active:

```text
python -m pytest -q
python -m pip freeze
```

From `frontend`:

```text
npm run build
npm test -- --watch=false
npx ng version
```

API tests mock only `agent_service.query()`, exercising validation, the real service loop, option restrictions, health, query, stream ordering, missing-key handling, missing results and sanitized errors without API usage. Frontend tests cover HTTP calls, SSE framing split across bytes, Unicode, stream failures, state transitions, Markdown sanitization, timeline rendering, simple mode and theme persistence.

With both servers running, verify the proxy with `curl.exe http://localhost:4200/api/health` on Windows (`curl` on macOS/Linux). For a real prompt use the UI, or POST `{"prompt":"Hello world!"}` with content type `application/json` to `http://localhost:4200/api/agent/query`. This consumes API credits and requires a configured key. See `VERIFICATION.md` for the actual checks performed on this machine.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `ModuleNotFoundError` | Activate this project's `.venv`; use `python -m pip install -r requirements.txt` from `backend`. |
| PowerShell blocks `Activate.ps1` | Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` if appropriate for your machine, or call `.venv\Scripts\python.exe` directly. |
| API key not detected | Edit `backend/.env`, replace the placeholder and restart. A pre-existing environment variable overrides `.env`. |
| Windows `NotImplementedError` from subprocess creation | Start with `python run.py`, not `uvicorn --reload`. The SDK spawns a CLI subprocess and needs a Proactor loop. `run.py` explicitly constructs one on Windows and disables reload; macOS/Linux use their normal loop. Restart manually after backend edits. |
| Port 8000 / 4200 already in use | Stop the previous server, or change the backend port and proxy together / pass `npm start -- --port 4201` and update CORS if accessing the API directly. |
| CORS / proxy failures | Start both servers; use `/api` URLs and `npm start`. For direct cross-origin requests configure the exact browser origin in `CORS_ORIGINS`. |
| TypeScript version mismatch | Restore `typescript: 6.0.3` and reinstall from the lockfile with `npm ci`; do not install 7.x. |
| Windows `UnicodeEncodeError` | Set `$env:PYTHONUTF8="1"` before starting Python (macOS/Linux: `export PYTHONUTF8=1`). |
| Agent failed or stream interrupted | Check server credentials/model and network access, restart if needed, then rerun. Health checks API availability, not upstream Claude authentication. |
| Vitest times out starting workers on a busy machine | PowerShell: set `$env:VITEST_MAX_WORKERS="1"`, then run `npm test -- --watch=false`. macOS/Linux: `VITEST_MAX_WORKERS=1 npm test -- --watch=false`. This reduces concurrency without skipping tests. |

## Exercises

1. Add a server-approved system-prompt personality selector.
2. Add conversation history with `ClaudeSDKClient`.
3. Add a **Stop** button that cancels the fetch stream and agent work.
4. Package the two services with Docker Compose.
5. Put authentication in front of the API before making it available to others.

The agent is still the same few lines. The enterprise application is the architecture around them.
