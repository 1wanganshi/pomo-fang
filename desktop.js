let state = PomoStore.loadState();
let selectedModuleId = PomoStore.getVisibleModules(state)[0]?.id || state.modules[0]?.id || "";

const desktopDom = {
  navItems: document.querySelectorAll(".unified-nav-item"),
  views: document.querySelectorAll(".desktop-view"),
  eyebrow: document.querySelector("#desktopEyebrow"),
  title: document.querySelector("#desktopTitle"),
  activeModel: document.querySelector("#desktopActiveModel"),
  moduleCount: document.querySelector("#desktopModuleCount"),
  resetButton: document.querySelector("#resetDesktopButton"),
  moduleList: document.querySelector("#desktopModuleList"),
  selectedModuleName: document.querySelector("#selectedModuleName"),
  selectedModuleRatio: document.querySelector("#selectedModuleRatio"),
  selectedModuleDescription: document.querySelector("#selectedModuleDescription"),
  selectedModuleHints: document.querySelector("#selectedModuleHints"),
  posterTool: document.querySelector("#desktopPosterTool"),
  briefLabel: document.querySelector("#desktopBriefLabel"),
  briefInput: document.querySelector("#desktopBriefInput"),
  styleRow: document.querySelector("#desktopStyleRow"),
  generationOptions: document.querySelector("#desktopGenerationOptions"),
  aspectRow: document.querySelector("#desktopAspectRow"),
  resolutionRow: document.querySelector("#desktopResolutionRow"),
  generateButton: document.querySelector("#desktopGenerateButton"),
  resultTitle: document.querySelector("#desktopResultTitle"),
  resultModelName: document.querySelector("#desktopResultModelName"),
  resultCanvas: document.querySelector("#desktopResultCanvas"),
  downloadButton: document.querySelector("#desktopDownloadButton"),
  copyPromptButton: document.querySelector("#desktopCopyPromptButton"),
  moduleForm: document.querySelector("#desktopModuleForm"),
  moduleAdminList: document.querySelector("#desktopModuleAdminList"),
  modelForm: document.querySelector("#desktopModelForm"),
  modelList: document.querySelector("#desktopModelList"),
  historyList: document.querySelector("#desktopHistoryList"),
  clearHistoryButton: document.querySelector("#clearHistoryButton"),
};

const viewLabels = {
  create: ["Create", "一处完成配置、输入和出图"],
  history: ["History", "查看和复制历史生成"],
  modules: ["Modules", "管理作图模块"],
  models: ["Models", "管理图像模型"],
};

const aspectOptions = ["1:1", "9:16", "16:9", "3:4", "4:3", "2:3", "3:2"];
const posterAspectOptions = ["1:1", "9:16", "16:9", "3:4", "4:3"];
const resolutionOptions = ["1K", "2K", "4K"];
const desktopPosterDraftKey = "pomo_fang_desktop_poster_draft_v1";
let desktopPosterDraft = PomoStore.smartPoster.defaultDraft(loadDesktopPosterDraft());
let desktopPosterView = "professional";

function renderDesktop() {
  ensureSelectedModule();
  renderDesktopStatus();
  renderCreateView();
  renderHistory();
  renderModuleAdmin();
  renderModelAdmin();
}

function ensureSelectedModule() {
  const visibleModules = PomoStore.getVisibleModules(state);
  const selected = PomoStore.getModuleById(state, selectedModuleId);
  if (selected?.visible) return;
  selectedModuleId = visibleModules[0]?.id || state.modules[0]?.id || "";
}

function renderDesktopStatus() {
  const activeModel = PomoStore.getActiveModel(state);
  const visibleModules = PomoStore.getVisibleModules(state);
  desktopDom.activeModel.textContent = activeModel ? activeModel.name : "未选择";
  desktopDom.moduleCount.textContent = `${visibleModules.length} 个模块可用`;
  desktopDom.resultModelName.textContent = activeModel ? activeModel.name : "未选择模型";
}

function renderCreateView() {
  renderModulePicker();
  renderSelectedModule();
  renderStyleButtons();
  renderGenerationOptions();
}

function renderModulePicker() {
  const visibleModules = PomoStore.getVisibleModules(state);
  desktopDom.moduleList.innerHTML = "";

  if (!visibleModules.length) {
    desktopDom.moduleList.innerHTML = `<div class="empty-state">还没有可用模块，去“模块”里打开或新增一个。</div>`;
    return;
  }

  visibleModules.forEach((module) => {
    const button = document.createElement("button");
    button.className = `desktop-module-card ${module.id === selectedModuleId ? "active" : ""}`;
    button.type = "button";
    button.style.setProperty("--accent", PomoStore.accentMap[module.accent] || PomoStore.accentMap.ink);
    button.innerHTML = `
      <strong>${PomoStore.escapeHtml(module.name)}</strong>
      <small>${PomoStore.escapeHtml(module.description)}</small>
    `;
    button.addEventListener("click", () => {
      selectedModuleId = module.id;
      renderCreateView();
    });
    desktopDom.moduleList.appendChild(button);
  });
}

