# Gemini API Migration Notes (2025-10)

## Analysis & Recommendations
- **認証方法**: 旧コードはURLにAPIキーを付与していましたが、2024年以降のVertex AI Generative AIではOAuth 2.0ベアラートークンによる認証が必須となり、APIキーでの呼び出しはサポート対象外です。Apps Scriptでは`ScriptApp.getOAuthToken()`で取得できるGCP連携サービスアカウントのアクセストークンをHTTPヘッダーに付与するのが推奨されています。
- **APIエンドポイント**: `generativelanguage.googleapis.com` はスタンドアロンのGenerative Language API用であり、Vertex AI統合後のGemini商用利用では`{location}-aiplatform.googleapis.com`配下のVertex AIエンドポイントに切り替える必要があります。
- **モデルIDとバージョン**: `gemini-1.5-flash-latest` は2025年10月時点で非推奨になっており、代わりに`gemini-1.5-flash-002`または`gemini-1.5-pro-002`が安定版として提供されています。`-latest` エイリアスは将来の後方互換性が保証されないため、明示的なモデルバージョンを指定します。
- **リージョン**: Vertex AIの最新Geminiマルチモーダルモデルは`us-central1`や`us-east5`などの有効なロケーションを指定する必要があり、URLにリージョンセグメントを含めることが求められます。一般的な推奨は`us-central1`です。
- **リクエストペイロード**: Vertex AIの`generateContent`では、`contents`配列の各要素に`role`を明示する必要があり、`parts`の順序もテキスト→画像の形で指定します。レスポンスは`candidates[].content.parts[].text`で返るため、安全なパース処理が必要です。

## Corrected Google Apps Script Function
- OAuth 2.0トークンで認証し、Vertex AIのエンドポイントへリクエストします。
- 明示的なモデルIDとロケーションを引数で指定できるようにし、Apps Scriptの高度なエディタ設定でVertex AI APIを有効化しておくことを前提とします。
- レスポンスがJSONで返らない場合の防御的なエラーハンドリングを追加します。
