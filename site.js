// タブの切り替え（URL の #tools などと連動）、舞う花びら、スクロールで出てくる動き
(() => {
  const panes = [...document.querySelectorAll(".pane")];
  const tabs = [...document.querySelectorAll(".tabs a[data-tab]")];
  const ids = panes.map(p => p.id.replace("pane-", ""));

  function show(id, push) {
    if (!ids.includes(id)) id = "home";
    panes.forEach(p => { p.hidden = p.id !== "pane-" + id; });
    tabs.forEach(a => a.classList.toggle("active", a.dataset.tab === id));
    if (push && location.hash !== "#" + id) history.pushState(null, "", "#" + id);
    document.querySelectorAll(".reveal").forEach(el => el.classList.remove("in"));
    requestAnimationFrame(() => document.querySelectorAll(".pane:not([hidden]) .reveal").forEach(el => el.classList.add("in")));
    window.scrollTo({ top: 0 });
  }
  if (panes.length) {
    // タブ付きのページ（index.html）: クリックで切り替え、戻る/進むにも追随
    tabs.forEach(a => a.addEventListener("click", ev => { ev.preventDefault(); show(a.dataset.tab, true); }));
    document.querySelectorAll("[data-go]").forEach(a => a.addEventListener("click", ev => { ev.preventDefault(); show(a.dataset.go, true); }));
    window.addEventListener("hashchange", () => show(location.hash.slice(1) || "home", false));
    show(location.hash.slice(1) || "home", false);
  }

  // 花びらと葉（軽め）
  const box = document.querySelector(".petals");
  if (box && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    for (let i = 0; i < 14; i++) {
      const p = document.createElement("div");
      p.className = "petal " + (i % 3 === 0 ? "g" : "p");
      p.style.left = Math.random() * 100 + "vw";
      p.style.animationDuration = 14 + Math.random() * 14 + "s";
      p.style.animationDelay = -Math.random() * 20 + "s";
      p.style.transform = `scale(${.6 + Math.random() * .8})`;
      box.appendChild(p);
    }
  }
  // スクロールで出てくる
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add("in"); }), { threshold: .12 });
  document.querySelectorAll(".card, .panel").forEach(el => { el.classList.add("reveal"); io.observe(el); });
})();