function renderHistory() {
  const history = Array.isArray(state.history) ? state.history : [];
  desktopDom.historyList.innerHTML = "";

  if (!history.length) {
    desktopDom.historyList.innerHTML = `<div class="empty-state">还没有历史生成。生成一次图像后会自动记录在这里。</div>`;
    return;
  }

  history.forEach((item) => {
    const card = document.createElement("article");
    card.className = "history-card";
    card.innerHTML = `
      <div class="history-preview">
        ${item.imageData ? `<img src="${item.imageData}" alt="历史生成预览" />` : `<span>${PomoStore.escapeHtml(item.moduleName || "生成")}</span>`}
      </div>
      <div class="history-content">
        <header>
          <div>
            <h3>${PomoStore.escapeHtml(item.moduleName || "未命名生成")}</h3>
            <p>${PomoStore.escapeHtml(formatHistoryTime(item.createdAt))} · ${PomoStore.escapeHtml(item.styleName || "-")} · ${PomoStore.escapeHtml(item.ratio || "-")} · ${PomoStore.escapeHtml(item.resolution || "1K")}</p>
          </div>
        </header>
        <p class="history-brief">${PomoStore.escapeHtml(item.brief || "")}</p>
        <pre>${PomoStore.escapeHtml(item.prompt || "")}</pre>
        <div class="card-actions history-actions">
          <button class="mini-button" type="button" data-action="copy-info">复制信息</button>
          <button class="mini-button" type="button" data-action="copy-prompt">复制提示词</button>
          <button class="mini-button danger" type="button" data-action="delete">删除</button>
        </div>
      </div>
    `;

    card.querySelector('[data-action="copy-info"]').addEventListener("click", () => copyHistoryInfo(item));
    card.querySelector('[data-action="copy-prompt"]').addEventListener("click", () => copyHistoryPrompt(item));
    card.querySelector('[data-action="delete"]').addEventListener("click", () => {
      state.history = history.filter((entry) => entry.id !== item.id);
      PomoStore.saveState(state);
      renderHistory();
      PomoStore.showToast("历史已删除");
    });
    desktopDom.historyList.appendChild(card);
  });
}

function renderSelectedModule() {
  const module = PomoStore.getModuleById(state, selectedModuleId);

  if (!module) {
    desktopDom.selectedModuleName.textContent = "没有可用模块";
    desktopDom.selectedModuleRatio.textContent = "-";
    desktopDom.selectedModuleDescription.textContent = "请先在模块管理里新增一个模块。";
    desktopDom.selectedModuleHints.innerHTML = "";
    desktopDom.generateButton.disabled = true;
    PomoStore.setCanvasAspect(desktopDom.resultCanvas, "3:4");
    PomoStore.drawEmptyCanvas(desktopDom.resultCanvas, "等待模块");
    return;
  }

  desktopDom.generateButton.disabled = false;
  desktopDom.selectedModuleName.textContent = module.name;
  desktopDom.selectedModuleRatio.textContent = module.ratio;
  desktopDom.selectedModuleDescription.textContent = module.description;
  desktopDom.selectedModuleHints.innerHTML = "";
  const isPosterModule = module.id === "poster";

  [...module.fields, ...module.examples].forEach((item, index) => {
    const chip = document.createElement(index < module.fields.length ? "span" : "button");
    chip.className = index < module.fields.length ? "hint-pill" : "hint-pill hint-button";
    chip.textContent = item;
    if (chip.tagName === "BUTTON") {
      chip.type = "button";
      chip.addEventListener("click", () => {
        const prefix = desktopDom.briefInput.value.trim();
        desktopDom.briefInput.value = prefix ? `${prefix}\n${item}` : item;
        desktopDom.briefInput.focus();
      });
    }
    desktopDom.selectedModuleHints.appendChild(chip);
  });

  if (isPosterModule) {
    desktopDom.posterTool.classList.remove("hidden");
    desktopDom.briefLabel.classList.add("hidden");
    desktopDom.briefInput.classList.add("hidden");
    desktopDom.styleRow.classList.add("hidden");
    desktopDom.generationOptions.classList.add("hidden");
    desktopDom.generateButton.textContent = "生成海报";
    renderDesktopPosterTool();
  } else {
    desktopDom.posterTool.classList.add("hidden");
    desktopDom.briefLabel.classList.remove("hidden");
    desktopDom.briefInput.classList.remove("hidden");
    desktopDom.styleRow.classList.remove("hidden");
    desktopDom.generationOptions.classList.remove("hidden");
    desktopDom.generateButton.textContent = "生成图像";
  }

  if (!state.lastPrompt) {
    PomoStore.setCanvasAspect(desktopDom.resultCanvas, state.selectedAspectRatio || module.ratio);
    PomoStore.drawEmptyCanvas(desktopDom.resultCanvas, module.name);
  }
}

