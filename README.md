# Marp Preview

指定したMarpのMarkdownファイルをリアルタイムでプレビューするためのシンプルなデスクトップアプリケーションです。

## ✨ 機能

- **リアルタイムプレビュー**: Markdownファイルの変更を監視し、保存するたびにプレビューが自動で更新されます。
- **連続スクロール表示**: 複数のスライドを縦に連続して表示し、スクロールしながら全体を確認できます。
- **シンプルなUI**: `CmdOrCtrl+O` またはメニューの `File > Open File` からファイルを選択するだけの簡単操作です。

## 🛠️ 使い方

### 必要なもの

- [Node.js](https://nodejs.org/) (v18以上を推奨)

### 1. インストール

リポジトリをクローンし、依存関係をインストールします。

```bash
git clone https://github.com/kdmsnr/marp-preview.git
cd marp-preview
npm install
```

### 2. 起動

以下のコマンドでアプリケーションを起動します。

```bash
npm start
```

### 3. ファイルを開く

アプリケーションが起動したら、メニューの `File > Open File` またはショートカットキー `CmdOrCtrl+O` を使って、プレビューしたいMarkdownファイルを選択してください。

## 📝 ライセンス

このプロジェクトは [MIT License](LICENSE) のもとで公開されています。
