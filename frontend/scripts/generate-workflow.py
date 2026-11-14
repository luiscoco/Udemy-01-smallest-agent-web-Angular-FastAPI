"""Regenerate the local, downloadable UML assets; no rendering service needed."""
from html import escape
from pathlib import Path

PUBLIC = Path(__file__).resolve().parents[1] / "public"
xs = [145, 425, 705, 985, 1265]
parts = ['''<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="1660" viewBox="0 0 1440 1660" role="img" aria-labelledby="title description">
<title id="title">The Smallest Agent: UML streaming workflow</title>
<desc id="description">Five participant lifelines show prompt submission, validation, the Python SDK and Claude exchange, repeated SSE progress messages, the final answer and done event, and error alternatives.</desc>
<defs>
  <marker id="call" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="#285b98"/></marker>
  <marker id="return" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto"><path d="M1 1 L9 5 L1 9" fill="none" stroke="#285b98" stroke-width="1.5"/></marker>
</defs>
<style>
  text { font-family: Arial, sans-serif; fill: #142547; font-size: 18px; }
  .heading { font-size: 28px; font-weight: 700; }
  .participant { font-size: 20px; font-weight: 700; }
  .small { font-size: 17px; fill: #4c6283; }
  .guard { font-size: 18px; font-weight: 700; fill: #285b98; }
  .lifeline { stroke: #9baec7; stroke-width: 1.5; stroke-dasharray: 7 7; }
  .call { fill: none; stroke: #285b98; stroke-width: 2; marker-end: url(#call); }
  .return { fill: none; stroke: #285b98; stroke-width: 2; stroke-dasharray: 7 5; marker-end: url(#return); }
  .frame { fill: none; stroke: #9baec7; stroke-width: 1.5; }
</style>
<rect width="1440" height="1660" fill="#f8fbff"/>
<text x="45" y="45" class="heading">One prompt, from browser to Claude and back</text>
<text x="45" y="76" class="small">UML sequence diagram · POST stream mode · selected application-level interactions</text>''']

participants = [
    ("Student / Browser", "Prompt, answer, timeline", "#edf5ff"),
    ("Angular", "AgentService + signals", "#f3edff"),
    ("FastAPI", "/api + agent_service.py", "#eaf7f0"),
    ("Python Agent SDK", "query() + CLI runtime", "#fff2e6"),
    ("Claude API", "Model inference", "#edf5ff"),
]
for x, (title, subtitle, color) in zip(xs, participants):
    parts.append(f'<rect x="{x-120}" y="100" width="240" height="75" rx="12" fill="{color}" stroke="#c3d4eb"/>')
    parts.append(f'<text x="{x}" y="130" text-anchor="middle" class="participant">{escape(title)}</text>')
    parts.append(f'<text x="{x}" y="157" text-anchor="middle" class="small">{escape(subtitle)}</text>')
    parts.append(f'<line x1="{x}" y1="175" x2="{x}" y2="1580" class="lifeline"/>')


def message(number, sender, receiver, y, label, returned=False):
    start, finish = xs[sender], xs[receiver]
    kind = "return" if returned else "call"
    if sender == receiver:
        parts.append(f'<path d="M{start} {y-20} h95 v40 h-95" class="{kind}"/>')
        parts.append(f'<text x="{start+110}" y="{y-25}">{number}. {escape(label)}</text>')
    else:
        parts.append(f'<line x1="{start}" y1="{y}" x2="{finish}" y2="{y}" class="{kind}"/>')
        parts.append(f'<text x="{(start+finish)/2}" y="{y-13}" text-anchor="middle">{number}. {escape(label)}</text>')


message(1, 0, 1, 215, "Run agent (prompt)")
message(2, 1, 2, 275, "POST /api/agent/stream")
parts.append('<rect x="35" y="305" width="1370" height="1260" class="frame"/>')
parts.append('<text x="52" y="334" class="guard">alt [valid prompt and configured key]</text>')
message(3, 2, 2, 380, "Validate; tools disabled")
message(4, 2, 3, 460, "stream_agent() / query()")
message(5, 3, 4, 525, "Prompt; no built-in tools")
message(6, 4, 3, 590, "Model response", True)

parts.append('<rect x="55" y="620" width="1330" height="285" rx="5" fill="#edf5ff" fill-opacity="0.8" stroke="#9baec7"/>')
parts.append('<text x="72" y="650" class="guard">loop [each intermediate SDK message]</text>')
message(7, 3, 2, 710, "Safe SDK message", True)
message(8, 2, 1, 785, "SSE message event", True)
message(9, 1, 0, 865, "Update timeline signal", True)

parts.append('<rect x="55" y="930" width="1330" height="490" class="frame"/>')
parts.append('<text x="72" y="960" class="guard">alt [final result received]</text>')
message(10, 3, 2, 1015, "ResultMessage fields", True)
message(11, 2, 1, 1080, "SSE ResultMessage", True)
message(12, 1, 0, 1145, "Render answer + metrics", True)
message(13, 2, 1, 1210, "SSE done event", True)
parts.append('<line x1="55" y1="1240" x2="1385" y2="1240" stroke="#9baec7" stroke-dasharray="7 5"/>')
parts.append('<text x="72" y="1270" class="guard">else [SDK failure or missing final result]</text>')
message(14, 2, 1, 1325, "SSE error; no done", True)
message(15, 1, 0, 1390, "Error + snackbar", True)

parts.append('<line x1="35" y1="1440" x2="1405" y2="1440" stroke="#9baec7" stroke-dasharray="7 5"/>')
parts.append('<text x="52" y="1470" class="guard">else [missing key or invalid prompt: SDK is not called]</text>')
message(16, 2, 1, 1530, "Key: SSE error / input: 422", True)
parts.append('<text x="45" y="1610" class="small">SDK lifecycle messages may arrive while inference is running; the diagram summarizes the application-level flow.</text>')
parts.append('<text x="45" y="1640" class="small">An error ResultMessage also shows failure in the UI. A done event closes the stream; it does not override is_error.</text>')
parts.append('</svg>')
PUBLIC.mkdir(exist_ok=True)
(PUBLIC / "workflow.svg").write_text("\n".join(parts), encoding="utf-8")
(PUBLIC / "workflow.puml").write_text('''@startuml
title The Smallest Agent - streaming workflow
autonumber
actor "Student / Browser" as Browser
participant "Angular AgentService" as Angular
participant "FastAPI / agent_service.py" as API
participant "Python Agent SDK / CLI" as SDK
participant "Claude API" as Claude
Browser -> Angular: Run agent(prompt)
Angular -> API: POST /api/agent/stream
alt Valid prompt and configured key
  API -> API: Validate; apply tools=[] options
  API -> SDK: stream_agent() / query()
  SDK -> Claude: Prompt; no built-in tools
  Claude --> SDK: Model response
  note over API, SDK: Lifecycle messages may arrive while inference runs.
  loop Each intermediate SDK message
    SDK --> API: Safe SDK message
    API --> Angular: SSE message event
    Angular --> Browser: Update timeline signal
  end
  alt Final result received
    SDK --> API: ResultMessage fields
    API --> Angular: SSE message: ResultMessage
    Angular --> Browser: Render answer and metrics (respect is_error)
    API --> Angular: SSE done
  else SDK failure or missing final result
    API --> Angular: SSE error (no done)
    Angular --> Browser: Friendly error and snackbar
  end
else Missing key or invalid prompt
  API --> Angular: Missing key: SSE error; invalid input: HTTP 422
end
@enduml
''', encoding="utf-8")
print("Generated public/workflow.svg and public/workflow.puml")