function renderStyleButtons() {
  desktopDom.styleRow.innerHTML = "";
  PomoStore.styles.forEach((styleName) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `style-chip ${styleName === state.selectedStyle ? "active" : ""}`;
    button.textContent = styleName;
    button.addEventListener("click", () => {
      state.selectedStyle = styleName;
      PomoStore.saveState(state);
      renderStyleButtons();
    });
    desktopDom.styleRow.appendChild(button);
  });
}

function renderDesktopPosterTool() {
  const smartPoster = PomoStore.smartPoster;
  desktopPosterDraft = smartPoster.defaultDraft(desktopPosterDraft);
  const type = smartPoster.posterTypes[desktopPosterDraft.posterType];
  if (!posterAspectOptions.includes(state.selectedAspectRatio)) state.selectedAspectRatio = type.defaultRatio;
  if (!resolutionOptions.includes(state.selectedResolution)) state.selectedResolution = "1K";
  const form = desktopPosterDraft.inputs || {};
  desktopDom.posterTool.innerHTML = `
    <div class="desktop-poster-stack">
      <section class="poster-section desktop-poster-section">
        <div class="poster-section-heading">
          <p class="eyebrow">Step 1</p>
          <h2>你想做什么海报？</h2>
        </div>
        <div class="poster-type-grid">
          ${smartPoster.posterTypeOrder
            .map((typeId) => {
              const item = smartPoster.posterTypes[typeId];
              const active = desktopPosterDraft.posterType === typeId;
              return `
                <button class="poster-type-card ${active ? "active" : ""}" type="button" data-desktop-poster-type="${typeId}">
                  <span>${PomoStore.escapeHtml(item.icon)}</span>
                  <strong>${PomoStore.escapeHtml(item.shortName)}</strong>
                </button>
              `;
            })
            .join("")}
        </div>
      </section>

      <section class="poster-section desktop-poster-section">
        <div class="poster-section-heading">
          <p class="eyebrow">Step 2</p>
          <h2>你希望它给人什么感觉？</h2>
        </div>
        ${renderDesktopPosterOptions("feeling", type.feelings, desktopPosterDraft.selectedFeeling)}
      </section>

      <section class="poster-section desktop-poster-section">
        <div class="poster-section-heading">
          <p class="eyebrow">Step 3</p>
          <h2>你最想突出什么？</h2>
        </div>
        ${renderDesktopPosterOptions("focus", type.focuses, desktopPosterDraft.selectedFocus)}
      </section>

      <section class="poster-section desktop-poster-section">
        <div class="poster-section-heading">
          <p class="eyebrow">Step 4</p>
          <h2>填写内容</h2>
        </div>
        <div class="poster-form-grid">
          ${type.fields
            .map((field) => {
              const value = form[field.id] || "";
              const control =
                field.type === "textarea"
                  ? `<textarea id="desktop-poster-${field.id}" rows="4" placeholder="${PomoStore.escapeHtml(field.placeholder || "")}">${PomoStore.escapeHtml(value)}</textarea>`
                  : `<input id="desktop-poster-${field.id}" type="text" value="${PomoStore.escapeHtml(value)}" placeholder="${PomoStore.escapeHtml(field.placeholder || "")}" />`;
              return `
                <label class="field-label">
                  ${PomoStore.escapeHtml(field.label)}
                  ${control}
                </label>
              `;
            })
            .join("")}
          <label class="field-label">
            额外要求，可不填
            <textarea id="desktop-poster-extra" rows="3" placeholder="例如：更适合朋友圈转发、不要人物、背景更明亮">${PomoStore.escapeHtml(desktopPosterDraft.optionalExtraRequirement || "")}</textarea>
          </label>
        </div>
      </section>

      <section class="poster-section desktop-poster-section">
        <div class="poster-section-heading">
          <p class="eyebrow">Step 5</p>
          <h2>尺寸和大小</h2>
        </div>
        <div class="desktop-poster-size-grid">
          <div>
            <label class="field-label">尺寸</label>
            <div class="poster-option-grid">
              ${posterAspectOptions
                .map((option) => `<button class="poster-option ${option === state.selectedAspectRatio ? "active" : ""}" type="button" data-desktop-aspect="${PomoStore.escapeHtml(option)}">${PomoStore.escapeHtml(option)}</button>`)
                .join("")}
            </div>
          </div>
          <div>
            <label class="field-label">大小</label>
            <div class="poster-option-grid">
              ${resolutionOptions
                .map((option) => `<button class="poster-option ${option === (state.selectedResolution || "1K") ? "active" : ""}" type="button" data-desktop-resolution="${PomoStore.escapeHtml(option)}">${PomoStore.escapeHtml(option)}</button>`)
                .join("")}
            </div>
          </div>
        </div>
      </section>

      <section class="poster-section desktop-poster-section prompt-section">
        <div class="poster-output-heading">
          <div>
            <p class="eyebrow">Step 6</p>
            <h2>image2 专业版提示词</h2>
          </div>
          <div class="view-toggle" role="tablist" aria-label="提示词视图">
            <button class="${desktopPosterView === "readable" ? "active" : ""}" type="button" data-desktop-prompt-view="readable">用户可读版</button>
            <button class="${desktopPosterView === "professional" ? "active" : ""}" type="button" data-desktop-prompt-view="professional">专业版</button>
          </div>
        </div>
        <div class="prompt-output desktop-poster-output" id="desktopPosterPromptOutput">${PomoStore.escapeHtml(getDesktopPosterOutputText())}</div>
      </section>
    </div>
  `;
  desktopDom.selectedModuleRatio.textContent = `${state.selectedAspectRatio || type.defaultRatio} · ${state.selectedResolution || "1K"}`;
  renderGenerationOptions();
  bindDesktopPosterTool();
}

