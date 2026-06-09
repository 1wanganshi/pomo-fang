let state = PomoStore.loadState();

const dom = {
  navItems: document.querySelectorAll(".admin-nav-item"),
  panels: document.querySelectorAll(".admin-panel"),
  panelEyebrow: document.querySelector("#panelEyebrow"),
  panelTitle: document.querySelector("#panelTitle"),
  activeModelPill: document.querySelector("#activeModelPill"),
  visibleModulePill: document.querySelector("#visibleModulePill"),
  modelMetric: document.querySelector("#modelMetric"),
  visibleModuleMetric: document.querySelector("#visibleModuleMetric"),
  moduleMetric: document.querySelector("#moduleMetric"),
  promptMetric: document.querySelector("#promptMetric"),
  activeModelSummary: document.querySelector("#activeModelSummary"),
  visibleModuleSummary: document.querySelector("#visibleModuleSummary"),
  previewModuleList: document.querySelector("#previewModuleList"),
  modelForm: document.querySelector("#modelForm"),
  modelList: document.querySelector("#modelList"),
  moduleForm: document.querySelector("#moduleForm"),
  moduleList: document.querySelector("#moduleList"),
  resetDemoButton: document.querySelector("#resetDemoButton"),
};

function renderAdmin() {
  renderOverview();
  renderModels();
  renderModules();
  refreshPreviewFrame();
}

function switchPanel(panelName) {
  const labels = {
    overview: ["Dashboard", "总览"],
    models: ["Models", "模型管理"],
    modules: ["Modules", "模块管理"],
    preview: ["Preview", "前台预览"],
  };

  dom.navItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.panel === panelName);
  });
  dom.panels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.panel === panelName);
  });
  dom.panelEyebrow.textContent = labels[panelName]?.[0] || "Dashboard";
  dom.panelTitle.textContent = labels[panelName]?.[1] || "总览";
}

function renderOverview() {
  const activeModel = PomoStore.getActiveModel(state);
  const visibleModules = PomoStore.getVisibleModules(state);
  const readyModels = state.models.filter((model) => model.status === "ready");

  dom.activeModelPill.textContent = activeModel ? `${activeModel.name} · ${activeModel.status === "ready" ? "可用" : "未测试"}` : "没有模型";
  dom.visibleModulePill.textContent = `${visibleModules.length} 个前台模块`;
  dom.modelMetric.textContent = state.models.length;
  dom.visibleModuleMetric.textContent = visibleModules.length;
  dom.moduleMetric.textContent = state.modules.length;
  dom.promptMetric.textContent = state.lastPrompt ? "有" : "无";
  dom.activeModelSummary.textContent = activeModel
    ? `${activeModel.name}，${activeModel.provider}，${activeModel.status === "ready" ? "测试通过" : "未测试"}。可用模型 ${readyModels.length} 个。`
    : "暂无模型";
  renderPillList(dom.visibleModuleSummary, visibleModules);
  renderPillList(dom.previewModuleList, visibleModules);
}

function renderPillList(container, modules) {
  container.innerHTML = "";
  if (!modules.length) {
    container.innerHTML = `<span class="hint-pill">暂无可见模块</span>`;
    return;
  }
  modules.forEach((module) => {
    const pill = document.createElement("a");
    pill.className = "hint-pill hint-button";
    pill.href = `./module.html?id=${encodeURIComponent(module.id)}`;
    pill.target = "_blank";
    pill.textContent = module.name;
    container.appendChild(pill);
  });
}

function refreshPreviewFrame() {
  const frame = document.querySelector(".front-preview-frame");
  if (!frame) return;
  const url = new URL(frame.getAttribute("src"), window.location.href);
  url.searchParams.set("refresh", Date.now().toString());
  frame.src = `${url.pathname}${url.search}`;
}

function renderModels() {
  dom.modelList.innerHTML = "";
  if (!state.models.length) {
    dom.modelList.innerHTML = `<div class="empty-state">还没有模型</div>`;
    return;
  }

  state.models.forEach((model) => {
    const card = document.createElement("article");
    card.className = "list-card desktop-row";
    card.innerHTML = `
      <header>
        <div>
          <h3>${PomoStore.escapeHtml(model.name)}</h3>
          <p>${PomoStore.escapeHtml(model.provider)} · ${model.status === "ready" ? "测试通过" : "未测试"}</p>
          <p>${model.endpoint ? PomoStore.escapeHtml(model.endpoint) : "本地演示"}</p>
        </div>
      </header>
      <div class="card-actions">
        <button class="mini-button ${model.id === state.activeModelId ? "active" : ""}" type="button" data-action="activate">启用</button>
        <button class="mini-button" type="button" data-action="test">测试</button>
        <button class="mini-button danger" type="button" data-action="delete">删除</button>
      </div>
    `;
    card.querySelector('[data-action="activate"]').addEventListener("click", () => {
      state.activeModelId = model.id;
      PomoStore.saveState(state);
      renderAdmin();
      PomoStore.showToast("模型已启用");
    });
    card.querySelector('[data-action="test"]').addEventListener("click", () => testModel(model.id));
    card.querySelector('[data-action="delete"]').addEventListener("click", () => deleteModel(model.id));
    dom.modelList.appendChild(card);
  });
}

