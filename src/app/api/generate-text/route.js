import { NextResponse } from 'next/server';
// Google AI SDKをインポート
import { GoogleGenerativeAI } from '@google/generative-ai';

// Geminiクライアントを初期化
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// POSTリクエストを処理する関数
export async function POST(request) {
  try {
    // リクエストボディからキーワードと職歴コンテキストを取得
    const { keywords, context } = await request.json();

    if (!keywords) {
      return NextResponse.json({ error: 'キーワードが入力されていません。' }, { status: 400 });
    }

    // モデルを選択
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 職歴情報を整形
    const workHistoryText = context.histories
      .filter(h => h.type === 'entry' && h.description)
      .map(h => `${h.year}年${h.month}月 ${h.description}`)
      .join('\n');

    // Geminiに送信するプロンプト（指示文）を作成
    const prompt = `
      あなたは優秀なキャリアアドバイザーです。
      以下の情報を基に、日本の就職活動で通用する、自然で説得力のある「自己PR」を200〜300字程度で作成してください。

      # 職務経歴
      ${workHistoryText || '記載なし'}

      # アピールしたいキーワード
      ${keywords}
    `;

    // Gemini APIを呼び出して文章を生成
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const generatedText = response.text();
    
    // 生成されたテキストをクライアントに返す
    return NextResponse.json({ generatedText });

  } catch (error) {
    console.error('Gemini APIエラー:', error);
    return NextResponse.json({ error: 'AI文章の生成中にエラーが発生しました。' }, { status: 500 });
  }
}