function renderDesktopPosterOptions(kind, options, selectedValue) {
  return `
    <div class="poster-option-grid">
      ${options
        .map((option) => `<button class="poster-option ${isDesktopPosterOptionSelected(kind, selectedValue, option) ? "active" : ""}" type="button" data-desktop-${kind}="${PomoStore.escapeHtml(option)}">${PomoStore.escapeHtml(option)}</button>`)
        .join("")}
    </div>
  `;
}

function isDesktopPosterOptionSelected(kind, selectedValue, option) {
  if (kind === "feeling") {
    const values = Array.isArray(selectedValue) ? selectedValue : [selectedValue].filter(Boolean);
    return values.includes(option);
  }
  return selectedValue === option;
}

function bindDesktopPosterTool() {
  desktopDom.posterTool.querySelectorAll("[data-desktop-poster-type]").forEach((button) => {
    button.addEventListener("click", () => {
      const type = PomoStore.smartPoster.posterTypes[button.dataset.desktopPosterType];
      desktopPosterDraft = {
        posterType: button.dataset.desktopPosterType,
        selectedFeeling: [type.feelings[0]],
        selectedFocus: type.focuses[0],
        inputs: {},
        optionalExtraRequirement: "",
      };
      state.selectedAspectRatio = type.defaultRatio;
      saveDesktopPosterDraft();
      PomoStore.saveState(state);
      renderSelectedModule();
    });
  });

  desktopDom.posterTool.querySelectorAll("[data-desktop-feeling]").forEach((button) => {
    button.addEventListener("click", () => {
      const current = Array.isArray(desktopPosterDraft.selectedFeeling) ? desktopPosterDraft.selectedFeeling : [desktopPosterDraft.selectedFeeling].filter(Boolean);
      const next = current.includes(button.dataset.desktopFeeling)
        ? current.filter((item) => item !== button.dataset.desktopFeeling)
        : [...current, button.dataset.desktopFeeling];
      desktopPosterDraft.selectedFeeling = next.length ? next : [button.dataset.desktopFeeling];
      saveDesktopPosterDraft();
      renderSelectedModule();
    });
  });

  desktopDom.posterTool.querySelectorAll("[data-desktop-focus]").forEach((button) => {
    button.addEventListener("click", () => {
      desktopPosterDraft.selectedFocus = button.dataset.desktopFocus;
      saveDesktopPosterDraft();
      renderSelectedModule();
    });
  });

  desktopDom.posterTool.querySelectorAll("[data-desktop-aspect]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedAspectRatio = button.dataset.desktopAspect;
      PomoStore.saveState(state);
      renderSelectedModule();
    });
  });

  desktopDom.posterTool.querySelectorAll("[data-desktop-resolution]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedResolution = button.dataset.desktopResolution;
      PomoStore.saveState(state);
      renderSelectedModule();
    });
  });

  const type = PomoStore.smartPoster.posterTypes[desktopPosterDraft.posterType];
  type.fields.forEach((field) => {
    const input = desktopDom.posterTool.querySelector(`#desktop-poster-${field.id}`);
    if (!input) return;
    input.addEventListener("input", () => {
      desktopPosterDraft.inputs = { ...(desktopPosterDraft.inputs || {}), [field.id]: input.value.trim() };
      saveDesktopPosterDraft();
      refreshDesktopPosterPromptOutput();
    });
  });

  const extraInput = desktopDom.posterTool.querySelector("#desktop-poster-extra");
  extraInput.addEventListener("input", () => {
    desktopPosterDraft.optionalExtraRequirement = extraInput.value.trim();
    saveDesktopPosterDraft();
    refreshDesktopPosterPromptOutput();
  });

  desktopDom.posterTool.querySelectorAll("[data-desktop-prompt-view]").forEach((button) => {
    button.addEventListener("click", () => {
      desktopPosterView = button.dataset.desktopPromptView;
      renderSelectedModule();
    });
  });
}

