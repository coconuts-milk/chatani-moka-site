// サイトを content/ から組み立てる。使い方: node build.js
//   content/site.json        … サイト名・紹介文・このサイトについて・店長・SNS
//   content/news.json        … 更新履歴（items: [{date, text}]。新しい順に並べ直す。ホームの下に出る）
//   content/tools/*.md       … ツール（1 つ 1 ファイル。先頭に --- で囲んだ項目、その下に本文）
//   content/blog/*.md        … 制作ブログ（同上。date 順）
//   content/posts/*.md       … 投稿（論文などへのリンクとひとこと。date 順）
// 出来るもの: index.html（タブ付きの 1 枚）、tools/<名前>.html、blog/<名前>.html
// 外部のライブラリは使わない（Cloudflare Pages でもこのまま動く）。
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const C = p => path.join(ROOT, "content", p);
const read = p => fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// ---- Markdown（必要な分だけ）----
function inline(s) {
  return esc(s)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, t, u) => `<a href="${u}"${/^https?:/.test(u) ? ' target="_blank" rel="noopener"' : ""}>${t}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}
function md(src) {
  const lines = src.split("\n");
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    if (l.startsWith("```")) { const buf = []; i++; while (i < lines.length && !lines[i].startsWith("```")) buf.push(lines[i++]); i++; out.push(`<pre><code>${esc(buf.join("\n"))}</code></pre>`); continue; }
    const h = l.match(/^(#{1,3})\s+(.*)/);
    if (h) { out.push(`<h${h[1].length + 1}>${inline(h[2])}</h${h[1].length + 1}>`); i++; continue; }
    if (/^[-*]\s/.test(l)) { const items = []; while (i < lines.length && /^[-*]\s/.test(lines[i])) items.push(lines[i++].replace(/^[-*]\s/, "")); out.push(`<ul>${items.map(x => `<li>${inline(x)}</li>`).join("")}</ul>`); continue; }
    if (/^\d+\.\s/.test(l)) { const items = []; while (i < lines.length && /^\d+\.\s/.test(lines[i])) items.push(lines[i++].replace(/^\d+\.\s/, "")); out.push(`<ol>${items.map(x => `<li>${inline(x)}</li>`).join("")}</ol>`); continue; }
    if (l.startsWith("> ")) { const buf = []; while (i < lines.length && lines[i].startsWith("> ")) buf.push(lines[i++].slice(2)); out.push(`<blockquote>${inline(buf.join(" "))}</blockquote>`); continue; }
    if (/^!\[/.test(l.trim())) { const m = l.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/); if (m) { out.push(`<figure><img src="${m[2]}" alt="${esc(m[1])}" loading="lazy"><figcaption>${esc(m[1])}</figcaption></figure>`); i++; continue; } }
    const buf = []; while (i < lines.length && lines[i].trim() && !/^(#{1,3}\s|[-*]\s|\d+\.\s|```|> )/.test(lines[i])) buf.push(lines[i++]);
    out.push(`<p>${inline(buf.join("<br>"))}</p>`.replace(/&lt;br&gt;/g, "<br>"));
  }
  return out.join("\n");
}
// 先頭の --- で囲んだ項目を読む
function frontMatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { meta: {}, body: src };
  const meta = {};
  for (const line of m[1].split("\n")) { const k = line.match(/^(\w+):\s*(.*)$/); if (k) meta[k[1]] = k[2].trim().replace(/^"(.*)"$/, "$1"); }
  return { meta, body: m[2] };
}
function loadDir(dir) {
  const d = C(dir);
  if (!fs.existsSync(d)) return [];
  return fs.readdirSync(d).filter(f => f.endsWith(".md")).map(f => {
    const { meta, body } = frontMatter(read(path.join(d, f)));
    return { slug: f.replace(/\.md$/, ""), meta, body, html: md(body) };
  });
}

// ---- 読み込み ----
const site = JSON.parse(read(C("site.json")));
const news = JSON.parse(read(C("news.json"))).items.slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));
const tools = loadDir("tools").sort((a, b) => Number(a.meta.order || 99) - Number(b.meta.order || 99));
const blog = loadDir("blog").sort((a, b) => (b.meta.date || "").localeCompare(a.meta.date || ""));
const posts = loadDir("posts").sort((a, b) => (b.meta.date || "").localeCompare(a.meta.date || ""));

