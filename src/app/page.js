'use client';

import React, { useEffect, useRef, useState, useId } from 'react';
import { useReactToPrint } from 'react-to-print';
import ResumePreview from '@/components/ResumePreview';
import JobPreview from '@/components/JobPreview';
import { useResumeStore } from '@/store/resumeStore';

export default function Home() {
  // ← v3の新API: contentRef を渡す
  const contentRef = useRef(null);

  const fileInputId = useId();
  const { updatePhotoUrl } = useResumeStore();

  const [isReady, setIsReady] = useState(false);
  const [view, setView] = useState('resume');
  useEffect(() => {
    // 画面に出たら有効化
    if (contentRef.current) setIsReady(true);
  }, []);

  // v3: contentRef を直接渡す（content: () => ... は使わない）
  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: '履歴書',
    onAfterPrint: () => {
      // ここは任意
      // alert('PDFの保存が完了しました。');
    },
    removeAfterPrint: true,
  });

  // 画像選択 → Base64化 → store へ保存
  const onPickPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください。');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updatePhotoUrl(reader.result); // Base64 Data URL
      e.target.value = ''; // 同じファイル再選択でも change を発火させる
    };
    reader.readAsDataURL(file);
  };

  return (
    <main>
      <header className="page-header" style={{ padding: '20px', textAlign: 'center' }}>
        <h1 style={{ margin: 0 }}>AI履歴書</h1>

        {/* ヘッダーの操作ボタン群（PDFと同じ配色） */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 12 }}>
          {/* 写真を選択（PDFボタンの横） */}
          <button
            type="button"
            className="download-btn"
            onClick={() => document.getElementById(fileInputId).click()}
          >
            写真を選択
          </button>
          <input
            id={fileInputId}
            type="file"
            accept="image/*"
            onChange={onPickPhoto}
            style={{ display: 'none' }}
          />

          {/* PDFダウンロード */}
          <button
            onClick={handlePrint}
            className="download-btn"
            disabled={!isReady}
          >
            {isReady ? 'PDFダウンロード' : '準備中...'}
          </button>

          <button
            type="button"
            className="download-btn"
            onClick={() => setView(view === 'resume' ? 'job' : 'resume')}
            aria-label={
              view === 'resume' ? '職務経歴書へ切り替え' : '履歴書へ切り替え'
            }
          >
            {view === 'resume' ? '職務経歴書へ' : '履歴書へ'}
          </button>
        </div>
      </header>

      {/* 印刷対象 */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {view === 'resume' ? (
          <ResumePreview ref={contentRef} />
        ) : (
          <JobPreview ref={contentRef} />
        )}
      </div>
    </main>
  );
}
