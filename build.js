// サイトを content/ から組み立てる。使い方: node build.js
//   content/site.json        … サイト名・このサイトについて・店長・SNS
//   content/news.json        … 更新履歴（items: [{date, text}]。新しい順に並べ直す）
//   content/tools/*.md       … ツール（1 つ 1 ファイル。先頭に --- で囲んだ項目、その下に本文）
//   content/blog/*.md        … 制作ブログ（同上。date 順）
//   content/works/*.md       … 投稿作品（同上。image が一覧の絵）
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
  for (const line of m[1].split("\n")) { const k = line.match(/^(\w+):\s*(.*)$/); if (k) meta[k[1]] = k[2].trim(); }
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
const works = loadDir("works").sort((a, b) => (b.meta.date || "").localeCompare(a.meta.date || ""));

// ---- 共通の枠 ----
const TABS = [["home", "ホーム"], ["tools", "ツール"], ["news", "更新履歴"], ["blog", "制作ブログ"], ["works", "投稿作品"]];
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
<meta name="description" content="${esc(description || site.hero_text)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@500;700;900&family=Kiwi+Maru:wght@500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${base}style.css">
</head>
<body>
<div class="petals" aria-hidden="true"></div>
<header class="top">
  <div class="wrap bar">
    <a class="logo" href="${base}index.html"><span class="cup">☕</span>${esc(site.name)}</a>
  </div>
  <nav class="tabs" aria-label="メニュー"><div class="wrap">
    ${TABS.map(([id, label]) => `<a href="${base}index.html#${id}" data-tab="${id}" class="${id === active ? "active" : ""}">${label}</a>`).join("")}
  </div></nav>
