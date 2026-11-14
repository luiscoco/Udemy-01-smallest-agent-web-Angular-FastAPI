# Verification — 8 November 2026

## Review fixes — 12 November 2026

- Redact complete assistant/user text before shortening timeline summaries. Regression cases place a dummy key across the 160-character boundary and verify that neither full nor partial keys reach SSE output.
- Preserve the documented Python 3.10 support: use `asyncio.run` and the Windows Proactor policy on 3.10, and the existing explicit `Runner` loop factory on 3.11+. Four mocked launcher cases cover both API branches on Windows/Linux; no native Python 3.10 runtime was available for execution.
- Simple mode now displays string `detail` messages from HTTP errors, including the missing-key configuration instructions. Non-string/missing details retain the fallback. Updated UML step 15 to match the new source.
- Backend: **24 tests passed**. Frontend: **16 tests passed**, using a temporary Vitest configuration with one threads worker to avoid the earlier forks-worker startup timeout.
- Production build passed: 682.40 kB initial bundle / 163.05 kB estimated transfer. The existing 500 kB warning remains; the 1 MB error limit is not exceeded.
- Chrome verified the rendered Simple-mode missing-key message, matching UML step 15 and no JavaScript errors. API responses were mocked; no paid model request was made. Screenshot: `verification/simple-error-fixed.png`.
- Existing `.env` contents were neither read nor changed.

## Results

| Check | Actual result |
| --- | --- |
| Runtime checks | Python 3.14.5; Node.js 24.22.2; npm 11.19.1 |
| Backend `python -m pytest -q` | 18 passed; one environment-specific pytest cache write warning |
| Angular production build | Succeeded, zero errors; initial bundle about 604 kB, above the starter's 500 kB warning threshold and below its 1 MB error threshold |
| Angular `ng test --watch=false` | 2 test files, 8 tests passed |
| Windows `python run.py` | Server started successfully; `/api/health` and `/docs` returned HTTP 200 |
| Windows subprocess support | Explicit ProactorEventLoop successfully spawned Python, read its stdout and received `123` |
| Angular development server | Started on `http://127.0.0.1:4200`; page returned HTTP 200 |
| Angular proxy `GET /api/health` | HTTP 200, `{"status":"ok","api_key_configured":false}` |
| Angular proxy `POST /api/agent/stream` | Received a native SSE `error` event explaining that the server API key must be configured |
| Real Claude prompt | **Not run: no ANTHROPIC_API_KEY was configured.** No upstream authentication or actual model response is claimed. |
| Visual browser inspection | Not performed; no browser automation/preview tool was available. Component tests and live HTTP/proxy checks were performed. |

The environment sandbox initially denied Angular build subprocesses (`spawn EPERM`) and Windows subprocess pipe creation (`WinError 5`). Those checks succeeded after running with the required process access. Material's setup schematic initially inserted an extra starter theme; it was removed before the successful production build.

## Installed backend versions

Output from `pip freeze`, filtered to the requested packages:

```text
claude-agent-sdk==0.2.179
fastapi==0.162.2
httpx==0.28.1
pydantic==2.14.3
pydantic-settings==2.16.2
pytest==9.2.0
uvicorn==0.54.0
```

`uvicorn[standard]` is the installation requirement; `pip freeze` displays the underlying `uvicorn` distribution without its extras label.

## Installed frontend versions

`ng version` confirmed Angular CLI 22.2.6, Angular 22.2.5, Node 24.22.2 and npm 11.19.1, with installed/requested versions matching:

```text
@angular/animations       22.2.5
@angular/build            22.2.6
@angular/cdk              22.2.6
@angular/cli              22.2.6
@angular/common           22.2.5
@angular/compiler         22.2.5
@angular/compiler-cli     22.2.5
@angular/core             22.2.5
@angular/forms            22.2.5
@angular/material         22.2.6
@angular/platform-browser 22.2.5
@angular/router           22.2.5
rxjs                      7.8.2
typescript                6.0.3
vitest                    5.0.0
```

All requested section 1 pins were available; no version substitutions were needed. `marked` is pinned to 18.1.3 in `package.json` and the npm lockfile. The current specification is saved in `BUILD-PROMPT.txt`.

## Visual and lesson-content refresh — 8 November 2026

