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
  useResumeStore.setState({
    jobSummary: '',
    jobDetails: [],
    histories: [
      { id: 'h1', type: 'header', year: '', month: '', description: '職 歴' },
      { id: 'h2', type: 'entry', year: '', month: '', description: 'A社 入社' },
      { id: 'h3', type: 'entry', year: '', month: '', description: 'B社 入社' },
      { id: 'h4', type: 'footer', year: '', month: '', description: '以 上' },
    ],
  });
});

describe('resumeStore job fields', () => {
  it('normalizes details to company list', () => {
    const { setJobSummary, setJobDetails, upsertJobDetail } =
      useResumeStore.getState();
    setJobSummary('summary');
    setJobDetails([{ company: 'A社', detail: 'a' }]);
    upsertJobDetail(1, 'updated');
    const state = useResumeStore.getState();
    expect(state.jobSummary).toBe('summary');
    expect(state.jobDetails).toEqual([
      { company: 'A社', detail: 'a' },
      { company: 'B社', detail: 'updated' },
    ]);
  });
});
