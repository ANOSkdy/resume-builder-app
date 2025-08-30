// src/components/ResumePreview.js

import React from 'react';

const ResumePreview = React.forwardRef((props, ref) => {
  return (
    <div ref={ref}>
      <h1>履歴書プレビュー</h1>
      {/* 今後、ここに履歴書のレイアウトを構築していきます */}
    </div>
  );
});

ResumePreview.displayName = 'ResumePreview'; // for ESLint
export default ResumePreview;