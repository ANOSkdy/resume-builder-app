// src/components/JobPreview.js
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useResumeStore } from '@/store/resumeStore';

function extractCompanies(resume = {}) {
  const list = [];
  if (Array.isArray(resume.employmentHistory)) {
    for (const e of resume.employmentHistory) {
      list.push(e?.company || e?.name || '');
    }
  } else if (Array.isArray(resume.jobs)) {
    for (const j of resume.jobs) {
      list.push(j?.company || j?.name || '');
    }
  } else if (Array.isArray(resume.histories)) {
    let inWork = false;
    const normalize = (s) => (s || '').replace(/[\s\u3000]/g, '');
    for (const h of resume.histories) {
      const desc = h?.description || '';
      if (h.type === 'header' && normalize(desc) === '職歴') {
        inWork = true;
        continue;
      }
      if (!inWork) continue;
      if (h.type === 'footer') break;
      if (h.type === 'entry' && /(入社|入所|配属|参画)/.test(desc)) {
        const name = (desc.split(/[ \u3000]/)[0] || '').trim();
        list.push(name);
      }
    }
  }
  const unique = [...new Set(list)];
  return unique.map((c, i) => c || `会社${i + 1}`);
}

const JobPreview = React.forwardRef((props, ref) => {
  const {
    histories,
    employmentHistory,
    jobs,
    jobSummary,
    jobDetails,
    setJobSummary,
    setJobDetails,
    upsertJobDetail,
  } = useResumeStore();

  const companies = useMemo(
    () => extractCompanies({ histories, employmentHistory, jobs }),
    [histories, employmentHistory, jobs]
  );

  useEffect(() => {
    setJobDetails(jobDetails);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companies.join('|')]);

  const [kw, setKw] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleGenerateAll = async () => {
    setLoading(true);
    setErr('');
    try {
      const res = await fetch('/api/generate-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: kw,
          context: { histories },
          companies,
        }),
      });
      const data = await res.json();
      const nextSummary =
        data.summary ?? data.summaryText ?? data.generatedText ?? data.text ?? '';
      let details = Array.isArray(data.details) ? data.details : [];
      if (details.length && typeof details[0] === 'string') {
        details = details.map((d, i) => ({
          company: companies[i] || `会社${i + 1}`,
          detail: d,
        }));
      }
      const normalized = companies.map((company, i) => {
        const found = details.find((d) => d?.company === company);
        return { company, detail: found?.detail || '' };
      });

      setJobSummary(nextSummary);
      setJobDetails(normalized);
      if (!res.ok || data.ok === false) {
        setErr(data.error || 'AI生成に失敗しました。');
      }
    } catch (e) {
      setJobSummary('');
      setJobDetails([]);
      setErr(e?.message || 'AI生成に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={ref} className="resume-container">
      <div className="title-row">
        <h1>職 務 経 歴 書</h1>
        <div />
      </div>

      <div className="free-text-grid motivation-grid">
        <div className="cell f-header">職務経歴要約</div>
        <div
          className="cell f-content"
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => setJobSummary(e.currentTarget.innerText)}
          data-placeholder="履歴書の職歴を参考に、要約を記載します（AIボタンでも自動生成できます）"
        >
          {jobSummary}
        </div>
      </div>

      {companies.map((company, idx) => (
        <div className="free-text-grid requests-grid" key={company + idx}>
          <div className="cell f-header">職務経歴詳細（{company}）</div>
          <div
            className="cell f-content"
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => upsertJobDetail(idx, e.currentTarget.innerText)}
            data-placeholder="こちらに当該企業での担当業務・実績・工夫・成果などを記載してください"
          >
            {jobDetails?.[idx]?.detail || ''}
          </div>
        </div>
      ))}

      <div className="ai-controls" style={{ marginTop: 8 }}>
        <input
          type="text"
          className="ai-keyword-input"
          placeholder="下書きに入れたいキーワード（任意）"
          value={kw}
          onChange={(e) => setKw(e.target.value)}
          disabled={loading}
        />
        <button
          onClick={handleGenerateAll}
          className="ai-generate-btn"
          disabled={loading}
        >
          {loading ? '生成中…' : 'AIで職務経歴を生成'}
        </button>
        {err && <p className="ai-error-message">{err}</p>}
      </div>
    </div>
  );
});

JobPreview.displayName = 'JobPreview';
export default JobPreview;