</header>
<main class="wrap">
${body}
</main>
<footer><div class="cup">☕</div>${esc(site.footer)}</footer>
<script src="${base}site.js"></script>
</body>
</html>
`;
}

// ---- ホーム（タブ付き 1 枚）----
const owner = site.owner;
const home = `
<section class="pane" id="pane-home">
  <div class="hero">
    <div class="board">
      <div class="board-text">
        <span class="open">OPEN · いらっしゃいませ</span>
        <h1>${site.hero_lines.map((l, i) => i === site.hero_lines.length - 1 ? `<span class="mark">${esc(l)}</span>` : esc(l)).join("<br>")}</h1>
        <p>${esc(site.hero_text)}</p>
        <a class="btn" href="#tools" data-go="tools">🍵 ツールを見る</a><a class="btn pink" href="#news" data-go="news">🌸 新着を見る</a>
      </div>
      <img class="chara" src="./img/chara.png" alt="店長 ${esc(owner.name)}">
    </div>
    <div class="ticker"><span>📢 ${esc(site.ticker)}</span></div>
  </div>

  <div class="menu-title"><h2>${esc(site.about_title)}</h2><span class="en">ABOUT</span></div>
  <div class="panel prose">${md(site.about)}</div>

  <div class="menu-title"><h2>${esc(owner.title)}</h2><span class="en">OWNER</span></div>
  <div class="panel profile">
    <img class="face" src="./img/face.png" alt="" width="120" height="120">
    <div>
      <strong>${esc(owner.title)} ${esc(owner.name)}</strong>
      <p>${esc(owner.bio)}</p>
      <div class="links">${owner.links.map(l => `<a href="${l.url}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join("")}</div>
    </div>
  </div>

  <div class="menu-title"><h2>新着</h2><span class="en">LATEST</span></div>
  <div class="cards">
    ${tools.slice(0, 1).map(t => toolCard(t, "./")).join("")}
    ${blog.slice(0, 1).map(b => `<a class="card" href="./blog/${b.slug}.html"><span class="badge green">BLOG</span><div class="thumb ph">📝</div><div class="body"><h3>${esc(b.meta.title)}</h3><p>${esc(b.meta.summary || "")}</p><span class="more">読む →</span></div></a>`).join("")}
  </div>
</section>

<section class="pane" id="pane-tools" hidden>
  <div class="menu-title"><h2>ツール</h2><span class="en">TOOLS</span></div>
  <div class="cards">${tools.map(t => toolCard(t, "./")).join("")}</div>
</section>

<section class="pane news" id="pane-news" hidden>
  <div class="menu-title"><h2>更新履歴</h2><span class="en">NEWS</span></div>
  <ul class="panel">${news.map((n, i) => `<li><time>${esc(n.date)}</time><span>${inline(n.text)}${i === 0 ? '<span class="new">NEW</span>' : ""}</span></li>`).join("")}</ul>
</section>

<section class="pane" id="pane-blog" hidden>
  <div class="menu-title"><h2>制作ブログ</h2><span class="en">BLOG</span></div>
  <ul class="panel list">${blog.map(b => `<li><time>${esc(b.meta.date || "")}</time><a href="./blog/${b.slug}.html">${esc(b.meta.title)}</a><p>${esc(b.meta.summary || "")}</p></li>`).join("") || "<li>まだ記事がありません。</li>"}</ul>
</section>

<section class="pane" id="pane-works" hidden>
  <div class="menu-title"><h2>投稿作品</h2><span class="en">WORKS</span></div>
  <div class="gallery">${works.map(w => `<figure class="panel"><img src="${w.meta.image || ""}" alt="${esc(w.meta.title)}" loading="lazy"><figcaption><strong>${esc(w.meta.title)}</strong><time>${esc(w.meta.date || "")}</time>${w.html}</figcaption></figure>`).join("") || "<p>まだ作品がありません。</p>"}</div>
</section>
`;
function toolCard(t, base) {
  return `<a class="card" href="${base}tools/${t.slug}.html">${t.meta.badge ? `<span class="badge">${esc(t.meta.badge)}</span>` : ""}<div class="thumb" style="background-image:url('${t.meta.image || ""}')"></div><div class="body"><h3>${esc(t.meta.title)}</h3><p>${esc(t.meta.summary || "")}</p><span class="more">くわしく →</span></div></a>`;
}

fs.writeFileSync(path.join(ROOT, "index.html"), shell({ body: home, active: "home" }));

// ---- ツール・ブログの個別ページ ----
fs.mkdirSync(path.join(ROOT, "tools"), { recursive: true });
fs.mkdirSync(path.join(ROOT, "blog"), { recursive: true });
for (const t of tools) {
  const body = `
<article class="panel prose article">
  <p class="crumb"><a href="../index.html#tools">← ツール一覧</a></p>
  <h1>${esc(t.meta.title)}</h1>
  <p class="lead">${esc(t.meta.summary || "")}</p>
  ${t.meta.download ? `<p><a class="btn" href="${t.meta.download}">⬇ ダウンロード（zip）</a>${t.meta.repo ? `<a class="btn ghost" href="${t.meta.repo}" target="_blank" rel="noopener">GitHub</a>` : ""}</p>` : ""}
  ${t.html}
</article>`;
  fs.writeFileSync(path.join(ROOT, "tools", `${t.slug}.html`), shell({ title: t.meta.title, body, active: "tools", depth: 1, description: t.meta.summary }));
}
for (const b of blog) {
  const body = `
<article class="panel prose article">
  <p class="crumb"><a href="../index.html#blog">← 制作ブログ</a></p>
  <h1>${esc(b.meta.title)}</h1>
  <p class="meta"><time>${esc(b.meta.date || "")}</time></p>
  ${b.html}
</article>`;
  fs.writeFileSync(path.join(ROOT, "blog", `${b.slug}.html`), shell({ title: b.meta.title, body, active: "blog", depth: 1, description: b.meta.summary }));
}
// 古いページは案内だけ残す
fs.mkdirSync(path.join(ROOT, "pages"), { recursive: true });
for (const [old, to] of [["tools.html", "../index.html#tools"], ["news.html", "../index.html#news"], ["works.html", "../index.html#works"]]) {
  fs.writeFileSync(path.join(ROOT, "pages", old), `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><meta http-equiv="refresh" content="0; url=${to}"><link rel="canonical" href="${to}"></head><body><a href="${to}">移動しました</a></body></html>\n`);
}
console.log(`index.html, tools ${tools.length}, blog ${blog.length}, works ${works.length}, news ${news.length}`);