function refreshDesktopPosterPromptOutput() {
  const output = desktopDom.posterTool.querySelector("#desktopPosterPromptOutput");
  if (output) output.textContent = getDesktopPosterOutputText();
}

function syncDesktopPosterForm() {
  const type = PomoStore.smartPoster.posterTypes[desktopPosterDraft.posterType];
  const inputs = {};
  type.fields.forEach((field) => {
    const input = desktopDom.posterTool.querySelector(`#desktop-poster-${field.id}`);
    inputs[field.id] = input?.value.trim() || "";
  });
  const extraInput = desktopDom.posterTool.querySelector("#desktop-poster-extra");
  desktopPosterDraft.inputs = inputs;
  desktopPosterDraft.optionalExtraRequirement = extraInput?.value.trim() || "";
  saveDesktopPosterDraft();
}

function buildDesktopPosterPrompt() {
  const aspectRatio = state.selectedAspectRatio || PomoStore.smartPoster.posterTypes[desktopPosterDraft.posterType].defaultRatio;
  const resolution = state.selectedResolution || "1K";
  const imageSize = sizeForGeneration(aspectRatio, resolution);
  const basePrompt = PomoStore.smartPoster.buildPrompt({
    posterType: desktopPosterDraft.posterType,
    userInputs: desktopPosterDraft.inputs,
    selectedFeeling: desktopPosterDraft.selectedFeeling,
    selectedFocus: desktopPosterDraft.selectedFocus,
    optionalExtraRequirement: desktopPosterDraft.optionalExtraRequirement,
    aspectRatio,
  });
  return [
    `画幅尺寸：${aspectRatio}。`,
    `生成大小：${resolution}，实际输出规格：${imageSize}。`,
    `请严格按照 ${aspectRatio} 的篇幅比例构图，不要裁切核心主体和文字。`,
    "",
    basePrompt,
  ].join("\n");
}

function getDesktopPosterOutputText() {
  if (desktopPosterView !== "readable") return buildDesktopPosterPrompt();
  const aspectRatio = state.selectedAspectRatio || PomoStore.smartPoster.posterTypes[desktopPosterDraft.posterType].defaultRatio;
  const resolution = state.selectedResolution || "1K";
  const imageSize = sizeForGeneration(aspectRatio, resolution);
  return [`尺寸：${aspectRatio}`, `大小：${resolution}（${imageSize}）`, "", PomoStore.smartPoster.readableSummary(desktopPosterDraft)].join("\n");
}

function loadDesktopPosterDraft() {
  try {
    return JSON.parse(localStorage.getItem(desktopPosterDraftKey)) || {};
  } catch {
    return {};
  }
}

function saveDesktopPosterDraft() {
  localStorage.setItem(desktopPosterDraftKey, JSON.stringify(desktopPosterDraft));
}

function renderGenerationOptions() {
  renderOptionButtons(desktopDom.aspectRow, aspectOptions, state.selectedAspectRatio || "3:4", (value) => {
    state.selectedAspectRatio = value;
    PomoStore.saveState(state);
    state.lastPrompt = "";
    renderSelectedModule();
    renderGenerationOptions();
  });
  renderOptionButtons(desktopDom.resolutionRow, resolutionOptions, state.selectedResolution || "1K", (value) => {
    state.selectedResolution = value;
    PomoStore.saveState(state);
    renderGenerationOptions();
  });
}

function renderOptionButtons(container, options, activeValue, onSelect) {
  if (!container) return;
  container.innerHTML = "";
  options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `option-chip ${option === activeValue ? "active" : ""}`;
    button.textContent = option;
    button.addEventListener("click", () => onSelect(option));
    container.appendChild(button);
  });
}

