/**
 * Vertex AI Geminiを使って領収書画像を解析する関数。
 * @param {GoogleAppsScript.Base.BlobSource} file 解析対象のファイル
 * @param {string} projectId Vertex AIを有効にしたGCPプロジェクトID
 * @param {string} prompt 入力プロンプト
 * @param {string} [location="us-central1"] 利用するリージョン
 * @returns {object} Geminiが返したJSONレスポンスをオブジェクト化したもの
 */
function analyzeReceiptWithGemini(file, projectId, prompt, location) {
  if (!file) {
    throw new Error('ファイルが指定されていません。');
  }
  if (!projectId) {
    throw new Error('Vertex AI用のプロジェクトIDを指定してください。');
  }
  const targetLocation = location || 'us-central1';

  // Apps Scriptの標準サービスアカウントでOAuth 2.0アクセストークンを取得し、APIキーの代わりに使用する。
  const accessToken = ScriptApp.getOAuthToken();

  const imageBlob = file.getBlob();
  const base64Image = Utilities.base64Encode(imageBlob.getBytes());

  const endpoint = `https://${targetLocation}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${targetLocation}/publishers/google/models/gemini-1.5-flash-002:generateContent`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: imageBlob.getContentType(),
              data: base64Image
            }
          }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: 'application/json'
    }
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  };

  const response = UrlFetchApp.fetch(endpoint, options);
  if (response.getResponseCode() !== 200) {
    throw new Error(`Gemini APIリクエストエラー: ${response.getResponseCode()} ${response.getContentText()}`);
  }

  const result = JSON.parse(response.getContentText());
  const candidate = result.candidates && result.candidates[0];
  const part = candidate && candidate.content && candidate.content.parts && candidate.content.parts.find(function (p) {
    return typeof p.text === 'string' && p.text.trim() !== '';
  });

  if (!part) {
    throw new Error('Gemini APIから有効なテキストレスポンスが返されませんでした。');
  }

  try {
    return JSON.parse(part.text);
  } catch (error) {
    throw new Error('GeminiのレスポンスをJSONとして解析できませんでした。');
  }
}
