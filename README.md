# Marp Preview

指定したMarpのMarkdownファイルをリアルタイムでプレビューするためのシンプルなデスクトップアプリケーションです。

## ✨ 機能

- **リアルタイムプレビュー**: Markdownファイルの変更を監視し、保存するたびにプレビューが自動で更新されます。
- **複数ウィンドウ**: 複数のMarkdownファイルをそれぞれ独立したウィンドウで同時に開けます。
- **連続スクロール表示**: 複数のスライドを縦に連続して表示し、スクロールしながら全体を確認できます。
- **脚注**: `[^id]` / `[^id]: note` とインライン脚注 `^[note]` をスライドごとに表示できます。
- **Callouts**: GitHub AlertsとObsidian Calloutsの `> [!NOTE]` 形式を、種類ごとの色とアイコン付きで表示できます。
- **BibTeX/CSL引用**: `bibliography` と `csl` を指定し、`[@key]` 形式の引用と参考文献リストを表示できます。
- **シンプルなUI**: `CmdOrCtrl+O` またはメニューの `File > Open File` からファイルを選択するだけの簡単操作です。
- **PDF/PPTXエクスポート**: 開いているMarp MarkdownファイルをPDFまたはPPTX形式でエクスポートできます。メニューの `File > Export` から選択してください。
- **Science Tokyoテーマ**: 東京科学大学（Science Tokyo）のMarpテーマを内蔵し、プレビューとPDF/PPTXエクスポートの両方で利用できます。
- **クリップボード画像の保存**: 画像をコピーして `CmdOrCtrl+V` を押すと、Markdownファイルと同じ階層の `images` ディレクトリにPNGとして保存し、画像を参照するMarkdown記法をクリップボードにコピーします。
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

アプリケーションが起動したら、メニューの `File > Open File` またはショートカットキー `CmdOrCtrl+O` を使って、プレビューしたいMarkdownファイルを選択してください。複数のファイルを同時に選択すると、ファイルごとに別のウィンドウで開きます。表示中のウィンドウから別のファイルを開いた場合も新しいウィンドウが作成され、同じファイルがすでに開いている場合は既存のウィンドウが前面に移動します。

空のウィンドウを追加するには、`File > New Window` または `CmdOrCtrl+N` を使います。macOSのビルド版では、Finderの「このアプリケーションで開く」からMarkdownファイルを選ぶこともできます。

### プレゼンテーションを複数ファイルに分割する

`<!-- @include: ファイル名.md -->` を使うと、同じディレクトリにあるMarkdownファイルを読み込めます。たとえば、次のようにファイルを配置します。

```text
presentation/
├── deck.md
├── 01-title.md
├── 02-introduction.md
└── 03-summary.md
```

エントリーポイントとなる `deck.md` にfront matterとincludeディレクティブを書きます。スライドの区切りは通常どおり `---` で指定します。

```markdown
---
marp: true
---

<!-- @include: 01-title.md -->

---

<!-- @include: 02-introduction.md -->

---

<!-- @include: 03-summary.md -->
```

各分割ファイルにはスライドの内容だけを書き、front matterは `deck.md` にまとめてください。分割ファイル内に `---` を書けば、1つのファイルに複数のスライドを含めることもできます。

include先は `deck.md` と同じディレクトリの `.md` または `.markdown` ファイルに限られます。画像、`bibliography`、`csl` などの相対パスも `deck.md` と同じディレクトリを基準に解決されます。開いているデッキに含まれるファイルの変更は自動的にプレビューへ反映され、PDF/PPTXエクスポートにも結合後の内容が使われます。

### Science Tokyoテーマ

front matterで`science-tokyo`を指定すると、内蔵テーマを利用できます。テーマ用のCSSや画像をプレゼンテーションのディレクトリへコピーする必要はありません。

```yaml
---
marp: true
theme: science-tokyo
size: 16:9
paginate: true
---
```