function renderModuleAdmin() {
  desktopDom.moduleAdminList.innerHTML = "";
  if (!state.modules.length) {
    desktopDom.moduleAdminList.innerHTML = `<div class="empty-state">还没有模块。</div>`;
    return;
  }

  state.modules.forEach((module) => {
    const card = document.createElement("article");
    card.className = "list-card module-config-card";
    card.innerHTML = `
      <header>
        <div>
          <h3>${PomoStore.escapeHtml(module.name)}</h3>
          <p>${PomoStore.escapeHtml(module.description)} · ${PomoStore.escapeHtml(module.ratio)} · ${module.visible ? "创作区显示" : "已隐藏"}</p>
        </div>
      </header>
      <div class="module-edit">
        <label>提示词<textarea data-field="prompt">${PomoStore.escapeHtml(module.prompt)}</textarea></label>
        <label>输入提示项<input data-field="fields" value="${PomoStore.escapeHtml(module.fields.join("、"))}" /></label>
        <label>示例场景<input data-field="examples" value="${PomoStore.escapeHtml(module.examples.join("、"))}" /></label>
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
      renderDesktop();
      PomoStore.showToast(module.visible ? "模块已显示" : "模块已隐藏");
    });

    card.querySelector('[data-action="save"]').addEventListener("click", () => {
      module.prompt = card.querySelector('[data-field="prompt"]').value.trim();
      module.fields = splitDesktopList(card.querySelector('[data-field="fields"]').value) || ["主题", "核心信息", "风格要求"];
      module.examples = splitDesktopList(card.querySelector('[data-field="examples"]').value) || ["新品宣传", "节日活动", "品牌日常"];
      PomoStore.saveState(state);
      renderDesktop();
      PomoStore.showToast("模块配置已保存");
    });

    card.querySelector('[data-action="delete"]').addEventListener("click", () => {
      state.modules = state.modules.filter((item) => item.id !== module.id);
      PomoStore.saveState(state);
      renderDesktop();
      PomoStore.showToast("模块已删除");
    });

    desktopDom.moduleAdminList.appendChild(card);
  });
}

function renderModelAdmin() {
  desktopDom.modelList.innerHTML = "";
  if (!state.models.length) {
    desktopDom.modelList.innerHTML = `<div class="empty-state">还没有模型。</div>`;
    return;
  }

  state.models.forEach((model) => {
    const card = document.createElement("article");
    card.className = "list-card desktop-row";
    card.innerHTML = `
      <header>
        <div>
          <h3>${PomoStore.escapeHtml(model.name)}</h3>
          <p>${PomoStore.escapeHtml(model.provider)} · ${modelStatusLabel(model)}</p>
          <p>${model.endpoint ? PomoStore.escapeHtml(`${model.modelId || "gpt-image-2"} · ${model.endpoint}`) : "本地演示"}</p>
          ${model.lastError ? `<p class="model-error">${PomoStore.escapeHtml(model.lastError)}</p>` : ""}
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
      renderDesktop();
      PomoStore.showToast("模型已启用");
    });

    card.querySelector('[data-action="test"]').addEventListener("click", () => testDesktopModel(model));

    card.querySelector('[data-action="delete"]').addEventListener("click", () => {
      if (state.models.length === 1) {
        PomoStore.showToast("至少保留一个模型");
        return;
      }
      state.models = state.models.filter((item) => item.id !== model.id);
      if (state.activeModelId === model.id) state.activeModelId = state.models[0]?.id || "";
      PomoStore.saveState(state);
      renderDesktop();
      PomoStore.showToast("模型已删除");
    });

    desktopDom.modelList.appendChild(card);
  });
}

function switchDesktopView(viewName) {
  desktopDom.navItems.forEach((item) => item.classList.toggle("active", item.dataset.view === viewName));
  desktopDom.views.forEach((view) => view.classList.toggle("active", view.dataset.view === viewName));
  desktopDom.eyebrow.textContent = viewLabels[viewName]?.[0] || "Create";
  desktopDom.title.textContent = viewLabels[viewName]?.[1] || "一处完成配置、输入和出图";
}

function modelStatusLabel(model) {
  if (model.status === "ready") return "可用";
  if (model.status === "testing") return "测试中";
  if (model.status === "error") return "测试失败";
  return "未测试";
}

function addDesktopModule(event) {
  event.preventDefault();
  const data = new FormData(desktopDom.moduleForm);
  const module = {
    id: PomoStore.uid("module"),
    name: data.get("name").trim(),
    description: data.get("description").trim(),
    ratio: data.get("ratio"),
    accent: data.get("accent"),
    visible: data.get("visible") === "on",
    prompt: data.get("prompt").trim() || "根据用户输入生成一张适合传播的图片。",
    fields: splitDesktopList(data.get("fields")) || ["主题", "核心信息", "风格要求"],
    examples: splitDesktopList(data.get("examples")) || ["新品宣传", "节日活动", "品牌日常"],
  };
  state.modules.push(module);
  selectedModuleId = module.id;
  desktopDom.moduleForm.reset();
  desktopDom.moduleForm.elements.visible.checked = true;
  PomoStore.saveState(state);
  renderDesktop();
  switchDesktopView("create");
  PomoStore.showToast("模块已添加");
}

function addDesktopModel(event) {
  event.preventDefault();
  const data = new FormData(desktopDom.modelForm);
  const model = {
    id: PomoStore.uid("model"),
    name: data.get("name").trim(),
    provider: data.get("provider").trim(),
    endpoint: data.get("endpoint").trim(),
    modelId: data.get("modelId").trim() || "gpt-image-2",
    apiKey: data.get("apiKey").trim(),
    status: "idle",
    latency: null,
  };
  state.models.push(model);
  state.activeModelId = model.id;
  desktopDom.modelForm.reset();
  PomoStore.saveState(state);
  renderDesktop();
  switchDesktopView("create");
  PomoStore.showToast("模型已添加并启用");
}

