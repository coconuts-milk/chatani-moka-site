# 萌香の憩いCAFE（chatani-moka-site）

https://chatani-moka-site.pages.dev/ （Cloudflare Pages。GitHub の main に push すると自動で公開）

## 更新のしかた

### 編集画面から（ふだんはこちら）
https://chatani-moka-site.pages.dev/admin/ を開き、GitHub でログインして編集 → 保存。数十秒〜1 分で公開ページに反映される。
初回の設定は `admin/SETUP.md`。

### 手で直す
`content/` のファイルを直して `node build.js` を実行し、push する（GitHub Actions も同じことをするので、`node build.js` を忘れても公開はされる）。

| したいこと | 触るファイル |
|---|---|
| 更新履歴を足す | `content/news.json` の items に `{ "date": "...", "text": "..." }` |
| ツールの説明を直す | `content/tools/<名前>.md` |
| ブログを書く | `content/blog/<日付>-<名前>.md` |
| 作品を載せる | `content/works/<日付>-<名前>.md` と画像 |
| サイト名・紹介文・店長・SNS | `content/site.json` |
| 店長の絵 | `img/chara.png`（全身・ヘッダー）、`img/chara_alt.png`（顔・丸アイコン） |

## 仕組み
- `build.js` が `content/` を読んで `index.html`（タブ付き 1 枚）、`tools/*.html`、`blog/*.html` を作る。外部ライブラリなし。
- 見た目は `style.css`、タブ切り替え・花びら・スクロールの動きは `site.js`。
- `.github/workflows/build.yml` が content の変更ごとに `node build.js` を実行して結果を push する。
