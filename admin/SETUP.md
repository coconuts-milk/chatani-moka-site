# 編集画面（/admin）を使えるようにする手順

編集画面は https://chatani-moka-site.pages.dev/admin/ にあります。開くと GitHub でログインする画面が出ます。
ログインの仲介役（小さなプログラム）を自分の Cloudflare に 1 つ置く必要があります。一度やれば終わりです。

## 1. GitHub に「OAuth App」を作る（ログインの許可を出す側）

1. https://github.com/settings/developers → 「OAuth Apps」→「New OAuth App」
2. 次のように入れる
   - Application name: `chatani-moka-site admin`（何でもよい）
   - Homepage URL: `https://chatani-moka-site.pages.dev`
   - Authorization callback URL: `https://sveltia-cms-auth.<あなたのサブドメイン>.workers.dev/callback`
     （2 で作る Worker の URL + `/callback`。先に 2 をやって URL を確かめてから戻ってきても OK）
3. 「Register application」→ 出てきた **Client ID** を控える → 「Generate a new client secret」→ **Client secret** を控える（この画面でしか見られない）

## 2. Cloudflare Workers に仲介役を置く

1. https://github.com/sveltia/sveltia-cms-auth を開き、README の「Deploy to Cloudflare Workers」ボタンを押す
2. Cloudflare の画面でそのままデプロイする。出来た Worker の URL（`https://sveltia-cms-auth.〜.workers.dev`）を控える
3. Worker の「設定」→「変数とシークレット」に次を入れる
   - `GITHUB_CLIENT_ID` = 1 で控えた Client ID
   - `GITHUB_CLIENT_SECRET` = 1 で控えた Client secret
   - `ALLOWED_DOMAINS` = `chatani-moka-site.pages.dev`
4. 1 の callback URL が Worker の URL と合っているか確かめる

## 3. 設定ファイルに Worker の URL を書く

`admin/config.yml` の `base_url:` を Worker の URL に書き換えて push する（私に URL を伝えてもらえれば、こちらで書きます）。

## 4. 使う

https://chatani-moka-site.pages.dev/admin/ を開く → 「GitHub でログイン」→ 左の一覧から直したいものを選ぶ → 保存。
保存すると GitHub に記録され、数十秒〜1 分ほどで公開ページが作り直されます（GitHub Actions が `node build.js` を実行して結果を push し、Cloudflare Pages が公開する）。

## インサイト（訪問数）

Cloudflare のダッシュボード → Workers & Pages → chatani-moka-site → 「指標（Metrics）」→ 「Web Analytics を有効にする」を押す。
これだけでサイトに計測用の小さなスクリプトが自動で入り、同じ画面で訪問数・ページ・参照元が見られます（無料・Cookie なし）。
