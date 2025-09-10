import { describe, it, expect } from 'vitest';
import { POST } from './route';

describe('generate-job API', () => {
  it('returns 400 when keywords missing', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
