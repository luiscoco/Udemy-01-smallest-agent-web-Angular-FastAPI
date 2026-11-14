import { Component, computed, HostListener, inject, OnDestroy, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { Marked } from 'marked';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AgentResult, AgentService, Health } from './agent.service';
import { StreamInspector, TimelineMessage } from './stream-inspector';
import { LessonContent, LessonSection } from './lesson-content';
import { highlightCode } from './code-block';

@Component({
  selector: 'app-root',
  imports: [FormsModule, DecimalPipe, MatButtonModule, MatFormFieldModule, MatInputModule,
    MatButtonToggleModule, MatProgressSpinnerModule, StreamInspector, LessonContent],
  templateUrl: './app.html',
})
export class App implements OnDestroy {
  private markdown = new Marked({ renderer: {
    code: ({ text, lang }) => `<pre><code class="hljs">${highlightCode(text, (lang ?? '').split(/\s+/)[0])}</code></pre>`,
  } });
  readonly sections = [
    { id: 'lab', label: 'Application lab' },
    { id: 'learn', label: 'What you will learn' },
    { id: 'setup', label: 'How to run' },
    { id: 'architecture', label: 'Architecture & workflow' },
    { id: 'walkthrough', label: 'Code walkthrough' },
  ] as const;
  section = signal<LessonSection>('lab');
  private agent = inject(AgentService);
  private snack = inject(MatSnackBar);
  prompt = 'Hello world!';
  mode = 'stream';
  examples = ['Hello world!', 'Explain what an AI agent is in one sentence.', 'What is Python?'];
  state = signal<'idle' | 'running' | 'success' | 'error'>('idle');
  result = signal<AgentResult | null>(null);
  messages = signal<TimelineMessage[]>([]);
  health = signal<Health | null>(null);
  elapsed = signal(0);
  error = signal('');
  dark = signal(localStorage.getItem('agent-theme') === 'dark');
  answer = computed(() => this.markdown.parse(this.result()?.result ?? '', { async: false }));
  private timer?: ReturnType<typeof setInterval>;
  constructor() {
    this.readSection();
    this.applyTheme();
    this.agent.health().subscribe({ next: h => this.health.set(h), error: () => this.health.set(null) });
  }
  @HostListener('window:hashchange')
  readSection() {
    const id = window.location.hash.slice(1);
    // The keyboard skip link moves focus without changing the selected lesson.
    if (id === 'lesson-content') return;
    this.section.set(this.sections.find(tab => tab.id === id)?.id ?? 'lab');
  }
  toggleTheme() { this.dark.update(v => !v); this.applyTheme(); }
  private applyTheme() {
    document.documentElement.classList.toggle('dark', this.dark());
    localStorage.setItem('agent-theme', this.dark() ? 'dark' : 'light');
  }
  async run() {
    const prompt = this.prompt.trim();
    if (!prompt || prompt.length > 4000 || this.state() === 'running') return;
    this.state.set('running'); this.result.set(null); this.messages.set([]); this.error.set(''); this.elapsed.set(0);
    const started = performance.now();
    this.timer = setInterval(() => this.elapsed.set(Math.round(performance.now() - started)), 100);
    try {
      if (this.mode === 'stream') {
        await this.agent.stream(prompt, message => {
          this.messages.update(rows => [...rows, { ...message, elapsed: Math.round(performance.now() - started) }]);
          if (message.type === 'ResultMessage') this.result.set(message.data as unknown as AgentResult);
        });
        if (!this.result()) throw new Error('The agent finished without a result. Please try again.');
      } else this.result.set(await firstValueFrom(this.agent.query(prompt)));
      if (this.result()?.is_error) throw new Error('The agent could not complete this prompt. Check the backend configuration and try again.');
      this.state.set('success');
    } catch (error: unknown) {
      const detail = error instanceof HttpErrorResponse ? error.error?.detail : null;
      const message = typeof detail === 'string' ? detail : error instanceof Error ? error.message : 'The request failed. Check the backend connection and API key.';
      this.error.set(message); this.state.set('error'); this.snack.open(message, 'Dismiss', { duration: 7000 });
    } finally { clearInterval(this.timer); this.elapsed.set(Math.round(performance.now() - started)); }
  }
  async copy() {
    try { await navigator.clipboard.writeText(this.result()?.result ?? ''); this.snack.open('Answer copied', 'Dismiss', { duration: 2000 }); }
    catch { this.snack.open('Clipboard unavailable. Select the answer to copy it.', 'Dismiss', { duration: 4000 }); }
  }
  ngOnDestroy() { clearInterval(this.timer); }
}
