import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Gemini migration notes', () => {
  it('documents the recommended model version explicitly', () => {
    const doc = readFileSync(resolve(process.cwd(), 'docs/gemini-analysis.md'), 'utf8');
    expect(doc).toContain('gemini-1.5-flash-002');
  });
});
