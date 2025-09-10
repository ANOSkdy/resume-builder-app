import { describe, it, expect } from 'vitest';
import { useResumeStore } from './resumeStore';

describe('resumeStore job fields', () => {
  it('updates job summary and details', () => {
    const { updateJobSummary, updateJobDetails } = useResumeStore.getState();
    updateJobSummary('summary');
    updateJobDetails('details');
    const { jobSummary, jobDetails } = useResumeStore.getState();
    expect(jobSummary).toBe('summary');
    expect(jobDetails).toBe('details');
  });
});
