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

  const [summaryKeywords, setSummaryKeywords] = useState('');
  const [detailKeywords, setDetailKeywords] = useState('');
  const [isSummaryGenerating, setIsSummaryGenerating] = useState(false);
  const [isDetailGenerating, setIsDetailGenerating] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [detailError, setDetailError] = useState('');

  const handleGenerate = async (
    target,
    keywords,
    setError,
    setLoading,
    updater
  ) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/generate-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, keywords, context: { histories } }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'AIの生成に失敗しました。');
      }
      const data = await res.json();
      if (target === 'summary') updater(data.jobSummary || '');
      if (target === 'detail') updater(data.jobDetails || '');
    } catch (e) {
      setError(e.message || 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="resume-container job-preview" ref={ref}>
      <div className="free-text-grid">
        <div className="cell f-header">職務要約</div>
        <div
          className="cell f-content"
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => updateJobSummary(e.currentTarget.innerText)}
          data-placeholder="これまでの経験を簡潔にまとめてください"
        >
          {jobSummary}
        </div>
        <div className="ai-controls">
          <input
            type="text"
            value={summaryKeywords}
            onChange={(e) => setSummaryKeywords(e.target.value)}
            placeholder="要約に入れたいキーワード"
            className="ai-keyword-input"
            disabled={isSummaryGenerating}
          />
          <button
            onClick={() =>
              handleGenerate(
                'summary',
                summaryKeywords,
                setSummaryError,
                setIsSummaryGenerating,
                updateJobSummary
              )
            }
            className="ai-generate-btn"
            disabled={isSummaryGenerating || !summaryKeywords}
          >
            {isSummaryGenerating ? '生成中...' : 'AIで要約生成'}
          </button>
          {summaryError && <p className="ai-error-message">{summaryError}</p>}
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
        <div className="ai-controls">
          <input
            type="text"
            value={detailKeywords}
            onChange={(e) => setDetailKeywords(e.target.value)}
            placeholder="詳細に入れたいキーワード"
            className="ai-keyword-input"
            disabled={isDetailGenerating}
          />
          <button
            onClick={() =>
              handleGenerate(
                'detail',
                detailKeywords,
                setDetailError,
                setIsDetailGenerating,
                updateJobDetails
              )
            }
            className="ai-generate-btn"
            disabled={isDetailGenerating || !detailKeywords}
          >
            {isDetailGenerating ? '生成中...' : 'AIで詳細生成'}
          </button>
          {detailError && <p className="ai-error-message">{detailError}</p>}
        </div>
      </div>
    </div>
  );
});

JobPreview.displayName = 'JobPreview';
export default JobPreview;

