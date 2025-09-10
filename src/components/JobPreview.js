// src/components/JobPreview.js
'use client';

import React, { useState } from 'react';
import { useResumeStore } from '@/store/resumeStore';

function stripMarkdownFences(s = '') {
  // ```json ... ``` や ``` ... ``` を除去
  return s.replace(/```[\s\S]*?```/g, '').trim();
}

function tryExtractFromJson(text) {
  const cleaned = stripMarkdownFences(text);
  try {
    const obj = JSON.parse(cleaned);
    return {
      summary: String(obj.summary ?? ''),
      details: String(obj.details ?? ''),
    };
  } catch {
    return { summary: cleaned, details: '' };
  }
}

const JobPreview = React.forwardRef((props, ref) => {
  const {
    histories,
    jobSummary,
    jobDetails,
    updateJobSummary,
    updateJobDetails,
  } = useResumeStore();

  const [kw, setKw] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const handleGenerate = async () => {
    setBusy(true);
    setErr('');
    try {
      const res = await fetch('/api/generate-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: kw,
          histories,
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || 'AI生成に失敗しました');
      }
      const data = await res.json();
      let summaryText = data.summaryText ?? data.text ?? '';
      let detailsText = data.detailsText ?? '';
      if (!detailsText) {
        const extracted = tryExtractFromJson(summaryText);
        summaryText = extracted.summary || summaryText;
        detailsText = extracted.details || detailsText;
      } else {
        summaryText = stripMarkdownFences(summaryText);
        detailsText = stripMarkdownFences(detailsText);
      }
      updateJobSummary(summaryText || '');
      updateJobDetails(detailsText || '');
    } catch (e) {
      setErr(e.message || 'エラーが発生しました');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div ref={ref} className="resume-container">
      <div className="title-row">
        <h1>職 務 経 歴 書</h1>
        <div />
      </div>

      <div className="free-text-grid">
        <div className="cell f-header">職務経歴要約</div>
        <div
          className="cell f-content"
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => updateJobSummary(e.currentTarget.innerText)}
          data-placeholder="履歴書の「職歴」をもとに概要が入ります（AI生成または手入力）"
        >
          {jobSummary}
        </div>
      </div>

      <div className="free-text-grid" style={{ marginTop: 10 }}>
        <div className="cell f-header">職務経歴詳細</div>
        <div
          className="cell f-content"
          style={{ minHeight: 220 }}
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => updateJobDetails(e.currentTarget.innerText)}
          data-placeholder="履歴書の「職歴」をもとに、担当業務・役割・実績などを詳述（AI生成または手入力）"
        >
          {jobDetails}
        </div>
      </div>

      <div className="ai-controls">
        <input
          type="text"
          className="ai-keyword-input"
          placeholder="下書きに入れたいキーワード（例: ERP導入, DX, リーダー経験）"
          value={kw}
          onChange={(e) => setKw(e.target.value)}
          disabled={busy}
        />
        <button
          className="ai-generate-btn"
          onClick={handleGenerate}
          disabled={busy}
          title="履歴書の職歴を参照して要約と詳細を下書き生成"
        >
          {busy ? '生成中…' : 'AIで職務経歴を生成'}
        </button>
        {err && <p className="ai-error-message">{err}</p>}
      </div>
    </div>
  );
});

JobPreview.displayName = 'JobPreview';
export default JobPreview;

