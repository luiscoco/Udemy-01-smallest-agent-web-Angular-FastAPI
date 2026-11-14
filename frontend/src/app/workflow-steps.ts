// Selected source excerpts, numbered to match the UML diagram.
export const workflowSteps = [
  {
    "number": 1,
    "title": "Run agent (prompt)",
    "language": "typescript",
    "source": "frontend/src/app/app.ts",
    "text": "Clicking Run agent calls run(). The component trims input and prevents empty, oversized or duplicate submissions.",
    "code": "const prompt = this.prompt.trim();\nif (!prompt || prompt.length > 4000 || this.state() === 'running') return;",
    "explanation": "This is the browser-side entry point. These usability checks supplement the independent server-side validation in step 3."
  },
  {
    "number": 2,
    "title": "POST /api/agent/stream",
    "language": "typescript",
    "source": "frontend/src/app/agent.service.ts",
    "text": "AgentService sends the prompt as a JSON POST. The development proxy forwards /api to FastAPI; fetch supports a POST response stream.",
    "code": "const response = await fetch('/api/agent/stream', {\n  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }),\n});",
    "explanation": "The browser sends only the prompt. It neither receives the API key nor chooses tool permissions."
  },
  {
    "number": 3,
    "title": "Validate; tools disabled",
    "language": "python",
    "source": "backend/app/schemas.py; backend/app/agent_service.py",
    "text": "FastAPI validates the trimmed request. The backend also removes built-in tools and isolates filesystem settings, skills and MCP configuration.",
    "code": "class PromptRequest(BaseModel):\n    model_config = ConfigDict(str_strip_whitespace=True)\n    prompt: str = Field(min_length=1, max_length=4000)\n\n# Selected agent_options() arguments from agent_service.py:\ntools=[], allowed_tools=[], permission_mode=\"dontAsk\",\nsetting_sources=[], skills=[], mcp_servers={}, strict_mcp_config=True,",
    "explanation": "These excerpts belong to separate definitions. tools=[] removes the tools; allowed_tools=[] by itself only clears automatic approvals."
  },
  {
    "number": 4,
    "title": "stream_agent() / query()",
    "language": "python",
    "source": "backend/app/agent_service.py",
    "text": "FastAPI consumes stream_agent(), whose async loop calls query() with the validated prompt and server-controlled options.",
    "code": "async def stream_agent(prompt: str):\n    found_result = False\n    async for message in query(prompt=prompt, options=agent_options()):\n        kind = type(message).__name__",
    "explanation": "The same Lesson 0 async iterator is still at the core. The service inspects SDK message types and then projects only safe fields."
  },
  {
    "number": 5,
    "title": "Prompt; no built-in tools",
    "language": "python",
    "source": "backend/app/agent_service.py",
    "text": "The SDK and its CLI runtime manage the provider request. The application supplies the prompt and options at the query() boundary.",
    "code": "async for message in query(prompt=prompt, options=agent_options()):",
    "explanation": "This is the application code behind the SDK-to-Claude arrow, not a hand-written HTTP request. The tools=[] options from step 3 apply to the SDK run."
  },
  {
    "number": 6,
    "title": "Model response",
    "language": "python",
    "source": "backend/app/agent_service.py",
    "text": "Claude responds through the SDK-managed runtime. The application receives SDK message objects rather than a raw model HTTP response.",
    "code": "async for message in query(prompt=prompt, options=agent_options()):\n    kind = type(message).__name__",
    "explanation": "The iterator is the receiving boundary for this interaction. Lifecycle messages can also arrive while inference runs; not every yielded message is model text."
  },
  {
    "number": 7,
    "title": "Safe SDK message",
    "language": "python",
    "source": "backend/app/agent_service.py",
    "text": "The service projects SDK objects into a type name, a short summary and allowlisted data, excluding raw runtime configuration.",
    "code": "yield {\"type\": kind, \"summary\": summary, \"data\": data}",
    "explanation": "This yield is the service-to-API boundary. The same projection also handles ResultMessage, shown separately later in the diagram for clarity."
  },
  {
    "number": 8,
    "title": "SSE message event",
    "language": "python",
    "source": "backend/app/main.py",
    "text": "FastAPI wraps each safe dictionary in a named message event and encodes it with native SSE support.",
    "code": "async for message in stream_agent(body.prompt):\n    yield ServerSentEvent(event=\"message\", data=message)",
    "explanation": "The browser receives JSON in the SSE data field. One SDK message is not necessarily one generated token or one model request."
  },
  {
    "number": 9,
    "title": "Update timeline signal",
    "language": "typescript",
    "source": "frontend/src/app/app.ts",
    "text": "After AgentService parses an SSE message, this callback appends it to the timeline with a relative arrival timestamp.",
    "code": "this.messages.update(rows => [...rows, { ...message, elapsed: Math.round(performance.now() - started) }]);",
    "explanation": "StreamInspector reads this signal, so the new row appears without manual DOM updates. This is the final UI interaction in the diagram loop."
  },
  {
    "number": 10,
    "title": "ResultMessage fields",
    "language": "python",
    "source": "backend/app/agent_service.py",
    "text": "The final SDK result provides the answer, turns, duration, cost and error flag. The configured key is redacted from result text.",
    "code": "def result_data(message: ResultMessage) -> dict:\n    return {\n        \"result\": redact(message.result or \"\"),\n        \"num_turns\": message.num_turns,\n        \"duration_ms\": message.duration_ms,\n        \"total_cost_usd\": message.total_cost_usd,\n        \"is_error\": message.is_error,\n    }",
    "explanation": "These are actual SDK fields, not invented metrics. The result can itself indicate failure through is_error even though a final message arrived."
  },
  {
    "number": 11,
    "title": "SSE ResultMessage",
    "language": "typescript",
    "source": "frontend/src/app/agent.service.ts; frontend/src/app/app.ts",
    "text": "The final result arrives through the same message event used for intermediate messages; its payload type is ResultMessage.",
    "code": "// AgentService dispatches parsed message events:\nif (event === 'message') onMessage(data as AgentMessage);\n\n// Separate App callback stores final fields:\nif (message.type === 'ResultMessage') this.result.set(message.data as unknown as AgentResult);",
    "explanation": "These excerpts are from separate callbacks. There is no special result event name: the JSON payload identifies ResultMessage."
  },
  {
    "number": 12,
    "title": "Render answer + metrics",
    "language": "typescript",
    "source": "frontend/src/app/app.ts",
    "text": "The answer is derived from the result signal. The template sanitizes the generated Markdown and displays the result metrics.",
    "code": "answer = computed(() => this.markdown.parse(this.result()?.result ?? '', { async: false }));\n\n// Final outcome check inside run():\nif (this.result()?.is_error) throw new Error('The agent could not complete this prompt. Check the backend configuration and try again.');",
    "explanation": "Updating the signal makes the answer available to the view. The final success/error check happens after streaming completes, and respects is_error."
  },
  {
    "number": 13,
    "title": "SSE done event",
    "language": "python",
    "source": "backend/app/main.py",
    "text": "After all SDK messages have been forwarded, FastAPI emits the terminal done event.",
    "code": "yield ServerSentEvent(event=\"done\", data={\"status\": \"complete\"})",
    "explanation": "AgentService records done and rejects an interrupted connection without it. done confirms transport completion; it does not override an error ResultMessage."
  },
  {
    "number": 14,
    "title": "SSE error; no done",
    "language": "python",
    "source": "backend/app/agent_service.py; backend/app/main.py",
    "text": "A missing final result raises an error. The route catches SDK/service failures and emits a safe SSE error instead of done.",
    "code": "if not found_result:\n    raise RuntimeError(\"Agent ended without a result\")\n\n# Separate stream() exception handler in main.py:\nexcept Exception:\n    yield ServerSentEvent(event=\"error\", data={\"detail\": FAILURE})",
    "explanation": "The excerpts belong to separate functions. The API sends a generic error message, never raw SDK exceptions, stack traces or credentials."
  },
  {
    "number": 15,
    "title": "Error + snackbar",
    "language": "typescript",
    "source": "frontend/src/app/app.ts",
    "text": "An SSE error becomes a client exception. The component displays the same friendly message inline and in a snackbar.",
    "code": "const detail = error instanceof HttpErrorResponse ? error.error?.detail : null;\nconst message = typeof detail === 'string' ? detail : error instanceof Error ? error.message : 'The request failed. Check the backend connection and API key.';\nthis.error.set(message); this.state.set('error'); this.snack.open(message, 'Dismiss', { duration: 7000 });",
    "explanation": "The state becomes error instead of success. The finally block also stops the elapsed timer so the student can try again."
  },
  {
    "number": 16,
    "title": "Key: SSE error / input: 422",
    "language": "python",
    "source": "backend/app/main.py",
    "text": "The precondition branch stops before query(): missing credentials produce an SSE error, while invalid input is rejected by FastAPI with HTTP 422.",
    "code": "async def stream(body: PromptRequest) -> AsyncIterator[ServerSentEvent]:\n    if not settings.api_key_configured:\n        yield ServerSentEvent(event=\"error\", data={\"detail\": \"Configure ANTHROPIC_API_KEY in backend/.env before running the agent.\"})\n        return\n\n# Separate validation-error handler:\n@app.exception_handler(RequestValidationError)\nasync def validation_error(request: Request, exc: RequestValidationError):\n    # Exclude submitted values and exception context from public errors.\n    return JSONResponse(status_code=422, content={\"detail\": [\n        {\"loc\": list(error[\"loc\"]), \"msg\": error[\"msg\"], \"type\": error[\"type\"]}\n        for error in exc.errors()\n    ]})",
    "explanation": "This excerpt shows the missing-key branch of /stream. Invalid request bodies never enter the route; validation_error() returns clean HTTP 422 JSON. The separate /query endpoint uses HTTP 503 for a missing key."
  }
];
