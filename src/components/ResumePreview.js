// src/components/ResumePreview.js
'use client';

import React, { useState } from 'react';
import { useResumeStore } from '@/store/resumeStore';

const ResumePreview = React.forwardRef((props, ref) => {
  const {
    // data
    profile,
    histories,
    licenses,
    motivation,
    selfPromotion,
    requests,

    // profile updaters
    updateProfile,
    updateDate,
    updateBirthdate,

    // history updaters
    updateHistory,
    addHistory,
    deleteHistory,

    // license updaters
    updateLicense,
    addLicense,
    deleteLicense,

    // free text updaters
    updateMotivation,
    updateSelfPromotion,
    updateRequests,

    // photo state (ヘッダー側の「写真を選択」で設定)
    photoUrl,
    clearPhoto,
  } = useResumeStore();

  // --- AI機能用（自己PR）
  const [aiKeywords, setAiKeywords] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState('');

  // --- AI機能用（志望動機）
  const [motKeywords, setMotKeywords] = useState('');
  const [isMotGenerating, setIsMotGenerating] = useState(false);
  const [motError, setMotError] = useState('');

  const getAge = (birthdate) => {
    if (!birthdate?.year || !birthdate?.month || !birthdate?.day) return '';
    try {
      const today = new Date();
      const birthDate = new Date(
        parseInt(birthdate.year, 10),
        parseInt(birthdate.month, 10) - 1,
        parseInt(birthdate.day, 10)
      );
      if (isNaN(birthDate.getTime())) return '';
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
      return age >= 0 ? age : '';
    } catch {
      return '';
    }
  };

  // --- AI生成（自己PR）
  const handleGenerateSelfPR = async () => {
    setIsGenerating(true);
    setAiError('');
    try {
      const res = await fetch('/api/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: 'self_pr',
          keywords: aiKeywords,
          context: { histories, licenses },
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'AIの生成に失敗しました。');
      }
      const data = await res.json();
      updateSelfPromotion(data.generatedText || '');
    } catch (e) {
      setAiError(e.message || 'エラーが発生しました');
    } finally {
      setIsGenerating(false);
    }
  };

  // --- AI生成（志望動機）
  const handleGenerateMotivation = async () => {
    setIsMotGenerating(true);
    setMotError('');
    try {
      const res = await fetch('/api/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: 'motivation',
          keywords: motKeywords,
          context: { histories, licenses },
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'AIの生成に失敗しました。');
      }
      const data = await res.json();
      updateMotivation(data.generatedText || '');
    } catch (e) {
      setMotError(e.message || 'エラーが発生しました');
    } finally {
      setIsMotGenerating(false);
    }
  };

  // 表示制御ヘルパ
  const normalize = (s) => (s || '').replace(/[\s\u3000]/g, '');
  const isLabelRow = (entry) => {
    const n = normalize(entry?.description || '');
    return n === '学歴' || n === '職歴';
  };
  const isEndMarker = (entry) =>
    normalize(entry?.description || '') === '以上' || entry.type === 'footer';

  return (
    <div ref={ref} className="resume-container">
      <div className="title-row">
        <h1>履 歴 書</h1>
        <div className="date-field horizontal-value">
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => updateDate('year', e.currentTarget.innerText)}
          >
            {profile.date.year}
          </div>
          年
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => updateDate('month', e.currentTarget.innerText)}
          >
            {profile.date.month}
          </div>
          月
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => updateDate('day', e.currentTarget.innerText)}
          >
            {profile.date.day}
          </div>
          日 現在
        </div>
      </div>

      <div className="profile-grid">
        <div className="cell p-furigana-label">
          <label>ふりがな</label>
        </div>
        <div
          className="cell p-furigana-value single-line-input"
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) =>
            updateProfile('nameFurigana', e.currentTarget.innerText)
          }
          data-placeholder="りれき しょうこ"
        >
          {profile.nameFurigana}
        </div>

        {/* 証明写真枠（枠内アップロードはしない。表示＋削除のみ） */}
        <div className={`cell p-photo ${photoUrl ? 'has-image' : ''}`}>
          {photoUrl ? (
            <>
              <img src={photoUrl} alt="証明写真" />
              <button
                type="button"
                className="photo-delete-btn"
                onClick={clearPhoto}
                aria-label="証明写真を削除"
                title="証明写真を削除"
              >
                ×
              </button>
            </>
          ) : (
            <span style={{ color: '#aaa' }}>（写真未設定）</span>
          )}
        </div>

        <div className="cell p-name-label">
          <label>氏 名</label>
        </div>
        {/* 氏名：入力は自然に、フォーカスアウトで大文字保存 */}
        <div
          className="cell p-name-value single-line-input name-uppercase"
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => {
            const v = (e.currentTarget.innerText || '').toUpperCase();
            updateProfile('name', v);
            e.currentTarget.innerText = v;
          }}
          data-placeholder="履歴 証子"
        >
          {profile.name}
        </div>

        <div className="cell p-birthdate-value horizontal-value">
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) =>
              updateBirthdate('year', e.currentTarget.innerText)
            }
          >
            {profile.birthdate.year}
          </div>
          年
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) =>
              updateBirthdate('month', e.currentTarget.innerText)
            }
          >
            {profile.birthdate.month}
          </div>
          月
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => updateBirthdate('day', e.currentTarget.innerText)}
          >
            {profile.birthdate.day}
          </div>
          日生 <span>（満 {getAge(profile.birthdate)} 歳）</span>
        </div>

        <div className="cell p-address-label">
          <label>現住所</label>
        </div>
        <div
          className="cell p-address-value single-line-input"
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => updateProfile('address', e.currentTarget.innerText)}
          data-placeholder="〒100-0001 東京都千代田区千代田1-1"
        >
          {profile.address}
        </div>

        <div className="cell p-contact-label">
          <label>※連絡先</label>
        </div>
        <div
          className="cell p-contact-value single-line-input"
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => updateProfile('contact', e.currentTarget.innerText)}
          data-placeholder="同上"
        >
          {profile.contact}
        </div>

        <div className="cell p-tel-label">
          <label>電話</label>
        </div>
        <div
          className="cell p-tel-value single-line-input"
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => updateProfile('phone', e.currentTarget.innerText)}
        >
          {profile.phone}
        </div>

        <div className="cell p-email-label">
          <label>Email</label>
        </div>
        <div
          className="cell p-email-value single-line-input"
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => updateProfile('email', e.currentTarget.innerText)}
        >
          {profile.email}
        </div>
      </div>

      {/* 学歴・職歴 */}
      <div className="history-grid">
        <div className="cell h-year-h">年</div>
        <div className="cell h-month-h">月</div>
        <div className="cell h-desc-h">学 歴 ・ 職 歴</div>

        {histories.map((entry, index) => {
          if (isLabelRow(entry) || isEndMarker(entry)) return null;
          const editable = entry.type !== 'header' && entry.type !== 'footer';
          return (
            <React.Fragment key={entry.id}>
              <div
                className="cell h-year dynamic-row"
                contentEditable={editable}
                suppressContentEditableWarning
                onBlur={(e) =>
                  updateHistory(entry.id, 'year', e.currentTarget.innerText)
                }
              >
                {entry.year}
              </div>
              <div
                className="cell h-month"
                contentEditable={editable}
                suppressContentEditableWarning
                onBlur={(e) =>
                  updateHistory(entry.id, 'month', e.currentTarget.innerText)
                }
              >
                {entry.month}
              </div>
              <div className="cell h-desc">
                {editable ? (
                  <>
                    <div
                      className="h-desc-input"
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) =>
                        updateHistory(
                          entry.id,
                          'description',
                          e.currentTarget.innerText
                        )
                      }
                      data-placeholder="〇〇大学〇〇学部 入学"
                    >
                      {entry.description}
                    </div>
                    <div className="row-controls">
                      <button
                        className="control-btn add-btn"
                        onClick={() => addHistory(index + 1)}
                      >
                        +
                      </button>
                      <button
                        className="control-btn delete-btn"
                        onClick={() => deleteHistory(entry.id)}
                      >
                        ×
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ width: '100%' }}>{entry.description}</div>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* 免許・資格 */}
      <div className="history-grid license-grid">
        <div className="cell h-year-h">年</div>
        <div className="cell h-month-h">月</div>
        <div className="cell h-desc-h">免 許 ・ 資 格</div>
        {licenses.map((entry, index) => (
          <React.Fragment key={entry.id}>
            <div
              className="cell h-year dynamic-row"
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) =>
                updateLicense(entry.id, 'year', e.currentTarget.innerText)
              }
            >
              {entry.year}
            </div>
            <div
              className="cell h-month"
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) =>
                updateLicense(entry.id, 'month', e.currentTarget.innerText)
              }
            >
              {entry.month}
            </div>
            <div className="cell h-desc">
              <div
                style={{ width: '100%' }}
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) =>
                  updateLicense(
                    entry.id,
                    'description',
                    e.currentTarget.innerText
                  )
                }
                data-placeholder="普通自動車第一種運転免許 取得"
              >
                {entry.description}
              </div>
              <div className="row-controls">
                <button
                  className="control-btn add-btn"
                  onClick={() => addLicense(index + 1)}
                >
                  +
                </button>
                <button
                  className="control-btn delete-btn"
                  onClick={() => deleteLicense(entry.id)}
                >
                  ×
                </button>
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* 志望の動機 */}
      <div className="free-text-grid motivation-grid">
        <div className="cell f-header">志望の動機</div>
        <div
          className="cell f-content"
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => updateMotivation(e.currentTarget.innerText)}
          data-placeholder="貴社の〇〇というビジョンに共感し…"
        >
          {motivation}
        </div>
        {/* 志望動機：AI生成UI */}
        <div className="ai-controls">
          <input
            type="text"
            value={motKeywords}
            onChange={(e) => setMotKeywords(e.target.value)}
            placeholder="志望動機に入れたいキーワード (例: 事業貢献, 新規開発, 顧客志向)"
            className="ai-keyword-input"
            disabled={isMotGenerating}
          />
          <button
            onClick={handleGenerateMotivation}
            className="ai-generate-btn"
            disabled={isMotGenerating || !motKeywords}
          >
            {isMotGenerating ? '生成中...' : 'AIで志望動機を生成'}
          </button>
          {motError && <p className="ai-error-message">{motError}</p>}
        </div>
      </div>

      {/* 自己PR・本人希望 */}
      <div className="free-text-grid requests-grid">
        <div className="cell f-header">自己PR、本人希望記入欄など</div>
        <div
          className="cell f-content"
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => updateSelfPromotion(e.currentTarget.innerText)}
          data-placeholder="私の強みは〇〇です…"
        >
          {selfPromotion}
        </div>

        {/* 自己PR：AI生成UI */}
        <div className="ai-controls">
          <input
            type="text"
            value={aiKeywords}
            onChange={(e) => setAiKeywords(e.target.value)}
            placeholder="アピールしたいキーワード (例: 挑戦心, リーダーシップ)"
            className="ai-keyword-input"
            disabled={isGenerating}
          />
          <button
            onClick={handleGenerateSelfPR}
            className="ai-generate-btn"
            disabled={isGenerating || !aiKeywords}
          >
            {isGenerating ? '生成中...' : 'AIで文章を生成'}
          </button>
          {aiError && <p className="ai-error-message">{aiError}</p>}
        </div>
      </div>
    </div>
  );
});

ResumePreview.displayName = 'ResumePreview';
export default ResumePreview;
