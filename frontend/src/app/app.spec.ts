import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { App } from './app';
import { AgentService, AgentMessage } from './agent.service';

describe('Agent playground', () => {
  const answer = { result: '**Hello!** <script>alert(1)</script>', num_turns: 1, duration_ms: 20, total_cost_usd: 0.001, is_error: false };
  const service = {
    health: () => of({ status: 'ok', api_key_configured: false }),
    query: vi.fn(() => of(answer)),
    stream: vi.fn(async (_prompt: string, onMessage: (message: AgentMessage) => void) => onMessage({ type: 'ResultMessage', summary: 'Done', data: answer })),
  };
  beforeEach(async () => {
    window.history.replaceState(null, '', '/');
    localStorage.clear(); vi.clearAllMocks();
    await TestBed.configureTestingModule({ imports: [App], providers: [{ provide: AgentService, useValue: service }] }).compileComponents();
  });
  it('starts with Hello world and displays the missing-key warning', () => {
    const fixture = TestBed.createComponent(App); fixture.detectChanges();
    expect(fixture.componentInstance.prompt).toBe('Hello world!');
    expect(fixture.nativeElement.textContent).toContain('API key not configured');
  });
  it('renders a streamed answer, timeline and sanitized Markdown', async () => {
    const fixture = TestBed.createComponent(App); fixture.detectChanges();
    await fixture.componentInstance.run(); fixture.detectChanges();
    expect(fixture.componentInstance.state()).toBe('success');
    expect(fixture.nativeElement.querySelector('.markdown strong').textContent).toBe('Hello!');
    expect(fixture.nativeElement.querySelector('.markdown script')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.timeline-row').length).toBe(1);
  });
  it('uses simple mode and ignores empty prompts', async () => {
    const fixture = TestBed.createComponent(App); const app = fixture.componentInstance;
    app.prompt = ' '; await app.run(); expect(service.query).not.toHaveBeenCalled();
    app.prompt = 'Hello'; app.mode = 'simple'; await app.run();
    expect(service.query).toHaveBeenCalledWith('Hello'); expect(app.state()).toBe('success');
  });
  it('reports failures and remembers theme choice', async () => {
    const fixture = TestBed.createComponent(App); const app = fixture.componentInstance;
    service.stream.mockRejectedValueOnce(new Error('Connection lost'));
    await app.run(); expect(app.state()).toBe('error'); expect(app.error()).toBe('Connection lost');
    app.toggleTheme(); expect(localStorage.getItem('agent-theme')).toBe('dark');
  });
  it('shows backend configuration instructions in simple mode', async () => {
    const detail = 'Configure ANTHROPIC_API_KEY in backend/.env before running the agent.';
    service.query.mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 503, error: { detail } })));
    const fixture = TestBed.createComponent(App);
    fixture.componentInstance.mode = 'simple';
    await fixture.componentInstance.run(); fixture.detectChanges();
    expect(fixture.componentInstance.state()).toBe('error');
    expect(fixture.nativeElement.querySelector('.error-message').textContent).toBe(detail);
  });
  it('uses a friendly fallback for an offline backend in simple mode', async () => {
    service.query.mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 0 })));
    const fixture = TestBed.createComponent(App);
    fixture.componentInstance.mode = 'simple';
    await fixture.componentInstance.run();
    expect(fixture.componentInstance.state()).toBe('error');
    expect(fixture.componentInstance.error()).toBe('The request failed. Check the backend connection and API key.');
  });
  it('opens lesson deep links and preserves the lab when navigating back', async () => {
    const fixture = TestBed.createComponent(App); const app = fixture.componentInstance;
    app.prompt = 'What is Python?';
    await app.run();
    window.history.replaceState(null, '', '/#setup');
    app.readSection(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#setup-title').textContent).toContain('Two terminals');
    expect(fixture.nativeElement.querySelector('a[aria-current="page"]').getAttribute('href')).toBe('#setup');
    expect(fixture.nativeElement.querySelector('.workspace').closest('section').hidden).toBe(true);
    window.history.replaceState(null, '', '/#lab');
    app.readSection(); fixture.detectChanges();
    expect(app.prompt).toBe('What is Python?');
    expect(app.result()?.result).toBe(answer.result);
    expect(fixture.nativeElement.querySelector('.workspace').closest('section').hidden).toBe(false);
    expect(service.stream).toHaveBeenCalledTimes(1);
  });
  it('shows the UML workflow and provides downloadable diagram sources', () => {
    window.history.replaceState(null, '', '/#architecture');
    const fixture = TestBed.createComponent(App); fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('.uml-viewport img')?.getAttribute('src')).toBe('workflow.svg');
    expect(element.querySelector('.uml-viewport')?.getAttribute('tabindex')).toBe('0');
    expect(element.querySelector('a[href="workflow.puml"]')?.hasAttribute('download')).toBe(true);
    const steps = element.querySelectorAll('.workflow-code-step');
    expect(steps.length).toBe(16);
    steps.forEach((step, index) => {
      expect(step.id).toBe(`uml-step-${index + 1}`);
      expect(step.querySelector('.hljs')).not.toBeNull();
      expect(step.querySelector('.code-heading')?.textContent).toMatch(/(backend|frontend)\/.*\.(py|ts)/);
      expect(step.querySelector('.workflow-code-explanation')?.textContent).toContain(`How this code explains step ${index + 1}`);
    });
    expect(service.stream).not.toHaveBeenCalled();
  });
  it('highlights fenced code in agent Markdown while retaining sanitization', async () => {
    service.query.mockReturnValueOnce(of({ ...answer, result: '```python\nprint("Hello")\n```\n<script>alert(1)</script>' }));
    const fixture = TestBed.createComponent(App);
    fixture.componentInstance.mode = 'simple';
    await fixture.componentInstance.run(); fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('.markdown .hljs-string')).not.toBeNull();
    expect(element.querySelector('.markdown script')).toBeNull();
  });
});