// ---- 共通の枠 ----
const owner = site.owner;
const TABS = [["home", "ホーム"], ["tools", "ツール"], ["blog", "制作ブログ"], ["posts", "投稿"]];
function shell({ title, body, active, depth = 0, description }) {
  const base = depth ? "../" : "./";
  // 内容の中の「/img/…」のような絶対パスは、ページの深さに合わせた相対パスにする（ファイルを直接開いても見られるように）
  body = body.replace(/(src=|href=)"\/(?!\/)/g, `$1"${base}`).replace(/url\('\/(?!\/)/g, `url('${base}`);
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title ? `${title} | ${site.name}` : site.name)}</title>
<meta name="description" content="${esc(description || site.intro)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@500;700;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${base}style.css">
</head>
<body>
<header class="top">
  <div class="awning" aria-hidden="true"></div>
  <div class="wrap sign">
    <div class="sign-text">
      <span class="open">OPEN</span>
      <a class="name" href="${base}index.html">${esc(site.name)}</a>
      <p class="bubble">${esc(site.intro)}</p>
    </div>
    <img class="chara" src="${base}img/chara.png" alt="店長 ${esc(owner.name)}">
  </div>
  <nav class="tabs" aria-label="メニュー"><div class="wrap">
    ${TABS.map(([id, label]) => `<a href="${base}index.html#${id}" data-tab="${id}" class="${id === active ? "active" : ""}">${label}</a>`).join("")}
  </div></nav>
</header>
<main class="wrap">
${body}
</main>
<footer>${esc(site.footer)}</footer>
<script src="${base}site.js"></script>
</body>
</html>
`;
}
const dateOf = m => `<time>${esc(m.date || "")}</time>`;

// ---- ホーム（タブ付き 1 枚）----
const home = `
<section class="pane home" id="pane-home">
  <div class="col">
    <h2>このサイトについて</h2>
    <div class="panel prose">${md(site.about)}</div>
    <h2>${esc(owner.title)}</h2>
    <div class="panel profile">
      <img class="face" src="./img/face.png" alt="" width="72" height="72">
      <div>
        <strong>${esc(owner.name)}</strong>
        <p>${esc(owner.bio)}</p>
        <p class="links">${owner.links.map(l => `<a href="${l.url}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join("")}</p>
      </div>
    </div>
  </div>
  <div class="col">
    <h2>更新履歴</h2>
    <ul class="board">${news.map((n, i) => `<li>${dateOf(n)}<span>${inline(n.text)}</span>${i === 0 ? '<em class="new">NEW</em>' : ""}</li>`).join("")}</ul>
  </div>
</section>

<section class="pane" id="pane-tools" hidden>
  <h2>ツール</h2>
  <div class="cards">${tools.map(t => `<a class="card" href="./tools/${t.slug}.html">${t.meta.badge ? `<span class="badge">${esc(t.meta.badge)}</span>` : ""}<div class="thumb" style="background-image:url('${t.meta.image || ""}')"></div><div class="body"><h3>${esc(t.meta.title)}</h3><p>${esc(t.meta.summary || "")}</p><span class="more">くわしく →</span></div></a>`).join("") || "<p>まだありません。</p>"}</div>
</section>

<section class="pane" id="pane-blog" hidden>
  <h2>制作ブログ</h2>
  ${blog.length ? `<ul class="list">${blog.map(b => `<li>${dateOf(b.meta)}<a href="./blog/${b.slug}.html">${esc(b.meta.title)}</a><p>${esc(b.meta.summary || "")}</p></li>`).join("")}</ul>` : `<div class="panel soon">準備中です。今後作成予定。</div>`}
</section>

<section class="pane" id="pane-posts" hidden>
  <h2>投稿</h2>
  <ul class="list">${posts.map(p => `<li>${dateOf(p.meta)}${p.meta.url ? `<a href="${p.meta.url}" target="_blank" rel="noopener">${esc(p.meta.title)}</a>` : `<strong>${esc(p.meta.title)}</strong>`}${p.meta.place ? `<span class="place">${esc(p.meta.place)}</span>` : ""}<div class="prose small">${p.html}</div></li>`).join("") || "<li>まだありません。</li>"}</ul>
</section>
`;
fs.writeFileSync(path.join(ROOT, "index.html"), shell({ body: home, active: "home" }));

// ---- ツール・ブログの個別ページ ----
fs.mkdirSync(path.join(ROOT, "tools"), { recursive: true });
fs.mkdirSync(path.join(ROOT, "blog"), { recursive: true });
for (const t of tools) {
  const body = `
<article class="prose article">
  <p class="crumb"><a href="../index.html#tools">← ツール</a></p>
  <h1>${esc(t.meta.title)}</h1>
  <p class="lead">${esc(t.meta.summary || "")}</p>
  ${t.meta.download ? `<p><a class="btn" href="${t.meta.download}">ダウンロード（zip）</a>${t.meta.repo ? ` <a class="btn ghost" href="${t.meta.repo}" target="_blank" rel="noopener">GitHub</a>` : ""}</p>` : ""}
  ${t.html}
</article>`;
  fs.writeFileSync(path.join(ROOT, "tools", `${t.slug}.html`), shell({ title: t.meta.title, body, active: "tools", depth: 1, description: t.meta.summary }));
}
for (const b of blog) {
  const body = `
<article class="prose article">
  <p class="crumb"><a href="../index.html#blog">← 制作ブログ</a></p>
  <h1>${esc(b.meta.title)}</h1>
  <p class="meta">${dateOf(b.meta)}</p>
  ${b.html}
</article>`;
  fs.writeFileSync(path.join(ROOT, "blog", `${b.slug}.html`), shell({ title: b.meta.title, body, active: "blog", depth: 1, description: b.meta.summary }));
}
// 古いページは案内だけ残す
fs.mkdirSync(path.join(ROOT, "pages"), { recursive: true });
for (const [old, to] of [["tools.html", "../index.html#tools"], ["news.html", "../index.html#home"], ["works.html", "../index.html#posts"]]) {
  fs.writeFileSync(path.join(ROOT, "pages", old), `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><meta http-equiv="refresh" content="0; url=${to}"><link rel="canonical" href="${to}"></head><body><a href="${to}">移動しました</a></body></html>\n`);
}
console.log(`index.html, tools ${tools.length}, blog ${blog.length}, posts ${posts.length}, news ${news.length}`);
