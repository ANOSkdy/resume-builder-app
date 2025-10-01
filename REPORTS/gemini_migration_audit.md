# Gemini Migration Audit Report

## 概要
- 対象リポジトリ: resume-builder-app
- ブランチ: work
- コミット: 8df2a06f8e5175a2d46302f8913d91c53c7b9d47
- 解析日時: $(TZ=Asia/Tokyo date '+%Y-%m-%d %H:%M %Z')

## サマリ
| 判定 | 件数 |
| --- | --- |
| Pass | 2 |
| Warning | 1 |
| Fail | 4 |

## 詳細診断
### MODEL_VERSION (Fail)
- `src/app/api/generate-text/route.js` L3: `const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';`
  - 判定理由: gemini-pro (1.x系) がハードコードされており、2.5系モデルへの移行が未対応。
  - 推奨対応: `gemini-2.5-flash` 等 2.5 系モデルを環境変数で指定し、API URL から 1.x 系モデルを除去する。
- `src/app/api/generate-job/route.js` L6: `const MODEL = process.env.GOOGLE_GENAI_MODEL || 'gemini-1.5-flash';`
  - 判定理由: デフォルトモデルとして gemini-1.5-flash を使用。EoL モデルに依存。
  - 推奨対応: デフォルトを `gemini-2.5-flash` などに置き換え、環境変数も同様に更新する。

### REQUEST_FORMAT (Fail)
- `src/app/api/generate-job/route.js` L66-L69: `model.generateContent(prompt);`
  - 判定理由: SDK へ文字列のみを渡しており、`contents: [{ role: 'user', parts: [...] }]` の形をアプリ側で強制していない。Role 欠落時の 400 を防止できない。
  - 推奨対応: `model.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }] })` のように明示的に role/user を指定するヘルパーを実装する。

### ENDPOINT_REGION (Pass)
- `src/app/api/generate-text/route.js` L49: `fetch(...generativelanguage.googleapis.com...)`
  - 判定理由: Studio 経路 (API key) を利用し、リージョン指定は不要。現状のリクエスト URI にリージョン不整合は見られない。

### PROVIDER_SWITCH (Warning)
- `src/app/api/generate-text/route.js` / `src/app/api/generate-job/route.js`
  - 判定理由: Studio API キー経路のみ実装されており、Vertex への切替や抽象化レイヤーが存在しない。
  - 推奨対応: `GEMINI_PROVIDER` 等の環境変数で Studio/Vertex を切り替えられる構造やインターフェース分離を設計する。

### AUTHORIZATION (Pass)
- `src/app/api/generate-text/route.js` L41-L45, `src/app/api/generate-job/route.js` L7-L58
  - 判定理由: Studio 用の `GEMINI_API_KEY` / `GOOGLE_GENAI_API_KEY` を参照し、未設定時の検知も実装済み。Vertex 経路は未実装だが現状要件は満たす。

### ERROR_HANDLING (Fail)
- `src/app/api/generate-text/route.js` L66-L82
  - 判定理由: 404/403/400 の原因別メッセージが無く、一律 500 応答。モデル名/リージョン誤りの自己診断が難しい。
  - 推奨対応: `response.status` に応じて 404 (モデル/リージョン確認), 403 (請求やロール確認), 400 (リクエスト整形エラー) を個別案内するハンドリングを追加。
- `src/app/api/generate-job/route.js` L83-L97
  - 判定理由: エラー時は `e.message` のみ。外部要因 (403/404) と内部要因を判別できない。
  - 推奨対応: Vertex/Studio のレスポンスコードに応じた診断メッセージと再試行案内を整備する。

### ENV_CONFIGURATION (Fail)
- `.env` 系ファイルが未整備。GEMINI_MODEL/GEMINI_PROVIDER/GOOGLE_LOCATION 等の推奨キーが定義されていない。
  - 判定理由: 1.5 系モデル固定やリージョン未設定がコード側でも制御されておらず、デプロイ環境の再現性が低い。
  - 推奨対応: `.env.example` などに `GEMINI_MODEL=gemini-2.5-flash`, `GEMINI_PROVIDER=studio`, `GOOGLE_LOCATION=global` 等を明記し、アプリ側でも参照する。

## リスク/影響
- 404: 1.x モデルを呼び続けると EoL 後に 404 が発生。ユーザーは生成結果を得られなくなり再試行しても改善しない。
- 403: Vertex への移行時、ロール/請求未設定のままではアクセス拒否。現在の実装は指示を返さず調査が長期化するリスクが高い。
- 400: `contents` 形式が保証されず、SDK 仕様変更時に role 欠落で 400 が発生する恐れ。ユーザーには汎用的な 500 エラーのみが表示され、原因追跡が困難。

## 推奨アクション
- 即時: モデル名を 2.5 系へ更新し、環境変数とコードを同期。
- 短期: Request ペイロードの role/user 明示化とエラーコード別ハンドリングの実装。
- 中期: Studio/Vertex のプロバイダー切替レイヤーを設計し、リージョンや認証方式を環境変数化。

## 参考
- 検索コマンド: `rg "gemini" -n`, `nl -ba src/app/api/generate-text/route.js`, `nl -ba src/app/api/generate-job/route.js`
- コマンド履歴: `git status -sb`, `git rev-parse HEAD`
