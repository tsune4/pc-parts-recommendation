# PC自作パーツ推奨システム / PC Build Parts Recommendation System

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://yourusername.github.io/pc-parts-recommendation/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## 🖥️ 概要 / Overview

予算とスペック条件に応じて最適なPCパーツ構成を提案するWebアプリケーションです。  
A web application that suggests optimal PC part configurations based on budget and specification requirements.

**🌐 GitHub Pages版: [https://yourusername.github.io/pc-parts-recommendation/](https://yourusername.github.io/pc-parts-recommendation/)**

## ✨ 機能 / Features

- 💰 **予算別推奨**: 5万円〜100万円の予算に対応
- 🎮 **用途別最適化**: ゲーミング、クリエイティブ、オフィス、開発用途
- 🔧 **GPUブランド選択**: NVIDIA・AMD選択可能
- 📊 **予算最適化**: 余った予算でのパーツ自動アップグレード
- 🌐 **多言語対応**: 日本語・英語切り替え
- 📱 **レスポンシブデザイン**: PC・スマートフォン対応
- ⚡ **高速動作**: 完全クライアントサイド実行

## 🚀 最新対応パーツ / Latest Parts Support

### GPU
- **NVIDIA RTX 5000シリーズ**: RTX 5080, 5070 Ti, 5070, 5060 Ti, 5060
- **AMD RX 9000シリーズ**: RX 9070 XT, 9070, 9060 XT

## 🛠️ プロジェクト構成 / Project Structure

- **`docs/`**: GitHub Pages用静的サイト
- **`public/`**: 開発用フロントエンドファイル（廃止予定）
- **`api/`**: Node.js サーバーサイドAPI（ローカル開発用）
- **`data/`**: パーツデータ（JSON形式）

## 🎯 GitHub Pagesデプロイ手順 / GitHub Pages Deployment

1. GitHubでリポジトリを作成
2. このプロジェクトをプッシュ
3. Repository Settings → Pages → Source: "Deploy from a branch"
4. Branch: "main", Folder: "/docs" を選択
5. Save

## 🔧 ローカル開発 / Local Development

### 静的サイト版（GitHub Pages用）
```bash
cd docs/
# 静的サーバーで起動（例：Live Server）
# または直接index.htmlをブラウザで開く
```

### Node.js版（開発用）
```bash
npm install
npm start
# http://localhost:3010 でアクセス
```

## 📄 ライセンス / License

このプロジェクトはMITライセンスの下で公開されています。  
This project is licensed under the MIT License.

---

**Made with ❤️ for PC builders worldwide**