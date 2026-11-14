from collections.abc import AsyncIterator

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.sse import EventSourceResponse, ServerSentEvent

from .agent_service import run_agent, stream_agent
from .config import settings
from .schemas import AgentResponse, PromptRequest

app = FastAPI(title="The Smallest Agent · Web Edition", version="1.0.0",
              description="Lesson 0's agent loop, wrapped in a typed API and a live message stream.")
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins,
                   allow_methods=["GET", "POST"], allow_headers=["Content-Type"])
FAILURE = "The agent could not finish. Check the server API key and model configuration, then try again."


@app.exception_handler(RequestValidationError)
async def validation_error(request: Request, exc: RequestValidationError):
    # Exclude submitted values and exception context from public errors.
    return JSONResponse(status_code=422, content={"detail": [
        {"loc": list(error["loc"]), "msg": error["msg"], "type": error["type"]}
        for error in exc.errors()
    ]})


@app.exception_handler(Exception)
async def unexpected_error(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": "An unexpected server error occurred."})


@app.get("/api/health", tags=["Health"], description="Check API readiness and whether a server-side API key is configured.")
async def health():
    return {"status": "ok", "api_key_configured": settings.api_key_configured}


@app.post("/api/agent/query", response_model=AgentResponse, tags=["Agent"],
          description="Run one prompt and return the final ResultMessage fields.")
async def query_agent(body: PromptRequest):
    if not settings.api_key_configured:
        raise HTTPException(503, "Configure ANTHROPIC_API_KEY in backend/.env before running the agent.")
    try:
        return await run_agent(body.prompt)
    except Exception:
        raise HTTPException(502, FAILURE) from None


# FastAPI 0.162.2's installed fastapi.sse module provides native SSE encoding.
# Yield objects directly: do not JSON-encode twice or add an SSE dependency.
@app.post("/api/agent/stream", response_class=EventSourceResponse, tags=["Agent"],
          description="Stream safe SDK messages as message events, followed by done; failures emit error.")
async def stream(body: PromptRequest) -> AsyncIterator[ServerSentEvent]:
    if not settings.api_key_configured:
        yield ServerSentEvent(event="error", data={"detail": "Configure ANTHROPIC_API_KEY in backend/.env before running the agent."})
        return
    try:
        async for message in stream_agent(body.prompt):
            yield ServerSentEvent(event="message", data=message)
        yield ServerSentEvent(event="done", data={"status": "complete"})
    except Exception:
        yield ServerSentEvent(event="error", data={"detail": FAILURE})