- Reviewed the user-supplied reference repository at commit `832439954c11d4f3623d1b4a311f7dd67389fcc8`, including its stylesheet, lab, learning goals, setup, architecture and walkthrough pages.
- Added five hash-linked sections with an active navigation state. The lab stays mounted when a student reads the lesson content; browser history and initial deep links select the section.
- Added the locally stored course astronaut, blue and orange styling, desktop/mobile body sizes of 21px/19px, helper text of at least 16px, responsive cards, readable code blocks, and light/dark colors. Asset provenance is recorded in `ASSETS.md`.
- Adapted instructional content to this application's Python SDK, disabled tools, FastAPI native SSE and Angular signals. No backend or dependency changes were made, and no credentials were read or modified.
- `npm run build`: passed with zero errors. Initial bundle 625.91 kB, estimated transfer 145.34 kB; the existing 500 kB warning budget is exceeded, and the 1 MB error budget is not exceeded.
- `npm test -- --watch=false`: **2 files / 9 tests passed**, including lesson deep-link selection and preserving the prompt/result when returning to the lab. Streaming, Markdown sanitization, errors and theme tests also pass.
- Verified byte-for-byte equality between the workspace's `Prompt - Create the Enterprise Web Application from Scratch.txt` and the project's updated `BUILD-PROMPT.txt`.
- Browser-based visual inspection was not available. Desktop/mobile/dark/zoom layouts are implemented in CSS but have not been visually verified in a browser during this refresh. No real Claude call was made for this presentation/content change.

## Syntax highlighting, pastel cards and UML — 8 November 2026

- Added exact dependency `highlight.js==11.12.0` (npm pin `"highlight.js": "11.12.0"`). Only Python, TypeScript, PowerShell, Bash, INI and JSON grammars are bundled.
- Setup, walkthrough, inspector JSON and supported Markdown code fences now use syntax colors. Source text and indentation are preserved, unknown languages are escaped as plain text, and Angular sanitization remains active.
- Cards use pale blue, lilac, mint and peach backgrounds, with darker theme counterparts.
- Added `public/workflow.svg` and editable `public/workflow.puml`, generated by `scripts/generate-workflow.py`. The UML includes five lifelines, numbered messages, call/return arrows, a message loop and final-result/error alternatives. Invalid input is shown as HTTP 422; a missing key produces an SSE error without calling the SDK.
- Validated the SVG as XML, checked the five lifelines and accessibility descriptions, and regenerated both files with matching SHA-256 hashes.
- Production build passed with zero errors: 672.59 kB initial bundle / 160.79 kB estimated transfer. The existing 500 kB warning threshold is exceeded; the 1 MB error threshold is not exceeded.
- Initial test execution timed out starting three worker processes, before running tests. Retried with `VITEST_MAX_WORKERS=1`: **3 files / 14 tests passed**. Coverage includes code text preservation, HTML escaping, all six grammars, Markdown highlighting/sanitization, UML download links, navigation preservation and existing API-client behavior.
- The original build prompt and `BUILD-PROMPT.txt` were updated together and verified identical. README documents the new dependency and diagram regeneration. Backend behavior and credentials were not changed.
- Browser visual inspection was unavailable; no model request was made for these presentation changes.

## Code explanations for every UML step — 8 November 2026

- Replaced the five-stage architecture summary with 16 numbered pastel cards matching the UML interaction numbers and titles. Each card contains a highlighted, formatted Python/TypeScript excerpt, actual source filename(s), context and a “How this code explains step N” paragraph.
- Added `frontend/src/app/workflow-steps.ts`. Excerpts were extracted from local implementation files. Verified every non-comment excerpt line against those files and all numbers/titles against `workflow.svg`.
- SDK-managed provider transport is explicitly distinguished from application code. Missing-key SSE rejection and HTTP 422 validation both have source excerpts; multi-function excerpts identify their separate contexts.
- Extended the architecture component check to verify all 16 cards have highlighted code, source references and matching explanation headings. All **14 frontend tests passed** with one worker. The final production build passed with zero errors (682.22 kB initial / 163.24 kB estimated transfer); the existing 500 kB warning remains below the 1 MB error limit.
- Updated the original prompt and project `BUILD-PROMPT.txt` with mandatory one-to-one UML/source explanations and verified identical contents. README updated. No backend behavior, credentials, dependencies or diagram geometry changed; browser visual inspection was not available.
