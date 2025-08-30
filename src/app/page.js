'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import ResumePreview from '@/components/ResumePreview';

export default function Home() {
  const componentRef = useRef(null);

  // あなたのご指摘通り、v3の正しいAPIである`contentRef`プロパティを使用してフックを初期化します
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: '履歴書',
    onAfterPrint: () => alert('PDFの保存が完了しました。'),
    removeAfterPrint: true,
  });
  
  // 参照が確立され、印刷準備が整ったことを示す状態
  const [isReady, setIsReady] = useState(false);

  // コンポーネントがマウントされた後に一度だけ実行し、参照を確立します
  useEffect(() => {
    // componentRef.currentに値が設定された後（つまり描画後）にisReadyをtrueにします
    if (componentRef.current) {
      setIsReady(true);
    }
    // このeffectはコンポーネントの初回マウント時に一度だけ実行されます
  }, []);

  return (
    <main>
      <header className="page-header" style={{ padding: '20px', textAlign: 'center' }}>
        <h1>WYSIWYG AI履歴書ジェネレーター</h1>
        {/* isReadyがtrueになるまでボタンを無効化することで、参照がnullのままクリックされるのを防ぎます */}
        <button
          onClick={handlePrint}
          className="download-btn"
          disabled={!isReady} 
        >
          {isReady ? 'PDFダウンロード' : '準備中...'}
        </button>
      </header>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {/* 印刷対象のコンポーネントにrefを渡します */}
        <ResumePreview ref={componentRef} />
      </div>
    </main>
  );
}
