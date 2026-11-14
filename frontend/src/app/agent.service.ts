import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface AgentResult {
  result: string; num_turns: number; duration_ms: number;
  total_cost_usd: number | null; is_error: boolean;
}
export interface AgentMessage {
  type: string; summary: string; data: Partial<AgentResult> & Record<string, unknown>;
}
export interface Health { status: string; api_key_configured: boolean; }

// SSE can span arbitrary network chunks, including the middle of a UTF-8 character.
export async function readEvents(body: ReadableStream<Uint8Array>, onEvent: (event: string, data: unknown) => void) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      buffer = buffer.replace(/\r\n/g, '\n');
      let boundary: number;
      while ((boundary = buffer.indexOf('\n\n')) >= 0) {
        const frame = buffer.slice(0, boundary); buffer = buffer.slice(boundary + 2);
        let event = 'message'; const data: string[] = [];
        for (const line of frame.split('\n')) {
          if (line.startsWith('event:')) event = line.slice(6).trim();
          if (line.startsWith('data:')) data.push(line.slice(5).trimStart());
        }
        if (data.length) onEvent(event, JSON.parse(data.join('\n')));
      }
      if (done) break;
    }
  } finally { reader.releaseLock(); }
}

@Injectable({ providedIn: 'root' })
export class AgentService {
  private http = inject(HttpClient);
  health() { return this.http.get<Health>('/api/health'); }
  query(prompt: string) { return this.http.post<AgentResult>('/api/agent/query', { prompt }); }
  async stream(prompt: string, onMessage: (message: AgentMessage) => void) {
    const response = await fetch('/api/agent/stream', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }),
    });
    if (!response.ok || !response.body) throw new Error('The API could not start the stream. Check the backend.');
    let completed = false;
    await readEvents(response.body, (event, data) => {
      if (event === 'error') throw new Error((data as { detail: string }).detail);
      if (event === 'done') completed = true;
      if (event === 'message') onMessage(data as AgentMessage);
    });
    if (!completed) throw new Error('The connection ended before the agent finished. Please try again.');
  }
}