async function testDesktopModel(model) {
  if (!model.endpoint || !model.apiKey) {
    model.status = "ready";
    model.latency = Math.floor(90 + Math.random() * 120);
    PomoStore.saveState(state);
    renderDesktop();
    PomoStore.showToast("本地演示模型可用；填写 API 后可真实测试");
    return;
  }

  if (!window.pomoDesktop?.testImageModel) {
    PomoStore.showToast("请在桌面应用中测试真实模型");
    return;
  }

  model.status = "testing";
  PomoStore.saveState(state);
  renderDesktop();
  PomoStore.showToast("正在请求真实模型...");
  try {
    const result = await window.pomoDesktop.testImageModel(safeModelForRequest(model));
    model.status = "ready";
    model.latency = result.latency;
    PomoStore.saveState(state);
    renderDesktop();
    PomoStore.showToast(`真实测试通过 · ${model.latency}ms`);
  } catch (error) {
    model.status = "error";
    model.lastError = error.message || "测试失败";
    PomoStore.saveState(state);
    renderDesktop();
    PomoStore.showToast(model.lastError);
  }
}

async function generateDesktopImage() {
  const module = PomoStore.getModuleById(state, selectedModuleId);
  const model = PomoStore.getActiveModel(state);

  if (!module) {
    PomoStore.showToast("请先添加一个模块");
    return;
  }
  if (!model) {
    PomoStore.showToast("请先添加一个模型");
    return;
  }
  const isPosterModule = module.id === "poster";
  if (isPosterModule) {
    syncDesktopPosterForm();
  }
  const brief = isPosterModule ? summarizeDesktopPosterBrief() : desktopDom.briefInput.value.trim();
  if (!isPosterModule && !brief) {
    PomoStore.showToast("先输入内容");
    desktopDom.briefInput.focus();
    return;
  }

  const aspectRatio = state.selectedAspectRatio || module.ratio || "3:4";
  const resolution = state.selectedResolution || "1K";
  const imageSize = sizeForGeneration(aspectRatio, resolution);
  const imageQuality = qualityForGeneration(resolution);
  const prompt = isPosterModule
    ? buildDesktopPosterPrompt()
    : [
        `模块：${module.name}`,
        `风格：${state.selectedStyle}`,
        `画幅：${aspectRatio}`,
        `清晰度：${resolution}`,
        `输出规格：${imageSize}`,
        `模块提示词：${module.prompt}`,
        `用户内容：${brief}`,
      ].join("\n");

  desktopDom.generateButton.disabled = true;
  desktopDom.generateButton.textContent = model.endpoint && model.apiKey ? "真实生成中..." : "生成中...";
  try {
    state.lastPrompt = prompt;
    if (model.endpoint && model.apiKey) {
      if (!window.pomoDesktop?.generateImage) throw new Error("请在桌面应用中使用真实生图");
      const result = await window.pomoDesktop.generateImage({
        model: safeModelForRequest(model),
        prompt,
        size: imageSize,
        quality: imageQuality,
      });
      await drawImageDataToCanvas(desktopDom.resultCanvas, result.imageData);
    } else {
      const previewModule = { ...module, ratio: aspectRatio };
      PomoStore.drawResultCanvas({
        canvas: desktopDom.resultCanvas,
        module: previewModule,
        model,
        brief: isPosterModule ? prompt : brief,
        styleName: isPosterModule ? "智能海报" : state.selectedStyle,
      });
    }
    addHistoryItem({ module, model, brief, prompt, aspectRatio, resolution, imageSize });
    PomoStore.saveState(state);
    renderHistory();
    desktopDom.resultTitle.textContent = `${module.name} · 已生成`;
    desktopDom.resultModelName.textContent = model.name;
    PomoStore.showToast(model.endpoint && model.apiKey ? "真实图像已生成" : "本地图像已生成");
  } catch (error) {
    PomoStore.showToast(error.message || "生成失败");
  } finally {
    desktopDom.generateButton.disabled = false;
    desktopDom.generateButton.textContent = isPosterModule ? "生成海报" : "生成图像";
  }
}

function summarizeDesktopPosterBrief() {
  const type = PomoStore.smartPoster.posterTypes[desktopPosterDraft.posterType];
  const values = type.fields
    .map((field) => desktopPosterDraft.inputs?.[field.id])
    .filter(Boolean);
  return values.join(" / ") || type.name;
}

function safeModelForRequest(model) {
  return {
    name: model.name,
    provider: model.provider,
    endpoint: model.endpoint,
    apiKey: model.apiKey,
    modelId: model.modelId || "gpt-image-2",
  };
}

function drawImageDataToCanvas(canvas, imageData) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      canvas.width = image.naturalWidth || image.width;
      canvas.height = image.naturalHeight || image.height;
      canvas.style.aspectRatio = `${canvas.width} / ${canvas.height}`;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve();
    };
    image.onerror = () => reject(new Error("生成图片加载失败"));
    image.src = imageData;
  });
}

