// src/components/JobPreview.js
'use client';

import React, { useState } from 'react';
import { useResumeStore } from '@/store/resumeStore';

const JobPreview = React.forwardRef((props, ref) => {
  const {
    jobSummary,
    jobDetails,
    histories,
    licenses,
    profile,
    updateJobSummary,
    updateJobDetails,
  } = useResumeStore();

  const [keywords, setKeywords] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState('');

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    setAiError('');
    try {
      const res = await fetch('/api/generate-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords,
          context: { histories, licenses, profile },
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'AIの生成に失敗しました。');
      }
      const data = await res.json();
      updateJobSummary(data.generatedText || '');
    } catch (e) {
      setAiError(e.message || 'エラーが発生しました');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="resume-container job-preview" ref={ref}>
      <div className="title-row">
        <h1>職務経歴書</h1>
      </div>

      <div className="free-text-grid">
        <div className="cell f-header">職務経歴要約</div>
        <div
          className="cell f-content"
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => updateJobSummary(e.currentTarget.innerText)}
          data-placeholder="これまでの経験を簡潔にまとめましょう"
        >
          {jobSummary}
        </div>
        <div className="ai-controls">
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="要約に入れたいキーワード"
            className="ai-keyword-input"
            disabled={isGenerating}
          />
          <button
            onClick={handleGenerateSummary}
            className="ai-generate-btn"
            disabled={isGenerating || !keywords}
          >
            {isGenerating ? '生成中...' : 'AIで要約を生成'}
          </button>
          {aiError && <p className="ai-error-message">{aiError}</p>}
        </div>
      </div>

      <div className="free-text-grid" style={{ marginTop: 20 }}>
        <div className="cell f-header">職務経歴詳細</div>
        <div
          className="cell f-content"
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => updateJobDetails(e.currentTarget.innerText)}
          data-placeholder="詳細な業務内容を記載しましょう"
        >
          {jobDetails}
        </div>
      </div>
    </div>
  );
});

JobPreview.displayName = 'JobPreview';
export default JobPreview;
