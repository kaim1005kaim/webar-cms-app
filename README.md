# WebAR CMS App

WebGPU/Three.js/A-Frameベースの統合WebARアプリケーション。3Dモデルとプロジェクトを管理できるCMSを含みます。

## 🎯 主要機能

- **ARビューア**: A-Frame + AR.js によるマーカーベースAR
- **WebGPU レンダリング**: 高精細な3D描画（フォールバック対応）
- **プロジェクト管理**: キーホルダープロジェクトの作成・編集
- **管理画面**: ドラッグ&ドロップファイルアップロード
- **レスポンシブ**: PC・モバイル完全対応

## 🛠 技術スタック

| 分野 | 技術 |
|------|------|
| **Frontend** | TypeScript, Three.js, A-Frame, WebGPU API |
| **Backend** | Node.js, Express.js |
| **Database** | JSON Files (LowDB準拠) |
| **Build** | Vite, ESLint, Prettier |
| **Deploy** | Netlify (静的 + Functions) |
| **AR** | AR.js, WebXR |

## 🚀 クイックスタート

### 1. インストール
```bash
make install
```

### 2. 開発サーバー起動
```bash
# 通常の開発サーバー
make dev

# AR開発サーバー (HTTPS必須)
make ar-dev
```

### 3. アクセス
- **メインアプリ**: http://localhost:3000/
- **ARビューア**: https://localhost:3000/ar
- **管理画面**: http://localhost:3000/admin

## 📋 利用可能なコマンド

```bash
make install    # 依存関係インストール
make dev        # 開発サーバー起動
make ar-dev     # AR開発サーバー (HTTPS)
make build      # プロダクションビルド
make lint       # ESLint実行 (自動修正)
make format     # Prettier実行
make type-check # TypeScript型チェック
make check-all  # 全チェック実行
make clean      # クリーンアップ
make info       # ヘルプ表示
```

## 🌐 API エンドポイント

### プロジェクト管理
- `GET /api/projects` - プロジェクト一覧
- `GET /api/projects/:id` - プロジェクト詳細
- `POST /api/projects` - プロジェクト作成
- `PUT /api/projects/:id` - プロジェクト更新
- `DELETE /api/projects/:id` - プロジェクト削除

### 3Dモデル管理
- `GET /api/models` - モデル一覧
- `GET /api/models/:id` - モデル詳細
- `POST /api/models` - モデル作成
- `PUT /api/models/:id` - モデル更新
- `DELETE /api/models/:id` - モデル削除

### マーカー管理
- `GET /api/markers` - マーカー一覧
- `GET /api/markers/:projectId` - プロジェクト別マーカー

## 📊 データ構造

### プロジェクト
```typescript
interface Project {
  id: string;
  name: string;
  creator: { userId: string; name: string };
  marker: { imageUrl: string; nftDescriptor: string };
  character: { modelUrl: string; scale: number; position: [x,y,z] };
  metadata: { description: string; tags: string[]; isPublic: boolean };
  created_at: string;
}
```

### 3Dモデル
```typescript
interface Model {
  id: string;
  title: string;
  description: string;
  model_url: string;    // GLB/GLTF URL
  thumbnail_url: string;
  created_at: string;
}
```

## 🏗 プロジェクト構造

```
WebAR/
├── 📁 src/                    # フロントエンドソース
│   ├── 📁 types/             # TypeScript型定義
│   ├── 📁 utils/             # ユーティリティ関数
│   ├── 📁 config/            # 設定管理
│   ├── 📄 main.ts            # Three.js メインアプリ
│   ├── 📄 ar-app.ts          # AR統合アプリ
│   ├── 📄 webgpu-renderer.ts # WebGPU基本レンダラー
│   └── 📄 ar-webgpu-renderer.ts # AR専用レンダラー
├── 📁 public/                # 静的ファイル
│   ├── 📄 ar.html            # ARビューア
│   ├── 📄 admin.html         # 管理画面
│   ├── 📁 markers/           # ARマーカーファイル
│   └── 📄 placeholder.svg    # プレースホルダー画像
├── 📁 api/                   # 開発用APIサーバー
│   ├── 📄 server.js          # Express サーバー
│   └── 📄 utils.js           # API共通ユーティリティ
├── 📁 netlify/               # 本番用設定
│   └── 📁 functions/         # Netlify Functions
├── 📄 models.json            # 3Dモデルデータ
├── 📄 keyholder-projects.json # プロジェクトデータ
├── 📄 Makefile              # タスク自動化
├── 📄 .eslintrc.js          # ESLint設定
├── 📄 .prettierrc           # Prettier設定
├── 📄 vite.config.ts        # Vite設定
├── 📄 tsconfig.json         # TypeScript設定
└── 📄 netlify.toml          # Netlify設定
```

## 🔧 開発フロー

1. **プロジェクト作成**: 管理画面でプロジェクト作成
2. **マーカー設定**: 画像アップロード → NFTマーカー生成
3. **3Dモデル選択**: GLB/GLTFモデルの選択・スケール調整
4. **AR確認**: ARビューアでリアルタイム確認
5. **デプロイ**: Netlifyに自動デプロイ

## 🚨 重要事項

- **カメラ権限**: ARビューアはHTTPS必須
- **WebGPU**: 対応ブラウザ限定（Chrome/Edge最新版）
- **マーカー品質**: 高コントラスト画像推奨
- **パフォーマンス**: モバイルでは軽量モデル推奨

## 📝 ライセンス

ISC License