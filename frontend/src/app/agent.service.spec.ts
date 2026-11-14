import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AgentService, readEvents } from './agent.service';

describe('AgentService', () => {
  let service: AgentService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AgentService); http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('checks health without requesting a key', () => {
    service.health().subscribe(h => expect(h.api_key_configured).toBe(false));
    http.expectOne('/api/health').flush({ status: 'ok', api_key_configured: false });
  });
  it('posts a typed prompt', () => {
    service.query('Hello').subscribe(r => expect(r.result).toBe('Hi'));
    const request = http.expectOne('/api/agent/query');
    expect(request.request.method).toBe('POST'); expect(request.request.body).toEqual({ prompt: 'Hello' });
    request.flush({ result: 'Hi', num_turns: 1, duration_ms: 12, total_cost_usd: null, is_error: false });
  });
  it('parses UTF-8, CRLF and frames split across single-byte chunks', async () => {
    const bytes = new TextEncoder().encode('event: message\r\ndata: {"text":"héllo"}\r\n\r\nevent: done\ndata: {}\n\n');
    const body = new ReadableStream<Uint8Array>({ start(c) { for (const b of bytes) c.enqueue(new Uint8Array([b])); c.close(); } });
    const events: unknown[] = [];
    await readEvents(body, (event, data) => events.push({ event, data }));
    expect(events).toEqual([{ event: 'message', data: { text: 'héllo' } }, { event: 'done', data: {} }]);
  });
  it('surfaces errors and rejects incomplete streams', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    fetchMock.mockResolvedValueOnce(new Response('event: error\ndata: {"detail":"Try again"}\n\n'));
    await expect(service.stream('Hi', () => {})).rejects.toThrow('Try again');
    fetchMock.mockResolvedValueOnce(new Response('event: message\ndata: {}\n\n'));
    await expect(service.stream('Hi', () => {})).rejects.toThrow('before the agent finished');
    fetchMock.mockRestore();
  });
});
