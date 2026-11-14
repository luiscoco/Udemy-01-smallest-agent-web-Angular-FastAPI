import { Component, input } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { AgentMessage } from './agent.service';
import { CodeBlock } from './code-block';

export interface TimelineMessage extends AgentMessage { elapsed: number; }

@Component({
  selector: 'app-stream-inspector', imports: [JsonPipe, CodeBlock],
  template: `
    <section class="panel inspector" aria-labelledby="stream-title">
      <div class="panel-heading"><div><span class="eyebrow">INSIDE THE AGENT</span><h2 id="stream-title">Message stream</h2></div><span class="count">{{ messages().length }} events</span></div>
      <p class="panel-description">Look inside query(): follow initialization, assistant messages, and the final result. Expand any event to inspect its safe JSON.</p>
      <div class="timeline" aria-live="polite" aria-relevant="additions">
        @for (message of messages(); track $index) {
          <article class="timeline-row">
            <span class="timeline-dot" [attr.data-type]="message.type"></span>
            <div class="event-body"><div class="event-heading"><span class="badge" [attr.data-type]="message.type">{{ message.type }}</span><time>+{{ message.elapsed }} ms</time></div>
            <p>{{ message.summary }}</p>
            <details><summary>View JSON details</summary><app-code-block [code]="(message.data | json) ?? ''" language="json"/></details></div>
          </article>
        } @empty {
          <div class="empty-stream"><span class="empty-symbol" aria-hidden="true">⌁</span><h3>{{ mode() === 'simple' ? 'Simple mode shows the final answer' : 'Your agent’s journey starts here' }}</h3><p>{{ mode() === 'simple' ? 'Switch to Stream before your next run to inspect individual SDK messages.' : 'Run a prompt in Stream mode to see real messages as they arrive.' }}</p><div class="sample-flow" aria-label="Illustrative message sequence, not a live result">System <span>→</span> Assistant <span>→</span> Result</div></div>
        }
      </div>
    </section>`,
})
export class StreamInspector {
  messages = input<TimelineMessage[]>([]);
  mode = input('stream');
}
