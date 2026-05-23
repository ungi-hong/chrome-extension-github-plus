# GitHub Plus

GitHubをちょっと便利にする Chrome 拡張機能。

機能は独立したモジュールとして管理されており、思いついたタイミングで新しい便利機能を追加していけます。

## 同梱機能

### Video Paste
description / issue / comment 欄で `https://github.com/user-attachments/assets/<UUID>` 形式の動画URLをペーストすると、自動的に `<video src="..."></video>` で囲みます。

GitHubのMarkdownレンダラはこの形式の `<video>` を再生プレイヤーに変換します。

### List Keys
Markdownリスト編集を Obsidian / Notion / Typora 互換にします：

| キー | 挙動 |
|---|---|
| `Tab` | リスト行のインデントを1段深くする |
| `Shift+Tab` | リスト行のインデントを1段浅くする |
| `Enter`（空 `- ` でインデント1段以上） | 1段アウトデント |
| `Enter`（空 `- ` でインデント0） | GitHubデフォルト（bullet 消える） |
| `Enter`（内容あり） | GitHubデフォルト（次行に `- ` 継続） |

対応する bullet 形式：`-`, `*`, `+`, `1.`, `- [ ]`, `- [x]`。

## インストール（開発版）

```bash
npm install
npm run build
```

1. Chrome で `chrome://extensions` を開く
2. 右上の「デベロッパーモード」をオンにする
3. 「パッケージ化されていない拡張機能を読み込む」をクリックし、生成された `dist/` ディレクトリを選択

## 設定

`chrome://extensions` → GitHub Plus の「詳細」→「拡張機能のオプション」で、各機能の有効/無効を切り替えられます。設定は `chrome.storage.sync` で複数デバイス間で同期されます。

## 開発

```bash
npm run dev          # Vite + HMR で開発
npm test             # vitest（url-matcher, list-parser）
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint
```

### 新しい機能を追加する

1. `src/content/features/<your-id>/index.ts` を作成し、`Feature` 型のオブジェクトを export
   ```ts
   import type { Feature } from '../../../shared/types';

   export const yourFeature: Feature = {
     id: 'your-id',
     label: 'Your Feature',
     description: '何をするか',
     defaultEnabled: true,
     attach(textarea) {
       // textarea にイベントを bind
       const handler = (_e: Event) => { /* ... */ };
       textarea.addEventListener('input', handler);
       return () => textarea.removeEventListener('input', handler);
     },
   };
   ```
2. `src/content/features/index.ts` の `ALL_FEATURES` 配列に追加
3. Options ページには自動でトグルが追加されます

機能間の相互 import は ESLint で禁止されています（`.eslintrc.json` の `no-restricted-imports`）。共通処理が必要な場合は `src/shared/` または `src/content/` 直下に置いてください。

### ディレクトリ構成

```
chrome-extension-github-plus/
├── manifest.json
├── src/
│   ├── content/
│   │   ├── index.ts                 # エントリーポイント
│   │   ├── textarea-observer.ts     # 対象 textarea の検出と監視
│   │   ├── textarea-utils.ts        # undo 保持 / 行操作などの汎用関数
│   │   └── features/
│   │       ├── index.ts             # ALL_FEATURES の登録場所
│   │       ├── video-paste/         # 機能ごとに独立したディレクトリ
│   │       │   ├── index.ts
│   │       │   ├── url-matcher.ts
│   │       │   └── url-matcher.test.ts
│   │       └── list-keys/
│   │           ├── index.ts
│   │           ├── list-parser.ts
│   │           └── list-parser.test.ts
│   ├── options/                     # 設定ページ
│   │   ├── index.html
│   │   ├── options.ts
│   │   └── options.css
│   └── shared/
│       ├── types.ts                 # Feature, Settings 型
│       └── settings.ts              # chrome.storage.sync ラッパ
└── public/                          # （任意）アイコンなど
```

## アイコン（任意）

現状 manifest にアイコン指定はなく、Chrome のデフォルトアイコンが使用されます。
独自アイコンを使いたい場合は：

1. `public/icons/16.png`, `48.png`, `128.png` を配置
2. `manifest.json` に以下を追加：
   ```json
   "icons": {
     "16": "icons/16.png",
     "48": "icons/48.png",
     "128": "icons/128.png"
   }
   ```

## ライセンス

MIT
