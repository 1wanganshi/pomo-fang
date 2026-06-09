const state = PomoStore.loadState();

const dom = {
  moduleGrid: document.querySelector("#moduleGrid"),
  visibleCountLabel: document.querySelector("#visibleCountLabel"),
  resetDemoButton: document.querySelector("#resetDemoButton"),
};

function renderHome() {
  const visibleModules = PomoStore.getVisibleModules(state);
  dom.visibleCountLabel.textContent = `${visibleModules.length} 个作图入口`;
  dom.moduleGrid.innerHTML = "";

  if (!visibleModules.length) {
    dom.moduleGrid.innerHTML = `<div class="empty-state">后台未开启模块</div>`;
    return;
  }

  visibleModules.forEach((module) => {
    const link = document.createElement("a");
    link.className = "module-card home-card";
    link.href = `./module.html?id=${encodeURIComponent(module.id)}`;
    link.style.setProperty("--accent", PomoStore.accentMap[module.accent] || PomoStore.accentMap.ink);
    link.innerHTML = `
      <h3>${PomoStore.escapeHtml(module.name)}</h3>
      <p>${PomoStore.escapeHtml(module.description)}</p>
      <span>${PomoStore.escapeHtml(module.ratio)}</span>
    `;
    dom.moduleGrid.appendChild(link);
  });
}

dom.resetDemoButton.addEventListener("click", () => {
  PomoStore.resetState();
  window.location.reload();
});

renderHome();