表紙、中表紙、目次、コンテンツ用のクラスと記述例は、[marp-theme_science-tokyo](https://github.com/kdmsnr/marp-theme_science-tokyo)を参照してください。

### Callouts（admonition）

GitHub Alertsと[Obsidian Callouts](https://obsidian.md/help/callouts)で使われるblockquote形式で、補足や警告を色とアイコン付きで表示できます。プレビューだけでなく、PDF/PPTXエクスポートにも反映されます。

```markdown
> [!NOTE]
> 読み飛ばす場合にも知っておくと役立つ補足です。

> [!TIP] **独自タイトルも使えます**
> より簡単に進めるためのヒントです。

> [!SUCCESS] タイトルだけのCallout
```

Obsidianの標準タイプと別名に対応します。

- `NOTE`
- `ABSTRACT`（`SUMMARY`、`TLDR`）
- `INFO`
- `TODO`
- `TIP`（`HINT`）
- `SUCCESS`（`CHECK`、`DONE`）
- `QUESTION`（`HELP`、`FAQ`）
- `WARNING`（`ATTENTION`）
- `FAILURE`（`FAIL`、`MISSING`）
- `DANGER`（`ERROR`）
- `BUG`
- `EXAMPLE`
- `QUOTE`（`CITE`）

既存のGitHub Alertsとの互換性のため、`IMPORTANT`と`CAUTION`もそれぞれ従来の色とアイコンで表示します。タイプ名は大文字・小文字を区別しません。未知のタイプは`NOTE`の見た目にフォールバックします。複数段落を書く場合は空のblockquote行を挟みます。折りたたみの`[!type]+` / `[!type]-`と、リストや別のblockquoteなどへのCalloutの入れ子には対応していません。

### BibTeX/CSL引用

Markdownファイルのfront matterで、BibTeXファイルとCSLファイルを指定します。パスはMarkdownファイルからの相対パスで解決されるため、`../ref.bib` のように1つ上のディレクトリも指定できます。プレビューとPDF/PPTXエクスポートの両方で同じ引用処理が使われます。

```markdown
---
bibliography: ../ref.bib
csl: ../styles/apa.csl
---

# Slide

Kent Beck は XP を体系化した [@beck2000]。
@beck2000 は XP を体系化した。
複数引用もできます [@beck2000; @fowler2018]。

---

# References

<!-- @references -->
```

対応している記法は以下です。

- `bibliography`: BibTeXファイルへのパスです。必須です。
- `csl`: CSLファイルへのパスです。必須です。
- `[@key]`: BibTeXのcitation keyを使った引用です。
- `@key`: 著者名を本文に含める引用です。たとえばAPAでは `Beck (2000)` のように表示されます。
- `[@key1; @key2]`: 複数文献の引用です。
- `<!-- @references -->`: 参考文献リストの挿入位置です。省略した場合、本文中の引用だけを表示します。
- `<!-- @references: 1-8 -->`: 参考文献リストの1件目から8件目だけを表示します。
- `<!-- @references: 9- -->`: 参考文献リストの9件目以降を表示します。
- `<!-- @references: -8 -->`: 参考文献リストの1件目から8件目を表示します。

たとえば、Markdownファイルが `slides/talk.md` にある場合、`bibliography: ../ref.bib` は `ref.bib` を参照します。引用を使う場合、`bibliography` と `csl` は必須です。`<!-- @references -->` は任意で、書いた位置にだけ参考文献リストを挿入します。

参考文献が1スライドに収まらない場合は、範囲指定付きの `<!-- @references: ... -->` を複数のスライドに配置してください。見出しは通常のMarkdownとして自由に書けます。

```markdown
# References

<!-- @references: 1-8 -->

---

# References (cont.)

<!-- @references: 9- -->
```

### クリップボード画像の保存

Markdownファイルを開いた状態で画像をクリップボードにコピーし、`CmdOrCtrl+V` を押すか、`Edit > Paste Image and Copy Markdown` を選択します。画像はMarkdownファイルと同じ階層の `images` ディレクトリに `image-YYYYMMDD-HHmmss.png` として保存され、次のようなMarkdown記法がクリップボードに入ります。

```markdown
![image](images/image-20260722-090507.png)
```

Markdownファイルを開いていない場合や、クリップボードに画像がない場合はエラーを表示し、ファイルやクリップボードは変更しません。画像は操作したウィンドウで開いているMarkdownファイルと同じ階層へ保存されます。ウィンドウを閉じても、ほかのウィンドウのプレビューやファイル監視は継続します。

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

内蔵するScience Tokyoテーマのロゴ、背景画像、デザイン資産には別の利用条件があります。[テーマの利用条件](https://github.com/kdmsnr/marp-theme_science-tokyo/blob/v0.1.0/LICENSE)と[Science Tokyoデザインシステムの利用規約](https://design-system.isct.ac.jp/ja/terms-of-use)を確認してください。
