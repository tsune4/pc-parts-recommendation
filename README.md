# 🖥️ PC自作パーツ推奨システム / PC Build Parts Recommendation System

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://tsune4.github.io/pc-parts-recommendation/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/Version-4.0-blue)](https://github.com/tsune4/pc-parts-recommendation)

## 🌟 概要 / Overview

予算とスペック条件に応じて**最適なPCパーツ構成を自動提案**するWebアプリケーションです。  
特定用途向けの最適化ロジックと詳細な予算配分アルゴリズムを搭載しています。

A web application that **automatically suggests optimal PC part configurations** based on budget and specification requirements.  
Features specialized optimization logic for specific use cases and detailed budget allocation algorithms.

**🌐 ライブデモ: [https://tsune4.github.io/pc-parts-recommendation/](https://tsune4.github.io/pc-parts-recommendation/)**

---

## ✨ 主要機能 / Key Features

### 💰 予算管理
- **予算範囲**: 125,000円〜1,000,000円に対応
- **自動予算配分**: 用途別の最適な予算分散
- **リアルタイム予算監視**: 予算状況の視覚的フィードバック

### 🎮 用途別最適化
- **ゲーミング（汎用）**: バランス重視の構成
- **Escape From Tarkov**: X3D CPU優先（7800X3D基準）
- **VRChat**: 高VRAM GPU優先（8GB以上推奨）

### 🔧 詳細設定
- **CPUメーカー**: Intel・AMD選択可能
- **GPUメーカー**: NVIDIA・AMD選択可能
- **メモリ容量**: 8GB〜64GB対応
- **ストレージ容量**: 500GB〜4TB対応
- **OS込み構成**: Windows 11価格込みオプション

### 🚀 技術的特徴
- **完全クライアントサイド**: サーバー不要で高速動作
- **レスポンシブデザイン**: PC・タブレット・スマートフォン対応
- **多言語対応**: 日本語・英語切り替え
- **リアルタイム更新**: 設定変更の即座反映

---

## 🆕 最新パーツ対応 / Latest Parts Support

### 🎮 GPU (グラフィックボード)
- **NVIDIA RTX 5000シリーズ**: RTX 5090, 5080, 5070 Ti, 5070, 5060 Ti, 5060
- **AMD RX 9000シリーズ**: RX 9070 XT, 9070, 9060 XT
- **RTX 4000シリーズ**: RTX 4090, 4080, 4070 Ti, 4070, 4060 Ti, 4060
- **RTX 3000シリーズ**: RTX 3080, 3070, 3060
- **AMD RX 7000シリーズ**: RX 7900 XTX, 7900 XT, 7800 XT, 7700 XT

### ⚡ CPU (プロセッサー)
- **AMD Ryzen 9000シリーズ**: 9950X, 9900X, 9700X, 9600X
- **AMD X3D シリーズ**: 7800X3D, 9800X3D, 9950X3D (Tarkov最適化)
- **Intel Core 14/15世代**: i9-14900K, i7-14700K, i5-14600K
- **Socket AM5/LGA1700**: 最新マザーボード対応

### 💾 メモリ・ストレージ
- **DDR5メモリ**: 最新規格対応、高速動作
- **高速SSD**: PCIe 4.0 NVMe対応
- **大容量ストレージ**: 最大4TBまで選択可能

---

## 🎯 特殊最適化ロジック / Specialized Optimization

### 🎮 Escape From Tarkov 最適化
- **X3D CPU優先選択**: 7800X3Dを基準とした段階的アップグレード
- **メモリ32GB推奨**: 快適なゲーム体験のための最適化
- **予算オーバー許容**: X3D CPUを最優先で選択

### 🌐 VRChat 最適化
- **高VRAM GPU優先**: 8GB以上のVRAMを持つGPU優先選択
- **フォールバック機能**: 予算制約時は8GB以下でも選択可能
- **CPU軽量化**: GPU予算を最大化するCPU選択

---

## 🛠️ プロジェクト構成 / Project Structure

```
pc-parts-recommendation/
├── docs/                    # GitHub Pages サイト
│   ├── index.html          # メインページ
│   ├── parts-data.js       # パーツデータベース
│   ├── pc-recommender.js   # 推奨エンジン
│   ├── script.js           # UI制御
│   ├── styles.css          # スタイルシート
│   └── translations.js     # 多言語対応
├── data/                   # データファイル
│   └── parts-data.json     # パーツデータ（開発用）
├── api/                    # Node.js API（開発用）
├── performance-test.html   # パフォーマンステスト
└── README.md              # このファイル
```

---

## 🚀 クイックスタート / Quick Start

### 🌐 GitHub Pages版（推奨）
1. **アクセス**: [https://tsune4.github.io/pc-parts-recommendation/](https://tsune4.github.io/pc-parts-recommendation/)
2. **設定入力**: 予算・用途・希望スペックを選択
3. **推奨実行**: 「推奨構成を取得」ボタンをクリック
4. **結果確認**: 最適化されたパーツ構成を確認

### 💻 ローカル開発
```bash
# リポジトリクローン
git clone https://github.com/tsune4/pc-parts-recommendation.git
cd pc-parts-recommendation

# 静的サイト版
cd docs/
# ブラウザでindex.htmlを開く、またはLive Server使用

# Node.js版（開発用）
npm install
npm start
# http://localhost:3010 でアクセス
```

---

## 📊 使用方法 / Usage

### 1️⃣ 基本設定
- **総予算**: 125,000円〜1,000,000円で設定
- **用途**: ゲーミング・Tarkov・VRChatから選択
- **希望RAM容量**: 8GB〜64GBで選択

### 2️⃣ 詳細設定（オプション）
- **CPUメーカー**: Intel・AMD・指定なし
- **GPUメーカー**: NVIDIA・AMD・指定なし
- **ストレージ容量**: 500GB〜4TB
- **OS込み構成**: Windows 11含むかチェック

### 3️⃣ 結果の見方
- **パーツリスト**: 推奨パーツと価格一覧
- **予算状況**: 予算内・オーバーの視覚表示
- **スペック詳細**: 各パーツの仕様情報
- **最適化ポイント**: 選択理由の説明

---

## 🔧 開発情報 / Development

### 技術スタック
- **フロントエンド**: HTML5, CSS3, Vanilla JavaScript
- **デプロイ**: GitHub Pages
- **データ形式**: JSON
- **互換性**: モダンブラウザ対応

### パフォーマンス
- **処理速度**: 通常50ms以下（1,000件データ処理時）
- **メモリ使用**: 軽量設計
- **キャッシュ**: ブラウザキャッシュ活用

### データ更新
パーツデータは定期的に更新され、最新の市場価格と在庫状況を反映しています。

---

## 🤝 コントリビューション / Contributing

プルリクエストや課題報告を歓迎します！

### 貢献方法
1. Fork this repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### 報告・提案
- **バグ報告**: Issues でバグを報告
- **機能提案**: 新機能のアイデアを共有
- **パーツ情報更新**: 価格・在庫情報の更新提案

---

## 📈 更新履歴 / Changelog

### v4.0 (2025-01-08)
- ✅ デフォルト予算を125,000円に更新
- ✅ Tarkov用X3D CPU選択ロジック改善（7800X3D基準）
- ✅ VRChat用高VRAM GPU優先選択実装
- ✅ UI/UXの大幅改善（アニメーション・視覚フィードバック）
- ✅ 安定性向上とエラーハンドリング強化

### v3.1 (Previous)
- RTX 5000/RX 9000シリーズ対応
- パフォーマンス最適化
- 多言語対応改善

---

## 📄 ライセンス / License

このプロジェクトは **MIT ライセンス** の下で公開されています。  
This project is licensed under the **MIT License**.

詳細は [LICENSE](LICENSE) ファイルをご確認ください。

---

## 🙏 謝辞 / Acknowledgments

- PC自作コミュニティの皆様からの貴重なフィードバック
- 最新パーツ情報の提供者の方々
- オープンソースプロジェクトへの貢献者の皆様

---

<div align="center">

**🔥 Made with ❤️ for PC builders worldwide 🔥**

[![GitHub stars](https://img.shields.io/github/stars/tsune4/pc-parts-recommendation?style=social)](https://github.com/tsune4/pc-parts-recommendation/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/tsune4/pc-parts-recommendation?style=social)](https://github.com/tsune4/pc-parts-recommendation/network/members)

[🌐 Live Demo](https://tsune4.github.io/pc-parts-recommendation/) | [📝 Issues](https://github.com/tsune4/pc-parts-recommendation/issues) | [🔄 Pull Requests](https://github.com/tsune4/pc-parts-recommendation/pulls)

</div>