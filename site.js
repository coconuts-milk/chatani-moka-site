// タブの切り替え（URL の #tools などと連動）
(() => {
  const panes = [...document.querySelectorAll(".pane")];
  const tabs = [...document.querySelectorAll(".tabs a[data-tab]")];
  const ids = panes.map(p => p.id.replace("pane-", ""));
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
})();
