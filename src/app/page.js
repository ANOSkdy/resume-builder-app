// src/app/page.js

'use client'; // インタラクティブなUIのためクライアントコンポーネントとして宣言

import ResumePreview from '@/components/ResumePreview';
import { useRef } from 'react';

export default function Home() {
  const componentRef = useRef();

  return (
    <main>
      <header style={{ padding: '20px', textAlign: 'center' }}>
        <h1>WYSIWYG AI履歴書ジェネレーター</h1>
        <button>PDFダウンロード</button>
      </header>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <ResumePreview ref={componentRef} />
      </div>
    </main>
  );
}