function renderModules() {
  dom.moduleList.innerHTML = "";
  if (!state.modules.length) {
    dom.moduleList.innerHTML = `<div class="empty-state">还没有模块</div>`;
    return;
  }

  state.modules.forEach((module) => {
    const card = document.createElement("article");
    card.className = "list-card module-config-card";
    card.innerHTML = `
      <header>
        <div>
          <h3>${PomoStore.escapeHtml(module.name)}</h3>
          <p>${PomoStore.escapeHtml(module.description)} · ${PomoStore.escapeHtml(module.ratio)} · ${module.visible ? "前台显示" : "前台隐藏"}</p>
        </div>
      </header>
      <div class="module-edit">
        <label>
          提示词
          <textarea data-field="prompt">${PomoStore.escapeHtml(module.prompt)}</textarea>
        </label>
        <label>
          输入提示项
          <input data-field="fields" value="${PomoStore.escapeHtml(module.fields.join("、"))}" />
        </label>
        <label>
          示例场景
          <input data-field="examples" value="${PomoStore.escapeHtml(module.examples.join("、"))}" />
        </label>
      </div>
      <div class="card-actions">
        <button class="mini-button ${module.visible ? "active" : ""}" type="button" data-action="toggle">${module.visible ? "隐藏" : "显示"}</button>
        <button class="mini-button" type="button" data-action="save">保存</button>
        <button class="mini-button danger" type="button" data-action="delete">删除</button>
      </div>
    `;
    card.querySelector('[data-action="toggle"]').addEventListener("click", () => {
      module.visible = !module.visible;
      PomoStore.saveState(state);
      renderAdmin();
      PomoStore.showToast(module.visible ? "模块已显示" : "模块已隐藏");
    });
    card.querySelector('[data-action="save"]').addEventListener("click", () => {
      module.prompt = card.querySelector('[data-field="prompt"]').value.trim();
      module.fields = splitList(card.querySelector('[data-field="fields"]').value) || ["主题", "核心信息", "风格要求"];
      module.examples = splitList(card.querySelector('[data-field="examples"]').value) || ["新品宣传", "节日活动", "品牌日常"];
      PomoStore.saveState(state);
      renderAdmin();
      PomoStore.showToast("模块配置已保存");
    });
    card.querySelector('[data-action="delete"]').addEventListener("click", () => deleteModule(module.id));
    dom.moduleList.appendChild(card);
  });
}

function addModel(event) {
  event.preventDefault();
  const data = new FormData(dom.modelForm);
  const model = {
    id: PomoStore.uid("model"),
    name: data.get("name").trim(),
    provider: data.get("provider").trim(),
    endpoint: data.get("endpoint").trim(),
    apiKey: data.get("apiKey").trim(),
    status: "idle",
    latency: null,
  };
  state.models.push(model);
  state.activeModelId = model.id;
  dom.modelForm.reset();
  PomoStore.saveState(state);
  renderAdmin();
  PomoStore.showToast("模型已添加");
}

function testModel(modelId) {
  const model = state.models.find((item) => item.id === modelId);
  if (!model) return;
  model.status = "testing";
  PomoStore.saveState(state);
  renderAdmin();
  window.setTimeout(() => {
    const hasRemoteConfig = model.endpoint && model.apiKey;
    model.status = "ready";
    model.latency = hasRemoteConfig ? Math.floor(260 + Math.random() * 620) : Math.floor(90 + Math.random() * 150);
    PomoStore.saveState(state);
    renderAdmin();
    PomoStore.showToast(`测试通过 · ${model.latency}ms`);
  }, 620);
}

function deleteModel(modelId) {
  if (state.models.length === 1) {
    PomoStore.showToast("至少保留一个模型");
    return;
  }
  state.models = state.models.filter((model) => model.id !== modelId);
  if (state.activeModelId === modelId) {
    state.activeModelId = state.models[0]?.id || "";
  }
  PomoStore.saveState(state);
  renderAdmin();
  PomoStore.showToast("模型已删除");
}

function addModule(event) {
  event.preventDefault();
  const data = new FormData(dom.moduleForm);
  const module = {
    id: PomoStore.uid("module"),
    name: data.get("name").trim(),
    description: data.get("description").trim(),
    ratio: data.get("ratio"),
    accent: data.get("accent"),
    visible: data.get("visible") === "on",
    prompt: data.get("prompt").trim() || "根据用户输入生成一张适合移动端传播的图片。",
    fields: splitList(data.get("fields")) || ["主题", "核心信息", "风格要求"],
    examples: splitList(data.get("examples")) || ["新品宣传", "节日活动", "品牌日常"],
  };
  state.modules.push(module);
  dom.moduleForm.reset();
  dom.moduleForm.elements.visible.checked = true;
  PomoStore.saveState(state);
  renderAdmin();
  PomoStore.showToast("模块已添加");
}

function deleteModule(moduleId) {
  state.modules = state.modules.filter((module) => module.id !== moduleId);
  PomoStore.saveState(state);
  renderAdmin();
  PomoStore.showToast("模块已删除");
}

function splitList(value) {
  const items = String(value || "")
    .split(/[、,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length ? items : null;
}

dom.modelForm.addEventListener("submit", addModel);
dom.moduleForm.addEventListener("submit", addModule);
dom.navItems.forEach((item) => {
  item.addEventListener("click", () => switchPanel(item.dataset.panel));
});
dom.resetDemoButton.addEventListener("click", () => {
  state = PomoStore.resetState();
  renderAdmin();
  PomoStore.showToast("已恢复初始数据");
});

switchPanel("overview");
renderAdmin();
