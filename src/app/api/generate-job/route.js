import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const { target, keywords, context } = await request.json();

    if (!keywords) {
      return NextResponse.json(
        { error: 'キーワードが入力されていません。' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const workHistoryText = context?.histories
      ?.filter((h) => h.type === 'entry' && h.description)
      ?.map((h) => `${h.year}年${h.month}月 ${h.description}`)
      ?.join('\n') || '記載なし';

    let prompt = '';
    if (target === 'summary') {
      prompt = `
        あなたは優秀なキャリアアドバイザーです。
        以下の職務経歴を基に、日本の就職活動向けの「職務要約」を200字程度で作成してください。

        # 職務経歴
        ${workHistoryText}

        # キーワード
        ${keywords}
      `;
    } else {
      prompt = `
        あなたは優秀なキャリアアドバイザーです。
        以下の職務経歴を基に、日本の就職活動向けの「職務経歴詳細」を300〜400字程度で作成してください。

        # 職務経歴
        ${workHistoryText}

        # キーワード
        ${keywords}
      `;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const generatedText = response.text();

    return NextResponse.json({
      jobSummary: target === 'summary' ? generatedText : '',
      jobDetails: target === 'detail' ? generatedText : '',
    });
  } catch (error) {
    console.error('Gemini APIエラー:', error);
    return NextResponse.json(
      { error: 'AI文章の生成中にエラーが発生しました。' },
      { status: 500 }
    );
  }
}

