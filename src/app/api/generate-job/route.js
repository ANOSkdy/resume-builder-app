import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';

const MODEL = process.env.GOOGLE_GENAI_MODEL || 'gemini-1.5-flash';
const API_KEY =
  process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY;

export async function POST(req) {
  try {
    const { keywords = '', context = {}, companies = [] } = await req.json();
    const histories = Array.isArray(context.histories)
      ? context.histories
      : [];

    const entries = histories
      .filter((h) => h?.type !== 'header' && h?.type !== 'footer')
      .map((h) => `${h.year || ''}年${h.month || ''}月: ${h.description || ''}`)
      .join('\n');

    const prompt = `
あなたは日本の採用文書に精通したキャリアコンサルタントです。
以下の「職歴（履歴書の原文）」を読み、職務経歴書の下書きを日本語で作成してください。

# 重要要件
- タイトルは出力しません。返答は本文のみ。
- 返答はプレーンテキスト（コードブロックやJSONは禁止）。
- 見出しは次の2つを必ず用意し、それぞれに本文を書いてください。
  1) 職務経歴要約（3～6行）
  2) 職務経歴詳細（プロジェクトごとに 箇条書きを推奨。役割/担当/実績 を明確に）
- 「職務経歴要約」は履歴書の職歴の流れが分かるように、要約と強みを簡潔に。
- 「職務経歴詳細」は、以下の粒度を参考に書いてください。
  - 期間 / クライアント / 概要 / 役割 / 担当業務 / 実績（数値があれば明記）
- キーワードが指定された場合は、文中に自然に織り込みます。

# 履歴書の職歴（原文）
${entries || '（職歴の記載が少ないため、ポテンシャルや取り組み姿勢が伝わるようにまとめてください）'}

# 追加キーワード
${keywords || '（特になし）'}

# 出力フォーマット（厳守）
職務経歴要約:
（本文）

職務経歴詳細:
（本文）
`.trim();

    if (!API_KEY) {
      return NextResponse.json(
        {
          ok: false,
          summary: '',
          details: (Array.isArray(companies) ? companies : []).map((c) => ({
            company: c,
            detail: '',
          })),
          error: 'Gemini APIキーが未設定です',
        },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL });
    const result = await model.generateContent(prompt);
    const text = result?.response?.text() ?? '';

    const summaryMatch = text.match(
      /職務経歴要約:\s*([\s\S]*?)\n\s*職務経歴詳細:/
    );
    const detailsMatch = text.match(/職務経歴詳細:\s*([\s\S]*)$/);
    const summaryText = (summaryMatch?.[1] || '').trim();
    const detailsText = (detailsMatch?.[1] || '').trim();

    const lines = detailsText.split(/\n+/).filter(Boolean);
    const normalized = (Array.isArray(companies) ? companies : []).map((c, i) => ({
      company: c,
      detail: lines[i] || '',
    }));
    return NextResponse.json({ ok: true, summary: summaryText, details: normalized });
  } catch (e) {
    console.error('generate-job error', e);
    return NextResponse.json(
      {
        ok: false,
        summary: '',
        details: (Array.isArray(companies) ? companies : []).map((c) => ({
          company: c,
          detail: '',
        })),
        error: e.message || 'server error',
      },
      { status: 500 }
    );
  }
}