function sizeForGeneration(aspectRatio, resolution) {
  const sizes = {
    "1K": {
      "1:1": "1024x1024",
      "9:16": "1024x1792",
      "16:9": "1792x1024",
      "3:4": "1024x1360",
      "4:3": "1360x1024",
      "2:3": "1024x1536",
      "3:2": "1536x1024",
    },
    "2K": {
      "1:1": "2048x2048",
      "9:16": "1152x2048",
      "16:9": "2048x1152",
      "3:4": "1536x2048",
      "4:3": "2048x1536",
      "2:3": "1360x2048",
      "3:2": "2048x1360",
    },
    "4K": {
      "1:1": "2048x2048",
      "9:16": "2160x3840",
      "16:9": "3840x2160",
      "3:4": "2160x2880",
      "4:3": "2880x2160",
      "2:3": "2160x3232",
      "3:2": "3232x2160",
    },
  };
  return sizes[resolution]?.[aspectRatio] || sizes["1K"]["3:4"];
}

function qualityForGeneration(resolution) {
  if (resolution === "4K") return "high";
  if (resolution === "2K") return "medium";
  return "low";
}

function addHistoryItem({ module, model, brief, prompt, aspectRatio, resolution, imageSize }) {
  const imageData = desktopDom.resultCanvas.toDataURL("image/png");
  const entry = {
    id: PomoStore.uid("history"),
    createdAt: new Date().toISOString(),
    moduleName: module.name,
    modelName: model.name,
    styleName: state.selectedStyle,
    ratio: aspectRatio || module.ratio,
    resolution: resolution || state.selectedResolution || "1K",
    imageSize: imageSize || "",
    brief,
    prompt,
    imageData,
  };
  state.history = [entry, ...(Array.isArray(state.history) ? state.history : [])].slice(0, 60);
}

function downloadDesktopCanvas() {
  const module = PomoStore.getModuleById(state, selectedModuleId);
  const link = document.createElement("a");
  link.download = `泼墨坊-${module?.name || "作图"}-${Date.now()}.png`;
  link.href = desktopDom.resultCanvas.toDataURL("image/png");
  link.click();
}

async function copyDesktopPrompt() {
  const module = PomoStore.getModuleById(state, selectedModuleId);
  if (module?.id === "poster") {
    try {
      syncDesktopPosterForm();
      const prompt = buildDesktopPosterPrompt();
      state.lastPrompt = prompt;
      PomoStore.saveState(state);
      refreshDesktopPosterPromptOutput();
      await PomoStore.copyText(prompt);
      PomoStore.showToast("智能海报提示词已复制");
    } catch {
      PomoStore.showToast("复制失败");
    }
    return;
  }
  if (!state.lastPrompt) {
    PomoStore.showToast("还没有提示词");
    return;
  }
  try {
    await PomoStore.copyText(state.lastPrompt);
    PomoStore.showToast("提示词已复制");
  } catch {
    PomoStore.showToast("复制失败");
  }
}

async function copyHistoryInfo(item) {
  const text = [
    `生成时间：${formatHistoryTime(item.createdAt)}`,
    `模块：${item.moduleName || "-"}`,
    `模型：${item.modelName || "-"}`,
    `风格：${item.styleName || "-"}`,
    `画幅：${item.ratio || "-"}`,
    `清晰度：${item.resolution || "-"}`,
    `输出规格：${item.imageSize || "-"}`,
    `内容：${item.brief || "-"}`,
    "",
    "提示词：",
    item.prompt || "",
  ].join("\n");
  try {
    await PomoStore.copyText(text);
    PomoStore.showToast("历史信息已复制");
  } catch {
    PomoStore.showToast("复制失败");
  }
}

async function copyHistoryPrompt(item) {
  try {
    await PomoStore.copyText(item.prompt || "");
    PomoStore.showToast("提示词已复制");
  } catch {
    PomoStore.showToast("复制失败");
  }
}

function formatHistoryTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function splitDesktopList(value) {
  const items = String(value || "")
    .split(/[、，,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length ? items : null;
}

desktopDom.navItems.forEach((item) => {
  item.addEventListener("click", () => switchDesktopView(item.dataset.view));
});
desktopDom.resetButton.addEventListener("click", () => {
  state = PomoStore.resetState();
  selectedModuleId = PomoStore.getVisibleModules(state)[0]?.id || "";
  desktopDom.briefInput.value = "";
  renderDesktop();
  PomoStore.showToast("已恢复初始数据");
});
desktopDom.clearHistoryButton.addEventListener("click", () => {
  state.history = [];
  PomoStore.saveState(state);
  renderHistory();
  PomoStore.showToast("历史已清空");
});
desktopDom.moduleForm.addEventListener("submit", addDesktopModule);
desktopDom.modelForm.addEventListener("submit", addDesktopModel);
desktopDom.generateButton.addEventListener("click", generateDesktopImage);
desktopDom.downloadButton.addEventListener("click", downloadDesktopCanvas);
desktopDom.copyPromptButton.addEventListener("click", copyDesktopPrompt);

switchDesktopView("create");
renderDesktop();
