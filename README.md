# Marp Preview

指定したMarpのMarkdownファイルをリアルタイムでプレビューするためのシンプルなデスクトップアプリケーションです。

## ✨ 機能

- **リアルタイムプレビュー**: Markdownファイルの変更を監視し、保存するたびにプレビューが自動で更新されます。
- **連続スクロール表示**: 複数のスライドを縦に連続して表示し、スクロールしながら全体を確認できます。
- **脚注**: `[^id]` / `[^id]: note` とインライン脚注 `^[note]` をスライドごとに表示できます。
- **BibTeX/CSL引用**: `bibliography` と `csl` を指定し、`[@key]` 形式の引用と参考文献リストを表示できます。
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

### BibTeX/CSL引用

Markdownファイルのfront matterで、BibTeXファイルとCSLファイルを指定します。パスはMarkdownファイルからの相対パスで解決されるため、`../ref.bib` のように1つ上のディレクトリも指定できます。プレビューとPDF/PPTXエクスポートの両方で同じ引用処理が使われます。

```markdown
---
bibliography: ../ref.bib
csl: ../styles/apa.csl
---

# Slide

Kent Beck は XP を体系化した [@beck2000]。
複数引用もできます [@beck2000; @fowler2018]。

---

# References

<!-- references -->
```

対応している記法は以下です。

- `bibliography`: BibTeXファイルへのパスです。必須です。
- `csl`: CSLファイルへのパスです。必須です。
- `[@key]`: BibTeXのcitation keyを使った引用です。
- `[@key1; @key2]`: 複数文献の引用です。
- `<!-- references -->`: 参考文献リストの挿入位置です。引用を使う場合は必須です。
- `<!-- references: 1-8 -->`: 参考文献リストの1件目から8件目だけを表示します。
- `<!-- references: 9- -->`: 参考文献リストの9件目以降を表示します。
- `<!-- references: -8 -->`: 参考文献リストの1件目から8件目を表示します。

たとえば、Markdownファイルが `slides/talk.md` にある場合、`bibliography: ../ref.bib` は `ref.bib` を参照します。`bibliography`、`csl`、または `<!-- references -->` が不足している場合、引用のレンダリングはエラーになります。

参考文献が1スライドに収まらない場合は、範囲指定付きの `<!-- references: ... -->` を複数のスライドに配置してください。見出しは通常のMarkdownとして自由に書けます。

```markdown
# References

<!-- references: 1-8 -->

---

# References (cont.)

<!-- references: 9- -->
```

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
