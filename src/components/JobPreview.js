'use client';

import React, { useState } from 'react';
import { useResumeStore } from '@/store/resumeStore';

const JobPreview = React.forwardRef((props, ref) => {
  const {
    histories,
    jobSummary,
    jobDetails,
    updateJobSummary,
    updateJobDetails,
  } = useResumeStore();

  const [keywords, setKeywords] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');
    try {
      const res = await fetch('/api/generate-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords, context: { histories } }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'AIの生成に失敗しました。');
      }
      const data = await res.json();
      updateJobSummary(data.summary || '');
      updateJobDetails(data.details || '');
    } catch (e) {
      setError(e.message || 'エラーが発生しました');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="resume-container job-preview" ref={ref}>
      <div className="title-row">
        <h1>職 務 経 歴 書</h1>
      </div>

      <div className="free-text-grid">
        <div className="cell f-header">職務経歴要約</div>
        <div
          className="cell f-content"
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => updateJobSummary(e.currentTarget.innerText)}
          data-placeholder="これまでの経験を簡潔にまとめてください"
        >
          {jobSummary}
        </div>
      </div>

      <div className="free-text-grid" style={{ marginTop: '20px' }}>
        <div className="cell f-header">職務経歴詳細</div>
        <div
          className="cell f-content"
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => updateJobDetails(e.currentTarget.innerText)}
          data-placeholder="職務内容を詳しく記載してください"
        >
          {jobDetails}
        </div>
      </div>

      <div className="ai-controls">
        <input
          type="text"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="文章に入れたいキーワード"
          className="ai-keyword-input"
          disabled={isGenerating}
          aria-label="AI生成用キーワード"
        />
        <button
          onClick={handleGenerate}
          className="ai-generate-btn"
          disabled={isGenerating || !keywords}
          aria-label="AIで職務経歴生成"
        >
          {isGenerating ? '生成中...' : 'AIで職務経歴生成'}
        </button>
        {error && <p className="ai-error-message">{error}</p>}
      </div>
    </div>
  );
});

JobPreview.displayName = 'JobPreview';
export default JobPreview;

