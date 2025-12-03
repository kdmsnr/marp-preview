# Marp Preview

指定したMarpのMarkdownファイルをリアルタイムでプレビューするためのシンプルなデスクトップアプリケーションです。

## ✨ 機能

- **リアルタイムプレビュー**: Markdownファイルの変更を監視し、保存するたびにプレビューが自動で更新されます。
- **連続スクロール表示**: 複数のスライドを縦に連続して表示し、スクロールしながら全体を確認できます。
- **シンプルなUI**: `CmdOrCtrl+O` またはメニューの `File > Open File` からファイルを選択するだけの簡単操作です。
- **PDF/PPTXエクスポート**: 開いているMarp MarkdownファイルをPDFまたはPPTX形式でエクスポートできます。メニューの `File > Export` から選択してください。
- **常に前面表示**: 他のウィンドウの上にアプリケーションを常に表示します。メニューの `View > Always On Top` またはショートカットキー `CmdOrCtrl+T` で切り替えられます。

## 🛠️ 使い方

### 必要なもの

- [Node.js](https://nodejs.org/) (v18以上を推奨)

### 1. インストール

リポジリをクローンし、依存関係をインストールします。

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

## 📦 ビルド

このアプリケーションは[Electron Builder](https://www.electron.build/)を使用して、各プラットフォーム向けの実行ファイルを生成できます。

### ビルドコマンド

以下のコマンドで、それぞれのプラットフォーム向けのアプリケーションをビルドできます。ビルドされたファイルは`dist`ディレクトリに出力されます。

- **現在のOS向けにビルド**
  現在作業しているOS（macOSまたはWindows）向けのアプリケーションをビルドします。

  ```bash
  npm run dist
  ```

- **macOS向けにビルド**
  macOS向けのアプリケーション（`.app`と`.dmg`インストーラー）をビルドします。

  ```bash
  npm run dist:mac
  ```

- **Windows向けにビルド**
  Windows向けのインストーラー（`.exe`）をビルドします。macOSやLinux環境でもクロスコンパイルが可能です。
  ```bash
  npm run dist:win
  ```

## 📝 ライセンス

このプロジェクトは [MIT License](LICENSE) のもとで公開されています。
