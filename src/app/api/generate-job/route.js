import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const { keywords, context = {}, pattern } = await request.json();
    if (!keywords) {
      return NextResponse.json({ error: 'キーワードが入力されていません。' }, { status: 400 });
    }
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const histories = context.histories || [];
    const historyText = histories
      .filter((h) => h.type === 'entry' && h.description)
      .map((h) => `${h.year}年${h.month}月 ${h.description}`)
      .join('\n');
    const prompt = `あなたは優秀なキャリアアドバイザーです。\n以下の情報を基に「職務経歴要約」と「職務経歴詳細」を作成してください。\n\n# 職務経歴\n${historyText || '記載なし'}\n\n# キーワード\n${keywords}\n\n# パターン\n${pattern || 'default'}\n\nJSON形式で {"summary": "...", "details": "..."} のみを出力してください。`;
    const result = await model.generateContent(prompt);
    const text = await result.response.text();
    let summary = '';
    let details = '';
    try {
      const parsed = JSON.parse(text);
      summary = parsed.summary || '';
      details = parsed.details || '';
    } catch {
      summary = text;
    }
    return NextResponse.json({ summary, details });
  } catch (error) {
    console.error('Gemini APIエラー:', error);
    return NextResponse.json(
      { error: 'AI文章の生成中にエラーが発生しました。' },
      { status: 500 }
    );
  }
}
