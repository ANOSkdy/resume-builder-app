import { describe, it, expect } from 'vitest';
import { POST } from './route';

describe('generate-job API', () => {
  it('returns structured error when API key missing', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keywords: 'test', context: { histories: [] } }),
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json).toEqual({
      ok: false,
      summary: '',
      details: [],
      error: 'Gemini APIキーが未設定です',
    });
  });
});
