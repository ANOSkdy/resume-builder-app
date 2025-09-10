import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockStorage = (() => {
  let store = {};
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = value;
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

vi.stubGlobal('localStorage', mockStorage);

const { useResumeStore } = await import('./resumeStore');

beforeEach(() => {
  useResumeStore.setState({ jobSummary: '', jobDetails: [] });
});

describe('resumeStore job fields', () => {
  it('updates job summary and details array', () => {
    const { updateJobSummary, setJobDetails, updateJobDetail } = useResumeStore.getState();
    updateJobSummary('summary');
    setJobDetails(['a', 'b']);
    updateJobDetail(1, 'updated');
    const state = useResumeStore.getState();
    expect(state.jobSummary).toBe('summary');
    expect(state.jobDetails).toEqual(['a', 'updated']);
  });
});
