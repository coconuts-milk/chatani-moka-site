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
3. Worker の「設定」→「ランタイム変数とシークレット」（プロダクション）に次を入れる。「ビルド」の変数欄ではない（そこに入れても Worker からは見えない）
   - `GITHUB_CLIENT_ID` = 1 で控えた Client ID
   - `GITHUB_CLIENT_SECRET` = 1 で控えた Client secret
   - `ALLOWED_DOMAINS` = `chatani-moka-site.pages.dev`
4. 入れたら下に出る「デプロイ」を押す
5. Worker の「ドメイン」タブで、プロダクションの `…workers.dev` のスイッチがオンになっているか確かめる（オフだと 404 になる）
6. 1 の callback URL が Worker の URL と合っているか確かめる

## 3. 設定ファイルに Worker の URL を書く

`admin/config.yml` の `base_url:` を Worker の URL に書き換えて push する（私に URL を伝えてもらえれば、こちらで書きます）。

## 4. 使う

https://chatani-moka-site.pages.dev/admin/ を開く → 「GitHub でログイン」→ 左の一覧から直したいものを選ぶ → 保存。
保存すると GitHub に記録され、数十秒〜1 分ほどで公開ページが作り直されます（GitHub Actions が `node build.js` を実行して結果を push し、Cloudflare Pages が公開する）。

## インサイト（訪問数）

Cloudflare のダッシュボード → Workers & Pages → chatani-moka-site → 「指標（Metrics）」→ 「Web Analytics を有効にする」を押す。
これだけでサイトに計測用の小さなスクリプトが自動で入り、同じ画面で訪問数・ページ・参照元が見られます（無料・Cookie なし）。

## 目安箱（お問い合わせフォーム）の届け先

目安箱に書かれた内容は、GitHub の非公開リポジトリに Issue として届きます（Issue が立つと GitHub からメールも来ます）。
一度だけ次の 3 つをやれば動きます。

1. **非公開リポジトリを作る**: https://github.com/new で Repository name を `moka-inbox`、Private を選んで Create。
2. **書き込み用のトークンを作る**: https://github.com/settings/personal-access-tokens/new
   - Token name: `moka-inbox`、Expiration: 好きな期間（切れたら作り直し）
   - Repository access: Only select repositories → `moka-inbox`
   - Permissions → Repository permissions → **Issues** を **Read and write**
   - Generate token → 出てきた `github_pat_…` を控える（この画面でしか見られない）
3. **Cloudflare Pages に入れる**: https://dash.cloudflare.com → Workers & Pages → `chatani-moka-site` → 設定 → 変数とシークレット → プロダクション
   - `GITHUB_TOKEN` = 2 のトークン（タイプはシークレット）
   - `INBOX_REPO` = `coconuts-milk/moka-inbox`（タイプはテキスト）
   - 保存したら「デプロイ」タブで一番上のデプロイの「…」→「再デプロイ」（変数は次のデプロイから効く）

確認: サイトの「目安箱」から試しに送って、`moka-inbox` の Issues に出れば OK。設定前は「まだ準備中です」と出る。
