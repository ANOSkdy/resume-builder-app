import { describe, it, expect, vi } from 'vitest';

vi.mock('next/server', () => ({
  NextResponse: {
    json: (data, init) => ({
      status: init?.status ?? 200,
      json: async () => data,
    }),
  },
}));

vi.mock('@google/generative-ai', () => {
  const generateContentMock = vi.fn().mockResolvedValue({
    response: {
      text: () => 'mocked text',
    },
  });
  const getGenerativeModelMock = vi.fn(() => ({
    generateContent: generateContentMock,
  }));
  class GoogleGenerativeAI {
    constructor() {
      this.getGenerativeModel = getGenerativeModelMock;
    }
  }
  return {
    GoogleGenerativeAI,
    getGenerativeModelMock,
  };
});

describe('generate-text API route', () => {
  it('uses gemini-pro model when generating text', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    const { POST } = await import('./route');
    const { getGenerativeModelMock } = await import('@google/generative-ai');

    const request = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keywords: 'teamwork',
        context: { histories: [] },
      }),
    });

    const response = await POST(request);
    expect(getGenerativeModelMock).toHaveBeenCalledWith({ model: 'gemini-pro' });
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual({ generatedText: 'mocked text' });
  });
});
