# PC自作パーツ推奨システム / PC Build Parts Recommendation System

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://tsune4.github.io/pc-parts-recommendation/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## 🖥️ 概要 / Overview

予算とスペック条件に応じて最適なPCパーツ構成を提案するWebアプリケーションです。  
A web application that suggests optimal PC part configurations based on budget and specification requirements.

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

### その他
- 最新CPU（Intel 13th gen, AMD Ryzen 7000シリーズ）
- DDR4/DDR5メモリ対応
- NVMe SSD推奨

## 🛠️ 技術仕様 / Technical Specifications

- **フロントエンド**: HTML5, CSS3, Vanilla JavaScript
- **デプロイ**: GitHub Pages（静的サイト）
- **データ形式**: JSON
- **多言語**: JavaScript i18n

## 📊 予算配分アルゴリズム / Budget Allocation Algorithm

| 用途 / Usage | CPU | GPU | その他パーツ / Others |
|--------------|-----|-----|--------------------|
| ゲーミング / Gaming | 25% | 55% | 20% |
| クリエイティブ / Creative | 30% | 45% | 25% |
| 開発 / Development | 30% | 30% | 40% |
| オフィス / Office | 25% | 20% | 55% |

## 🎯 使用方法 / How to Use

1. 総予算を設定（1万円単位）
2. 希望RAM容量を選択
3. ストレージ容量・タイプを選択
4. GPUブランドを選択（NVIDIA/AMD/指定なし）
5. 用途を選択（ゲーミング/クリエイティブ/開発/オフィス）
6. 「構成を提案」ボタンをクリック

## 🔧 ローカル開発 / Local Development

```bash
# リポジトリをクローン
git clone https://github.com/tsune4/pc-parts-recommendation.git

# docsフォルダに移動
cd pc-parts-recommendation/docs

# 静的サーバーで起動（例：Live Server）
# または直接index.htmlをブラウザで開く
```

## 📁 ファイル構成 / File Structure

```
docs/
├── index.html          # メインHTML
├── styles.css          # スタイルシート
├── script.js           # メインJavaScript
├── translations.js     # 多言語対応
├── parts-data.js       # パーツデータ
├── pc-recommender.js   # 推奨エンジン
└── README.md          # このファイル
```

## 🤝 コントリビューション / Contributing

1. このリポジトリをフォーク
2. 新しいブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス / License

このプロジェクトはMITライセンスの下で公開されています。  
This project is licensed under the MIT License.

## 📞 サポート / Support

問題や要望がある場合は、[Issues](https://github.com/tsune4/pc-parts-recommendation/issues)でお知らせください。

---

**Made with ❤️ for PC builders worldwide**