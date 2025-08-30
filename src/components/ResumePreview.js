'use client';

import React, { useState } from 'react';
import { useResumeStore } from '@/store/resumeStore';

const ResumePreview = React.forwardRef((props, ref) => {
  const {
    profile,
    histories,
    licenses,
    motivation,
    selfPromotion,
    requests,
    updateProfile,
    updateDate,
    updateBirthdate,
    updateHistory,
    addHistory,
    deleteHistory,
    updateLicense,
    addLicense,
    deleteLicense,
    updateMotivation,
    updateSelfPromotion,
    updateRequests,
  } = useResumeStore();

  // AI機能用の状態管理
  const [aiKeywords, setAiKeywords] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState('');

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

  // AI生成ボタンがクリックされたときの処理（自己PRに反映）
  const handleGenerateText = async () => {
    setIsGenerating(true);
    setAiError('');
    try {
      const response = await fetch('/api/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: aiKeywords,
          context: { histories }
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'AIの生成に失敗しました。');
      }
      const data = await response.json();
      updateSelfPromotion(data.generatedText); // 自己PR欄に反映
    } catch (error) {
      setAiError(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div ref={ref} className="resume-container">
      <div className="title-row">
        <h1>履 歴 書</h1>
        <div className="date-field horizontal-value">
          <div contentEditable suppressContentEditableWarning onBlur={(e) => updateDate('year', e.currentTarget.innerText)}>{profile.date.year}</div>年
          <div contentEditable suppressContentEditableWarning onBlur={(e) => updateDate('month', e.currentTarget.innerText)}>{profile.date.month}</div>月
          <div contentEditable suppressContentEditableWarning onBlur={(e) => updateDate('day', e.currentTarget.innerText)}>{profile.date.day}</div>日 現在
        </div>
      </div>

      <div className="profile-grid">
        <div className="cell p-furigana-label"><label>ふりがな</label></div>
        <div className="cell p-furigana-value single-line-input" contentEditable suppressContentEditableWarning onBlur={(e) => updateProfile('nameFurigana', e.currentTarget.innerText)} data-placeholder="りれき しょうこ">{profile.nameFurigana}</div>
        <div className="cell p-photo" rowSpan="5">証明写真</div>
        <div className="cell p-name-label"><label>氏 名</label></div>
        <div className="cell p-name-value single-line-input" contentEditable suppressContentEditableWarning onBlur={(e) => updateProfile('name', e.currentTarget.innerText)} data-placeholder="履歴 証子">{profile.name}</div>
        <div className="cell p-birthdate-value horizontal-value">
          <div contentEditable suppressContentEditableWarning onBlur={(e) => updateBirthdate('year', e.currentTarget.innerText)}>{profile.birthdate.year}</div>年
          <div contentEditable suppressContentEditableWarning onBlur={(e) => updateBirthdate('month', e.currentTarget.innerText)}>{profile.birthdate.month}</div>月
          <div contentEditable suppressContentEditableWarning onBlur={(e) => updateBirthdate('day', e.currentTarget.innerText)}>{profile.birthdate.day}</div>日生
          <span>（満 {getAge(profile.birthdate)} 歳）</span>
        </div>
        <div className="cell p-address-label"><label>現住所</label></div>
        <div className="cell p-address-value single-line-input" contentEditable suppressContentEditableWarning onBlur={(e) => updateProfile('address', e.currentTarget.innerText)} data-placeholder="〒100-0001 東京都千代田区千代田1-1">{profile.address}</div>
        <div className="cell p-contact-label"><label>※連絡先</label></div>
        <div className="cell p-contact-value single-line-input" contentEditable suppressContentEditableWarning onBlur={(e) => updateProfile('contact', e.currentTarget.innerText)} data-placeholder="同上">{profile.contact}</div>
        <div className="cell p-tel-label"><label>電話</label></div>
        <div className="cell p-tel-value single-line-input" contentEditable suppressContentEditableWarning onBlur={(e) => updateProfile('phone', e.currentTarget.innerText)}>{profile.phone}</div>
        <div className="cell p-email-label"><label>Email</label></div>
        <div className="cell p-email-value single-line-input" contentEditable suppressContentEditableWarning onBlur={(e) => updateProfile('email', e.currentTarget.innerText)}>{profile.email}</div>
      </div>

      <div className="history-grid">
        <div className="cell h-year-h">年</div>
        <div className="cell h-month-h">月</div>
        <div className="cell h-desc-h">学 歴 ・ 職 歴</div>
        {histories.map((entry, index) => {
          const desc = typeof entry.description === 'string' ? entry.description : '';
          // 半角/全角スペースを除去して比較（表記ゆれ対応）
          const normalized = desc.replace(/[\s\u3000]/g, '');
          // 「以上」および「学歴」「職歴」の行は常に非表示、footerも非表示
          if (
            entry.type === 'footer' ||
            normalized === '以上' ||
            normalized === '学歴' ||
            normalized === '職歴'
          ) return null;

          return (
            <React.Fragment key={entry.id}>
              <div className={`cell h-year dynamic-row`} contentEditable={entry.type !== 'header' && entry.type !== 'footer'} suppressContentEditableWarning onBlur={(e) => updateHistory(entry.id, 'year', e.currentTarget.innerText)}>{entry.year}</div>
              <div className={`cell h-month`} contentEditable={entry.type !== 'header' && entry.type !== 'footer'} suppressContentEditableWarning onBlur={(e) => updateHistory(entry.id, 'month', e.currentTarget.innerText)}>{entry.month}</div>
              <div
                className={`cell h-desc`}
                contentEditable={entry.type !== 'header' && entry.type !== 'footer'}
                suppressContentEditableWarning
                onBlur={(e) => updateHistory(entry.id, 'description', e.currentTarget.innerText)}
                data-placeholder={entry.type === 'entry' ? '〇〇大学〇〇学部 入学' : ''}
              >
                {entry.description}
                {entry.type !== 'header' && entry.type !== 'footer' && (
                  <div className="row-controls">
                    <button className="control-btn add-btn" onClick={() => addHistory(index + 1)}>+</button>
                    <button className="control-btn delete-btn" onClick={() => deleteHistory(entry.id)}>×</button>
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <div className="history-grid license-grid">
        <div className="cell h-year-h">年</div>
        <div className="cell h-month-h">月</div>
        <div className="cell h-desc-h">免 許 ・ 資 格</div>
        {licenses.map((entry, index) => (
          <React.Fragment key={entry.id}>
            <div className="cell h-year dynamic-row" contentEditable suppressContentEditableWarning onBlur={(e) => updateLicense(entry.id, 'year', e.currentTarget.innerText)}>{entry.year}</div>
            <div className="cell h-month" contentEditable suppressContentEditableWarning onBlur={(e) => updateLicense(entry.id, 'month', e.currentTarget.innerText)}>{entry.month}</div>
            <div className="cell h-desc">
              <div style={{ width: '100%' }} contentEditable suppressContentEditableWarning onBlur={(e) => updateLicense(entry.id, 'description', e.currentTarget.innerText)} data-placeholder="普通自動車第一種運転免許 取得">{entry.description}</div>
              <div className="row-controls">
                <button className="control-btn add-btn" onClick={() => addLicense(index + 1)}>+</button>
                <button className="control-btn delete-btn" onClick={() => deleteLicense(entry.id)}>×</button>
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>

      <div className="free-text-grid motivation-grid">
        <div className="cell f-header">志望の動機</div>
        <div
          className="cell f-content"
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => updateMotivation(e.currentTarget.innerText)}
        >
          {motivation}
        </div>
      </div>

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
        {/* ▼▼▼ AI生成機能のUI（自己PR側に配置） ▼▼▼ */}
        <div className="ai-controls">
          <input
            type="text"
            value={aiKeywords}
            onChange={(e) => setAiKeywords(e.target.value)}
            placeholder="アピールしたいキーワードを入力 (例: 挑戦心、リーダーシップ)"
            className="ai-keyword-input"
            disabled={isGenerating}
          />
          <button
            onClick={handleGenerateText}
            className="ai-generate-btn"
            disabled={isGenerating || !aiKeywords}
          >
            {isGenerating ? '生成中...' : 'AIで文章を生成'}
          </button>
          {aiError && <p className="ai-error-message">{aiError}</p>}
        </div>
        {/* ▲▲▲ ここまで ▲▲▲ */}
      </div>
    </div>
  );
});

ResumePreview.displayName = 'ResumePreview';
export default ResumePreview;
