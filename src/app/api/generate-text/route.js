import { NextResponse } from 'next/server';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';

const extractTextFromCandidates = (candidates = []) =>
  candidates
    .flatMap(candidate => candidate?.content?.parts ?? [])
    .map(part => part?.text ?? '')
    .join('')
    .trim();

// POSTリクエストを処理する関数
export async function POST(request) {
  try {
    // リクエストボディからキーワードと職歴コンテキストを取得
    const { keywords, context = {} } = await request.json();

    if (!keywords) {
      return NextResponse.json({ error: 'キーワードが入力されていません。' }, { status: 400 });
    }

    // 職歴情報を整形
    const histories = Array.isArray(context?.histories) ? context.histories : [];
    const workHistoryText = histories
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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini APIキーが未設定です。' },
        { status: 500 }
      );
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      console.error('Gemini APIエラー:', payload?.error?.message ?? response.statusText);
      return NextResponse.json(
        { error: 'AI文章の生成中にエラーが発生しました。' },
        { status: 500 }
      );
    }

    const generatedText = extractTextFromCandidates(payload?.candidates);

    // 生成されたテキストをクライアントに返す
    return NextResponse.json({ generatedText });

  } catch (error) {
    console.error('Gemini APIエラー:', error);
    return NextResponse.json({ error: 'AI文章の生成中にエラーが発生しました。' }, { status: 500 });
  }
}
