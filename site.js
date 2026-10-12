// タブの切り替え（URL の #tools などと連動）
(() => {
  const panes = [...document.querySelectorAll(".pane")];
  const tabs = [...document.querySelectorAll(".tabs a[data-tab]")];
  const ids = panes.map(p => p.id.replace("pane-", ""));
  // 舞う花びらと葉（軽め）
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
  if (!panes.length) return;
  function show(id, push) {
    if (!ids.includes(id)) id = "home";
    panes.forEach(p => { p.hidden = p.id !== "pane-" + id; });
    tabs.forEach(a => a.classList.toggle("active", a.dataset.tab === id));
    if (push && location.hash !== "#" + id) history.pushState(null, "", "#" + id);
    window.scrollTo({ top: 0 });
  }
  tabs.forEach(a => a.addEventListener("click", ev => { ev.preventDefault(); show(a.dataset.tab, true); }));
  window.addEventListener("hashchange", () => show(location.hash.slice(1) || "home", false));
  show(location.hash.slice(1) || "home", false);

  // 目安箱の送信（/api/inbox に送る。届け先は functions/api/inbox.js）
  const form = document.getElementById("inbox-form");
  if (form) form.addEventListener("submit", async ev => {
    ev.preventDefault();
    const st = form.querySelector(".status"), btn = form.querySelector("button");
    const data = Object.fromEntries(new FormData(form).entries());
    btn.disabled = true; st.textContent = "送っています…";
    try {
      const r = await fetch("./api/inbox", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.ok) { form.reset(); st.textContent = "届きました。ありがとうございます。"; }
      else st.textContent = j.error || "送信に失敗しました。";
    } catch { st.textContent = "送信に失敗しました。通信を確かめてもう一度どうぞ。"; }
    btn.disabled = false;
  });
})();
