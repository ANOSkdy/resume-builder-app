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
  useResumeStore.setState({ jobSummary: '', jobDetails: '' });
});

describe('resumeStore job fields', () => {
  it('updates job summary and details', () => {
    const { updateJobSummary, updateJobDetails } = useResumeStore.getState();
    updateJobSummary('summary');
    updateJobDetails('details');
    const state = useResumeStore.getState();
    expect(state.jobSummary).toBe('summary');
    expect(state.jobDetails).toBe('details');
  });
});
