import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('next/server', () => ({
  NextResponse: {
    json: (data, init) => ({
      status: init?.status ?? 200,
      json: async () => data,
    }),
  },
}));

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn();
});

afterEach(() => {
  global.fetch = originalFetch;
  delete process.env.GEMINI_API_KEY;
  vi.resetModules();
});

describe('generate-text API route', () => {
  it('uses gemini-pro model when generating text', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    const { POST } = await import('./route');

    const mockJson = vi.fn().mockResolvedValue({
      candidates: [
        {
          content: {
            parts: [{ text: 'mocked text' }],
          },
        },
      ],
    });

    global.fetch.mockResolvedValue({
      ok: true,
      json: mockJson,
    });

    const request = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keywords: 'teamwork',
        context: { histories: [] },
      }),
    });

    const response = await POST(request);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const fetchCall = global.fetch.mock.calls[0];
    expect(fetchCall[0]).toBe(
      'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=test-key'
    );
    const body = JSON.parse(fetchCall[1].body);
    expect(body).toEqual({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: expect.stringContaining('アピールしたいキーワード'),
            },
          ],
        },
      ],
    });
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual({ generatedText: 'mocked text' });
  });
});
