# Project Development Rules & Guidelines (ANTIGRAVITY)

本プロジェクトでの開発における共通ルールです。作業開始時は必ず本ファイルを確認してください。

## 1. 言語設定
- **日本語 (Japanese)**: 回答、ドキュメント、ソースコード内のコメントを含め、すべて日本語で記述すること。

## 2. タスク管理・進行フロー
- **要件定義とタスク分割**: 作業開始前に必ず要件を定義し、機能ごとのタスク一覧を `task.md` で管理する。
- **進捗管理**: タスクの進行状況は、作業ごとに都度 `task.md` で更新して可視化する。

## 3. 環境設定
本プロジェクトは以下の技術スタックを使用します:
- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS + DaisyUI
- **AI/Vision**: MediaPipe (`@mediapipe/tasks-vision`)
- **Webcam**: `react-webcam`

## 4. テスト・品質保証
- **テストファースト/テスト必須**: 主要なロジック（特にAI判定やゲームエンジン）にはテストケースを作成する。
- **リグレッションチェック**: コミット前にはビルド (`npm run build`) を通し、エラーがないことを確認する。
- **Lint**: `npm run lint` を順守する。

## 5. 主要ファイル構成
```
face-battle-web/
├── src/
│   ├── app/                # Next.js App Router Pages
│   ├── components/         # React Components
│   │   ├── Game/           # ゲームロジック (FaceLandmarker, GameEngine)
│   │   └── UI/             # 汎用UI (AdBanner, Buttons)
│   └── lib/                # ユーティリティ関数
├── public/                 # 静的ファイル (models/)
└── ANTIGRAVITY.md          # 本ルールファイル
```

## 6. 重要なコマンド
```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# Linh
npm run lint

# テスト (Jest導入後)
npm test
```

## 7. 開発ベストプラクティス (Antigravity Guidelines)

### 7.1 エラー分析の義務化 (Stop & Think)
- エラー発生時は、即座に修正を試みるのではなく、まずエラーログを読んで原因を特定し、その「分析結果」を出力してから修正に入る。

### 7.2 依存関係の事前確認 (No Hallucinations)
- 新しい `import` を追加する際は、そのパッケージが `package.json` に含まれているかを確認する。

### 7.3 コメント維持 (Respect Comments)
- コード修正時、既存のコメントやJSDocは極力維持する。

### 7.4 アトミックコミット (Atomic Commits)
- 「機能追加」と「リファクタリング」は同時にコミットせず、分ける。
- コミットメッセージは `feat:`, `fix:`, `docs:` などのプレフィックスを使用する。

---
## 8. プロジェクト固有の注意事項

### 顔認識 (MediaPipe)
- モデルファイル (`.task`) は `public/models/` に配置するか、CDNからロードする。
- ブラウザのメモリ使用量に注意し、コンポーネントのアンマウント時には適切にリソースを解放 (`close()`) する。

### 広告実装
- `AdBanner` コンポーネントはプレースホルダーとして実装し、レイアウトシフト（CLS）を防ぐために固定heightを持つこと。
