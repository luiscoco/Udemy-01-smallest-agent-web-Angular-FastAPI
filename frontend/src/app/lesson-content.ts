import { Component, input } from '@angular/core';
import { CodeBlock } from './code-block';
import { workflowSteps } from './workflow-steps';

export type LessonSection = 'lab' | 'learn' | 'setup' | 'architecture' | 'walkthrough';

@Component({
  selector: 'app-lesson-content',
  imports: [CodeBlock],
  template: `
    @switch (section()) {
      @case ('learn') {
        <section class="lesson-section" aria-labelledby="learn-title">
          <div class="section-intro"><span class="eyebrow">THE LEARNING PATH</span><h2 id="learn-title">From a few lines to a working application.</h2><p>Keep the agent small. Understand each layer you put around it.</p></div>
          <div class="learning-grid">
            @for (card of concepts; track card.title; let i = $index) {
              <article class="learning-card"><span class="step-number">0{{ i + 1 }}</span><h3>{{ card.title }}</h3><p>{{ card.text }}</p></article>
            }
          </div>
          <aside class="lesson-note"><strong>Try explaining it in your own words.</strong><p>Why does the browser never need an API key? Why is an assistant message different from a final result? What does Stream mode reveal that Simple mode hides?</p></aside>
          <a class="lesson-button primary" href="#setup">Configure your application <span aria-hidden="true">→</span></a>
        </section>
      }
      @case ('setup') {
        <section class="lesson-section" aria-labelledby="setup-title">
          <div class="section-intro"><span class="eyebrow">INSTALL · CONFIGURE · RUN</span><h2 id="setup-title">Two terminals. One small agent.</h2><p>Start in the application folder, with Python 3.10+ and Node.js 24.15+ (24 LTS) or 26 installed. Use Python 3.14 for the same runtime as this lesson.</p></div>
          <article class="lesson-step"><span class="step-number">01</span><h3>Prepare the Python backend</h3><p>Create a virtual environment and install the pinned requirements. Choose the commands for your platform.</p>
            <details open><summary>Windows PowerShell</summary><app-code-block [code]="windowsInstall" language="powershell"/></details>
            <details><summary>macOS / Linux</summary><app-code-block [code]="unixInstall" language="bash"/></details>
          </article>
          <article class="lesson-step"><span class="step-number">02</span><h3>Configure backend/.env</h3><p>Get your own API key from <a href="https://platform.claude.com" target="_blank" rel="noopener noreferrer">Claude Console</a>. Replace the placeholder in <code>backend/.env</code>, save, and restart the backend after any change.</p><app-code-block [code]="envExample" language="ini"/><p class="support-text">Leave CLAUDE_MODEL and AGENT_SYSTEM_PROMPT empty to use the defaults. Existing process environment variables override the file.</p></article>
          <div class="terminal-grid">
            <article class="lesson-step"><span class="terminal-label">TERMINAL 1 / BACKEND</span><h3>Start FastAPI</h3><p>From the application folder on Windows:</p><app-code-block [code]="windowsRun" language="powershell"/><p>On macOS/Linux with the venv active: <code>cd backend</code>, then <code>python run.py</code>.</p><a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer">Open API documentation ↗</a></article>
            <article class="lesson-step"><span class="terminal-label">TERMINAL 2 / FRONTEND</span><h3>Start Angular</h3><p>Open a second terminal in the application folder:</p><app-code-block [code]="frontendRun" language="bash"/><p>Open <a href="http://localhost:4200">localhost:4200</a>. Keep both terminals open; Ctrl+C stops each server.</p></article>
          </div>
          <aside class="lesson-note"><strong>Your key belongs on the server.</strong><p>Keep it only in backend/.env or the server environment. Never put it in Angular, a prompt, a screenshot, or Git. A green health dot confirms backend connectivity, not Claude authentication. A 503 means the key is missing or still the template value.</p></aside>
          <a class="lesson-button primary" href="#lab">Try Hello world! →</a>
        </section>
      }
      @case ('architecture') {
        <section class="lesson-section" aria-labelledby="architecture-title">
          <div class="section-intro"><span class="eyebrow">FOLLOW ONE REQUEST</span><h2 id="architecture-title">See how the pieces connect.</h2><p>The browser handles interaction. FastAPI owns configuration and validation. The Python SDK manages the Claude runtime and message iterator.</p></div>
          <div class="architecture-flow" role="list" aria-label="Request architecture from browser to Claude">
            @for (layer of layers; track layer.title; let last = $last) {
              <div class="architecture-node" role="listitem"><span>{{ layer.label }}</span><strong>{{ layer.title }}</strong><p>{{ layer.text }}</p></div>
              @if (!last) { <span class="flow-arrow" aria-hidden="true">→</span> }
            }
          </div>
          <figure class="lesson-step uml-card" aria-labelledby="uml-title">
            <span class="eyebrow">UML SEQUENCE DIAGRAM</span><h3 id="uml-title">From a click to a final answer</h3>
            <p>Read from top to bottom. Vertical dashed lines are participant lifelines; solid arrows are calls and dashed arrows carry responses. The loop forwards SDK messages; the alternative branches show completion or failure.</p>
            <div class="uml-viewport" tabindex="0" role="region" aria-label="Scrollable UML workflow diagram"><img src="workflow.svg" width="1440" height="1660" alt="UML sequence: the student submits a prompt, Angular posts to FastAPI, FastAPI validates and calls the Python SDK, Claude returns messages, and SSE updates the timeline and final answer. Missing keys and SDK failures send an error; invalid prompts return HTTP 422."/></div>
            <figcaption>Stream mode · tools disabled · API key stays on the server. On a narrow screen, scroll the diagram horizontally to keep labels readable.</figcaption>
            <div class="diagram-downloads"><a href="workflow.svg" download>Download UML diagram (SVG)</a><a href="workflow.puml" download>Download editable PlantUML source</a></div>
          </figure>
          <div class="section-intro"><h3>Follow every UML arrow in the code</h3><p>The following cards match steps 1–16 in the diagram. Each shows selected source excerpts and explains their role. Imports and surrounding logic may be omitted.</p></div>
          @for (step of workflow; track step.number) {
            <article class="lesson-step workflow-code-step" [id]="'uml-step-' + step.number" [attr.aria-labelledby]="'uml-step-title-' + step.number">
              <span class="step-number">{{ step.number }}</span><h3 [id]="'uml-step-title-' + step.number">{{ step.number }}. {{ step.title }}</h3>
              <p>{{ step.text }}</p><div class="code-heading"><span>{{ step.language.toUpperCase() }} · SELECTED EXCERPTS</span><span>{{ step.source }}</span></div>
              <app-code-block [code]="step.code" [language]="step.language"/>
              <div class="workflow-code-explanation"><strong>How this code explains step {{ step.number }}</strong><p>{{ step.explanation }}</p></div>
            </article>
          }
          <aside class="lesson-note"><strong>One query, many messages.</strong><p>Stream mode sends one SSE event per SDK message, rather than one event per generated token. Intermediate text is progress. The final ResultMessage carries the answer and metrics; an error event or a missing final result must not be reported as success.</p></aside>
          <a class="lesson-button primary" href="#walkthrough">Follow the source code →</a>
        </section>
      }
      @case ('walkthrough') {
        <section class="lesson-section" aria-labelledby="walkthrough-title">
          <div class="section-intro"><span class="eyebrow">READ THE CODE, UNDERSTAND THE FLOW</span><h2 id="walkthrough-title">The same loop. A new way to use it.</h2><p>These selected excerpts come from this application. The full files include imports, configuration, validation, and error handling.</p></div>
          @for (step of walkthrough; track step.title; let i = $index) {
            <article class="lesson-step"><span class="step-number">0{{ i + 1 }}</span><h3>{{ step.title }}</h3><p>{{ step.text }}</p><div class="code-heading"><span>{{ step.language }}</span><span>{{ step.source }}</span></div><app-code-block [code]="step.code" [language]="step.language.startsWith('PYTHON') ? 'python' : 'typescript'"/></article>
          }
          <aside class="lesson-note"><strong>The key takeaway</strong><p>The agent is still the same few lines. The enterprise application is the architecture around them.</p></aside>
          <a class="lesson-button primary" href="#lab">Watch the code in action →</a>
        </section>
      }
    }
  `,
})
export class LessonContent {
  section = input.required<LessonSection>();
  concepts = [
    { title: 'Recognize the original agent', text: 'A prompt goes into query(). An async loop receives messages. ResultMessage contains the final answer, just like the terminal lesson.' },
    { title: 'Build a typed API', text: 'FastAPI validates a trimmed prompt of 1–4000 characters and returns a predictable response with turns, duration, cost and error status.' },
    { title: 'Keep credentials server-side', text: 'Pydantic settings loads backend/.env. The browser sees only whether a key is configured; it never receives the key itself.' },
    { title: 'Observe the message stream', text: 'A POST request opens an SSE stream. Inspect initialization, assistant content and the final result as messages arrive.' },
    { title: 'Restrict the agent’s tools', text: 'tools=[] removes built-in tools. The web prompt cannot use Bash, read or edit files, or fetch pages. No external MCP servers are loaded.' },
    { title: 'Render state safely', text: 'Angular signals connect loading, success and error states to the interface. Markdown is sanitized, and tests use mocked SDK output without API cost.' },
  ];
  windowsInstall = `python -m venv .venv
.\\.venv\\Scripts\\python.exe -m pip install -r backend\\requirements.txt
if (!(Test-Path backend\\.env)) {
    Copy-Item backend\\.env.example backend\\.env
}
notepad backend\\.env`;
  unixInstall = `python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r backend/requirements.txt
test -f backend/.env || cp backend/.env.example backend/.env
# Edit backend/.env in your preferred editor.`;
  envExample = `ANTHROPIC_API_KEY=sk-ant-replace-with-your-key
CLAUDE_MODEL=
AGENT_SYSTEM_PROMPT=
AGENT_MAX_TURNS=1
CORS_ORIGINS=["http://localhost:4200"]`;
  windowsRun = `cd backend
..\\.venv\\Scripts\\python.exe run.py`;
  frontendRun = `cd frontend
npm install
npm start`;
  layers = [
    { label: '01 / INTERACTION', title: 'Browser', text: 'Prompt, answer & timeline' },
    { label: '02 / FRONTEND', title: 'Angular', text: 'Typed AgentService' },
    { label: '03 / API', title: 'FastAPI', text: 'Validate & stream' },
    { label: '04 / RUNTIME', title: 'Python SDK', text: 'query() & messages' },
    { label: '05 / INFERENCE', title: 'Claude', text: 'Generate the response' },
  ];
  workflow = workflowSteps;
  walkthrough = [
    { title: 'Keep the Lesson 0 loop recognizable', language: 'PYTHON', source: 'backend/app/agent_service.py', text: 'Return the final result instead of printing it. The prompt → query → async loop → ResultMessage pattern stays the same.', code: `async def run_agent(prompt: str) -> dict:
    async for message in query(prompt=prompt, options=agent_options()):
        if isinstance(message, ResultMessage):
            return result_data(message)
    raise RuntimeError("Agent ended without a result")` },
    { title: 'Control the available tools', language: 'PYTHON / SELECTED OPTIONS', source: 'backend/app/agent_service.py', text: 'tools defines availability; allowed_tools controls automatic approvals. Empty approvals alone do not remove built-in tools. The backend also isolates filesystem settings and discovered skills.', code: `tools=[], allowed_tools=[], permission_mode="dontAsk",
setting_sources=[], skills=[], mcp_servers={}, strict_mcp_config=True,
max_turns=settings.agent_max_turns,
model=settings.claude_model or None,
system_prompt=settings.agent_system_prompt or None,` },
    { title: 'Send native Server-Sent Events', language: 'PYTHON / SUCCESS PATH', source: 'backend/app/main.py', text: 'Forward one event per SDK message. The surrounding route catches errors and sends a safe error event, rather than exposing an exception or pretending the request completed.', code: `async for message in stream_agent(body.prompt):
    yield ServerSentEvent(event="message", data=message)
yield ServerSentEvent(event="done", data={"status": "complete"})` },
    { title: 'Use fetch for a POST stream', language: 'TYPESCRIPT', source: 'frontend/src/app/agent.service.ts', text: 'EventSource cannot send a POST body. fetch opens the stream; readEvents buffers partial frames and preserves UTF-8 across chunks.', code: `const response = await fetch('/api/agent/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt }),
});` },
    { title: 'Connect messages to the screen', language: 'TYPESCRIPT / SELECTED CALLBACK', source: 'frontend/src/app/app.ts', text: 'A timestamped signal array feeds the inspector. Only ResultMessage populates the final answer; completion without a result is treated as a failure.', code: `this.messages.update(rows => [...rows, {
  ...message, elapsed: Math.round(performance.now() - started)
}]);
if (message.type === 'ResultMessage') {
  this.result.set(message.data as unknown as AgentResult);
}` },
  ];
}
