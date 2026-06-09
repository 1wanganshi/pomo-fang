let state = PomoStore.loadState();

const query = new URLSearchParams(window.location.search);
const moduleId = query.get("id");

const dom = {
  moduleName: document.querySelector("#moduleName"),
  moduleDescription: document.querySelector("#moduleDescription"),
  moduleRatio: document.querySelector("#moduleRatio"),
  moduleFields: document.querySelector("#moduleFields"),
  posterWizard: document.querySelector("#posterWizard"),
  quickFlow: document.querySelector(".quick-flow"),
  briefInput: document.querySelector("#briefInput"),
  styleRow: document.querySelector("#styleRow"),
  generateButton: document.querySelector("#generateButton"),
  resultPanel: document.querySelector("#resultPanel"),
  resultCanvas: document.querySelector("#resultCanvas"),
  resultTitle: document.querySelector("#resultTitle"),
  resultModelName: document.querySelector("#resultModelName"),
  downloadButton: document.querySelector("#downloadButton"),
  copyPromptButton: document.querySelector("#copyPromptButton"),
};

let currentModule = PomoStore.getModuleById(state, moduleId);

const posterDraftKey = "pomo_fang_poster_wizard_draft_v1";

const posterTypeOrder = ["xiaohongshuCover", "productPoster", "coursePoster", "eventPoster", "foodPoster"];

const feelingMap = {
  高级: ["高级商业摄影", "杂志级成片", "奢华但克制", "精致排版", "真实材质", "柔和主光", "细腻高光", "editorial finish", "premium commercial photography"],
  清爽: ["明亮干净", "奶油白背景", "浅绿色点缀", "自然晨光", "留白充足", "清新生活方式", "soft natural light", "clean composition"],
  可爱: ["柔和圆润的视觉语言", "明快配色", "亲切活泼", "轻量插画点缀", "friendly visual tone", "playful but clean composition"],
  干货感: ["信息层级明确", "知识卡片式排版", "重点数字醒目", "适合收藏转发", "clear editorial layout", "structured information design"],
  强吸引力: ["高对比标题区", "第一眼抓住注意力", "强信息流点击感", "醒目视觉钩子", "scroll-stopping cover design"],
  强促销: ["价格醒目", "促销层级清晰", "高对比价格模块", "CTA 明确", "适合快速识别", "strong promotional hierarchy"],
  奢华: ["高端奢华质感", "深浅对比克制", "金属或玻璃细节", "精致高光", "luxury commercial finish"],
  科技感: ["深色科技背景", "玻璃拟态", "全息光效", "青蓝色强调光", "精密网格", "数据可视化元素", "clean futuristic interface", "holographic glow"],
  专业: ["专业可信", "秩序感强", "清晰信息分区", "克制配色", "business editorial layout", "credible professional design"],
  亲和: ["温暖自然", "亲切可信", "柔和色彩", "生活化场景", "approachable friendly tone"],
  紧迫感: ["限时提醒醒目", "行动按钮突出", "节奏紧凑但不拥挤", "clear urgency hierarchy"],
  热闹: ["现场氛围强", "色彩更有活力", "动态元素丰富", "传播感强", "energetic event poster"],
  年轻: ["年轻活力", "节奏轻快", "潮流社媒视觉", "鲜明但不刺眼的配色", "modern youth-oriented design"],
  正式: ["正式稳重", "主办级视觉", "秩序清晰", "信息可信", "formal event key visual"],
  电影感: ["电影感打光", "低饱和色彩", "真实景深", "空气透视", "细微颗粒", "故事感", "cinematic lighting", "cinematic still"],
  诱人: ["商业美食摄影", "食材质感真实", "色泽自然诱人", "水汽和冷凝细节", "appetizing food photography"],
  烟火气: ["生活化餐饮氛围", "温暖光线", "真实餐桌细节", "亲切有食欲", "authentic local food atmosphere"],
  夏日感: ["明亮夏日光线", "清凉配色", "冰感细节", "清爽留白", "fresh summer lifestyle"],
};

const focusRules = {
  标题: ["主标题最大，顶部醒目位置，字体清晰可读，适合手机信息流快速吸引注意。"],
  大标题: ["主标题最大，顶部醒目位置，字体清晰可读，适合手机信息流快速吸引注意。"],
  产品: ["产品主体占据画面核心位置，主体最大，细节清晰，背景辅助不要抢主体。"],
  价格: ["价格信息需要醒目，价格模块要有高对比度，用户第一眼能看到价格。"],
  活动信息: ["活动信息分区清楚，时间、地点和参与方式必须快速可读。"],
  人物: ["人物自然可信，表情和动作服务主题，人物不要遮挡核心文字。"],
  品牌: ["品牌气质明确，品牌信息克制但可识别，不生成假 logo。"],
  卖点: ["卖点模块清晰，信息短句化，用户能快速理解为什么值得点进来。"],
  氛围: ["主视觉有记忆点，背景有氛围细节但不杂乱，整体传播感强。"],
  数字: ["数字信息放大并形成视觉钩子，适合快速扫读。"],
  对比效果: ["对比关系清楚，前后差异或左右对照一眼可懂。"],
  课程名: ["课程名称最大，信息从课程名开始阅读，整体可信专业。"],
  适合人群: ["适合人群明确醒目，让目标用户第一眼知道这是不是给自己的。"],
  课程亮点: ["课程亮点以 3 个清晰卡片展示，短句可读，层级明确。"],
  报名按钮: ["报名按钮或报名方式醒目，CTA 清楚，适合立即行动。"],
  活动名称: ["活动名称醒目，作为画面第一视觉信息。"],
  时间地点: ["时间地点清楚可读，放在稳定信息区，不被背景遮挡。"],
  嘉宾或亮点: ["嘉宾或活动亮点突出展示，形成传播记忆点。"],
  食物本身: ["食物主体最大且最诱人，真实食材质感清晰，背景干净。"],
  新品: ["新品信息醒目，产品新鲜感强，搭配清楚的上市或尝鲜提示。"],
  店铺名: ["店铺名清晰可读，放在不抢主体但容易识别的位置。"],
};

const commonTextRules = [
  "所有中文必须清晰、端正、可读",
  "不要乱码",
  "不要错别字",
  "不要拼音",
  "不要额外生成英文",
  "不要假中文",
  "不要生成用户没有提供的额外文字",
];

const commonQualityBoosters = [
  "画面要主体突出",
  "视觉中心明确",
  "层次分明",
  "真实材质",
  "自然光影",
  "丰富但不杂乱的细节",
  "具有商业海报完成度",
];

const commonAvoid = [
  "避免乱码",
  "错别字",
  "假品牌 logo",
  "廉价模板感",
  "塑料 CGI",
  "杂乱背景",
  "过多小字",
  "不可读微文字",
  "随机英文",
  "假中文",
  "透视错误",
  "主体变形",
];

const posterTypes = {
  xiaohongshuCover: {
    name: "小红书封面",
    shortName: "小红书封面",
    icon: "书",
    defaultRatio: "3:4",
    themeField: "topic",
    feelings: ["清爽", "高级", "可爱", "干货感", "强吸引力"],
    focuses: ["标题", "人物", "产品", "数字", "对比效果"],
    fields: [
      { id: "topic", label: "这篇内容讲什么？", type: "textarea", placeholder: "例如：夏天必喝的 3 款冷泡茶" },
      { id: "title", label: "主标题", type: "text", placeholder: "例如：夏日冷泡茶" },
      { id: "subtitle", label: "副标题，可不填", type: "text", placeholder: "例如：清爽一整天" },
    ],
    textLabels: { title: "主标题", subtitle: "副标题" },
    backendPromptRules: {
      layout: ["3:4 竖版封面", "适合手机信息流快速吸引注意", "大标题置顶", "主体居中", "背景干净", "信息不拥挤"],
      textRules: ["主标题必须最大", "中文文字必须清晰可读", "不要乱码", "不要错别字", "不要拼音", "不要随机英文"],
      qualityBoosters: ["明亮干净", "清晰视觉中心", "强信息流吸引力", "留白充足", "精致排版"],
      avoid: ["避免乱码", "避免不可读小字", "避免杂乱背景", "避免廉价模板感"],
    },
  },
  productPoster: {
    name: "产品卖货海报",
    shortName: "产品卖货",
    icon: "购",
    defaultRatio: "2:3",
    themeField: "productName",
    feelings: ["高级", "清爽", "强促销", "奢华", "科技感"],
    focuses: ["产品", "价格", "卖点", "品牌"],
    fields: [
      { id: "productName", label: "卖什么产品？", type: "text", placeholder: "例如：夏日冷泡茶" },
      { id: "sellingPoint", label: "产品最大卖点是什么？", type: "textarea", placeholder: "例如：0 糖、真实茶香、清爽解腻" },
      { id: "price", label: "价格，可不填", type: "text", placeholder: "例如：中杯 16 元" },
      { id: "campaign", label: "活动信息，可不填", type: "text", placeholder: "例如：第二杯半价" },
      { id: "cta", label: "按钮文字", type: "text", placeholder: "例如：立即购买" },
    ],
    textLabels: { productName: "产品名称", sellingPoint: "卖点", price: "价格", campaign: "活动信息", cta: "CTA" },
    backendPromptRules: {
      layout: ["产品主体最大", "商业摄影质感", "主体位于视觉中心", "价格醒目", "卖点模块清晰", "CTA 明确"],
      textRules: ["价格和卖点必须清楚", "按钮文字短而醒目", "中文必须准确可读"],
      qualityBoosters: ["真实材质", "柔和主光", "真实阴影", "微观纹理可见", "反光自然", "编辑级完成度"],
      avoid: ["避免廉价电商风", "避免塑料 CGI", "避免假品牌 logo", "避免过度促销堆字", "避免主体变形"],
    },
  },
  coursePoster: {
    name: "课程招生海报",
    shortName: "课程招生",
    icon: "课",
    defaultRatio: "3:4",
    themeField: "courseName",
    feelings: ["专业", "高级", "亲和", "干货感", "紧迫感"],
    focuses: ["课程名", "适合人群", "课程亮点", "报名按钮"],
    fields: [
      { id: "courseName", label: "课程名称", type: "text", placeholder: "例如：AI 海报实战课" },
      { id: "audience", label: "适合什么人", type: "textarea", placeholder: "例如：小商家、自媒体博主、课程老师" },
      { id: "highlights", label: "3 个课程亮点", type: "textarea", placeholder: "例如：快速出图、商业排版、中文提示词模板" },
      { id: "time", label: "时间，可不填", type: "text", placeholder: "例如：6 月 18 日 20:00" },
      { id: "signup", label: "报名方式或按钮文字", type: "text", placeholder: "例如：立即报名" },
    ],
    textLabels: { courseName: "课程名称", audience: "适合人群", highlights: "课程亮点", time: "时间", signup: "报名方式" },
    backendPromptRules: {
      layout: ["课程名称最大", "信息模块分区清晰", "适合人群明确", "课程亮点以 3 个卡片展示", "CTA 明确"],
      textRules: ["阅读顺序清楚", "适合手机阅读", "中文文字必须清晰可读"],
      qualityBoosters: ["整体专业可信", "排版干净", "层级清晰", "留白适中"],
      avoid: ["避免文字太小", "避免信息拥挤", "避免廉价培训广告感", "避免过多装饰元素"],
    },
  },
  eventPoster: {
    name: "活动宣传海报",
    shortName: "活动宣传",
    icon: "场",
    defaultRatio: "3:4",
    themeField: "eventName",
    feelings: ["热闹", "高级", "年轻", "正式", "电影感"],
    focuses: ["活动名称", "时间地点", "氛围", "嘉宾或亮点"],
    fields: [
      { id: "eventName", label: "活动名称", type: "text", placeholder: "例如：夏日品牌开放日" },
      { id: "theme", label: "活动主题", type: "textarea", placeholder: "例如：新品体验、主理人分享、现场互动" },
      { id: "time", label: "活动时间", type: "text", placeholder: "例如：6 月 22 日 14:00" },
      { id: "location", label: "活动地点，可选", type: "text", placeholder: "例如：杭州湖滨银泰" },
      { id: "highlights", label: "活动亮点", type: "textarea", placeholder: "例如：限定礼品、现场抽奖、嘉宾分享" },
      { id: "cta", label: "按钮文字", type: "text", placeholder: "例如：立即报名" },
    ],
    textLabels: { eventName: "活动名称", theme: "活动主题", time: "活动时间", location: "活动地点", highlights: "活动亮点", cta: "CTA" },
    backendPromptRules: {
      layout: ["活动名称醒目", "时间地点清楚", "现场氛围强", "视觉冲击力强", "信息层级清晰"],
      textRules: ["时间地点必须可读", "活动信息不要被遮挡", "中文文字必须准确"],
      qualityBoosters: ["适合宣传传播", "主视觉有记忆点", "背景有氛围细节但不杂乱"],
      avoid: ["避免假 sponsor logo", "避免时间地点不可读", "避免背景过乱", "避免活动信息被遮挡"],
    },
  },
  foodPoster: {
    name: "餐饮菜单 / 新品海报",
    shortName: "餐饮新品",
    icon: "味",
    defaultRatio: "3:4",
    themeField: "itemName",
    feelings: ["清爽", "诱人", "高级", "烟火气", "夏日感"],
    focuses: ["食物本身", "价格", "新品", "店铺名"],
    fields: [
      { id: "shopName", label: "店铺名，可选", type: "text", placeholder: "例如：泼墨茶馆" },
      { id: "itemName", label: "菜品或饮品名称", type: "text", placeholder: "例如：青提茉莉冰茶" },
      { id: "flavor", label: "口味特点", type: "textarea", placeholder: "例如：清甜、茶香足、冰爽不腻" },
      { id: "price", label: "价格，可选", type: "text", placeholder: "例如：18 元" },
      { id: "promo", label: "促销信息，可选", type: "text", placeholder: "例如：新品第二杯半价" },
      { id: "cta", label: "按钮文字", type: "text", placeholder: "例如：到店尝鲜" },
    ],
    textLabels: { shopName: "店铺名", itemName: "菜品名称", flavor: "口味特点", price: "价格", promo: "促销信息", cta: "CTA" },
    backendPromptRules: {
      layout: ["食物主体诱人", "主体清晰", "背景干净", "价格和新品信息醒目", "画面让人有食欲"],
      textRules: ["价格必须清楚可读", "新品信息醒目", "中文文字不要出错"],
      qualityBoosters: ["真实食材质感", "水汽或冷凝细节", "色泽自然", "商业美食摄影"],
      avoid: ["避免假食物质感", "避免塑料感", "避免脏乱背景", "避免价格不可读", "避免过度油腻"],
    },
  },
};

const posterWizard = {
  draft: normalizePosterDraft(loadPosterDraft()),
  promptView: "professional",
};

function initModulePage() {
  if (!currentModule || !currentModule.visible) {
    renderMissingModule();
    return;
  }

  document.title = `${currentModule.name} - 泼墨坊`;
  dom.moduleName.textContent = currentModule.name;
  dom.moduleDescription.textContent = currentModule.description;
  dom.moduleRatio.textContent = currentModule.ratio;
  dom.resultTitle.textContent = "等待生成";
  dom.resultModelName.textContent = PomoStore.getActiveModel(state)?.name || "未选择模型";
  PomoStore.setCanvasAspect(dom.resultCanvas, currentModule.ratio);
  PomoStore.drawEmptyCanvas(dom.resultCanvas, currentModule.name);

  if (currentModule.id === "poster") {
    initPosterWizard();
    return;
  }

  renderFieldHints();
  renderStyleChips();
}

function renderMissingModule() {
  dom.moduleName.textContent = "模块不可用";
  dom.moduleDescription.textContent = "这个模块已被后台隐藏或删除。";
  dom.moduleRatio.textContent = "-";
  dom.moduleFields.innerHTML = `<div class="empty-state">回到首页选择其他模块</div>`;
  dom.quickFlow.classList.remove("hidden");
  dom.posterWizard.classList.add("hidden");
  dom.briefInput.disabled = true;
  dom.generateButton.disabled = true;
  dom.resultModelName.textContent = "未选择模型";
  PomoStore.setCanvasAspect(dom.resultCanvas, "3:4");
  PomoStore.drawEmptyCanvas(dom.resultCanvas, "模块不可用");
}

function renderFieldHints() {
  dom.moduleFields.innerHTML = "";
  currentModule.fields.forEach((field) => {
    const item = document.createElement("span");
    item.className = "hint-pill";
    item.textContent = field;
    dom.moduleFields.appendChild(item);
  });

  currentModule.examples.forEach((example) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "hint-pill hint-button";
    button.textContent = example;
    button.addEventListener("click", () => {
      const prefix = dom.briefInput.value.trim();
      dom.briefInput.value = prefix ? `${prefix}\n${example}` : example;
      dom.briefInput.focus();
    });
    dom.moduleFields.appendChild(button);
  });
}

function renderStyleChips() {
  dom.styleRow.innerHTML = "";
  PomoStore.styles.forEach((styleName) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = `style-chip ${styleName === state.selectedStyle ? "active" : ""}`;
    chip.textContent = styleName;
    chip.addEventListener("click", () => {
      state.selectedStyle = styleName;
      PomoStore.saveState(state);
      renderStyleChips();
    });
    dom.styleRow.appendChild(chip);
  });
}

function loadPosterDraft() {
  try {
    return JSON.parse(localStorage.getItem(posterDraftKey)) || {};
  } catch {
    return {};
  }
}

function savePosterDraft() {
  localStorage.setItem(posterDraftKey, JSON.stringify(posterWizard.draft));
}

function initPosterWizard() {
  dom.quickFlow.classList.add("hidden");
  dom.resultPanel.classList.add("hidden");
  dom.posterWizard.classList.remove("hidden");
  dom.moduleRatio.textContent = getActivePosterType().defaultRatio;
  dom.moduleFields.innerHTML = `
    <span class="hint-pill">5 类海报</span>
    <span class="hint-pill">普通话选择</span>
    <span class="hint-pill">image2 提示词</span>
  `;
  renderPosterGenerator();
}

function renderPosterGenerator() {
  const type = getActivePosterType();
  const form = posterWizard.draft.inputs || {};
  dom.moduleRatio.textContent = type.defaultRatio;
  dom.posterWizard.innerHTML = `
    <div class="poster-generator">
      <section class="poster-section">
        <div class="poster-section-heading">
          <p class="eyebrow">Step 1</p>
          <h2>你想做什么海报？</h2>
        </div>
        <div class="poster-type-grid">
          ${posterTypeOrder
            .map((typeId) => {
              const item = posterTypes[typeId];
              const active = posterWizard.draft.posterType === typeId;
              return `
                <button class="poster-type-card ${active ? "active" : ""}" type="button" data-poster-type="${typeId}">
                  <span>${PomoStore.escapeHtml(item.icon)}</span>
                  <strong>${PomoStore.escapeHtml(item.shortName)}</strong>
                </button>
              `;
            })
            .join("")}
        </div>
      </section>

      <section class="poster-section">
        <div class="poster-section-heading">
          <p class="eyebrow">Step 2</p>
          <h2>你希望它给人什么感觉？</h2>
        </div>
        ${renderPosterOptions("feeling", type.feelings, posterWizard.draft.selectedFeeling)}
      </section>

      <section class="poster-section">
        <div class="poster-section-heading">
          <p class="eyebrow">Step 3</p>
          <h2>你最想突出什么？</h2>
        </div>
        ${renderPosterOptions("focus", type.focuses, posterWizard.draft.selectedFocus)}
      </section>

      <section class="poster-section">
        <div class="poster-section-heading">
          <p class="eyebrow">Step 4</p>
          <h2>填写内容</h2>
        </div>
        <div class="poster-form-grid">
          ${type.fields
            .map((field) => {
              const value = form[field.id] || "";
              const input =
                field.type === "textarea"
                  ? `<textarea id="poster-${field.id}" rows="4" placeholder="${PomoStore.escapeHtml(field.placeholder || "")}">${PomoStore.escapeHtml(value)}</textarea>`
                  : `<input id="poster-${field.id}" type="text" value="${PomoStore.escapeHtml(value)}" placeholder="${PomoStore.escapeHtml(field.placeholder || "")}" />`;
              return `
                <label class="field-label">
                  ${PomoStore.escapeHtml(field.label)}
                  ${input}
                </label>
              `;
            })
            .join("")}
          <label class="field-label">
            额外要求，可不填
            <textarea id="poster-extra" rows="3" placeholder="例如：更适合朋友圈转发、不要人物、背景更明亮">${PomoStore.escapeHtml(posterWizard.draft.optionalExtraRequirement || "")}</textarea>
          </label>
        </div>
      </section>

      <section class="poster-section">
        <div class="poster-section-heading">
          <p class="eyebrow">Step 5</p>
          <h2>生成</h2>
        </div>
        <div class="poster-action-row">
          <button class="primary-button" id="buildPosterPromptButton" type="button">生成提示词</button>
          <button class="secondary-button" id="copyPosterPromptButton" type="button">复制提示词</button>
          <button class="secondary-button" id="reservePosterImageButton" type="button">生成海报</button>
          <button class="secondary-button" id="resetPosterButton" type="button">重新填写</button>
        </div>
      </section>

      <section class="poster-section prompt-section">
        <div class="poster-output-heading">
          <div>
            <p class="eyebrow">输出</p>
            <h2>image2 专业版提示词</h2>
          </div>
          <div class="view-toggle" role="tablist" aria-label="提示词视图">
            <button class="${posterWizard.promptView === "readable" ? "active" : ""}" type="button" data-prompt-view="readable">用户可读版</button>
            <button class="${posterWizard.promptView === "professional" ? "active" : ""}" type="button" data-prompt-view="professional">专业版</button>
          </div>
        </div>
        <div class="prompt-output" id="posterPromptOutput">${PomoStore.escapeHtml(getPosterOutputText())}</div>
      </section>
    </div>
  `;
  bindPosterGenerator();
}

function renderPosterOptions(kind, options, selectedValue) {
  return `
    <div class="poster-option-grid">
      ${options
        .map((option) => `<button class="poster-option ${isPosterOptionSelected(kind, selectedValue, option) ? "active" : ""}" type="button" data-${kind}="${PomoStore.escapeHtml(option)}">${PomoStore.escapeHtml(option)}</button>`)
        .join("")}
    </div>
  `;
}

function isPosterOptionSelected(kind, selectedValue, option) {
  if (kind === "feeling") {
    const values = Array.isArray(selectedValue) ? selectedValue : [selectedValue].filter(Boolean);
    return values.includes(option);
  }
  return selectedValue === option;
}

function bindPosterGenerator() {
  dom.posterWizard.querySelectorAll("[data-poster-type]").forEach((button) => {
    button.addEventListener("click", () => {
      setPosterType(button.dataset.posterType);
      renderPosterGenerator();
    });
  });

  dom.posterWizard.querySelectorAll("[data-feeling]").forEach((button) => {
    button.addEventListener("click", () => {
      const current = Array.isArray(posterWizard.draft.selectedFeeling) ? posterWizard.draft.selectedFeeling : [posterWizard.draft.selectedFeeling].filter(Boolean);
      const next = current.includes(button.dataset.feeling)
        ? current.filter((item) => item !== button.dataset.feeling)
        : [...current, button.dataset.feeling];
      posterWizard.draft.selectedFeeling = next.length ? next : [button.dataset.feeling];
      savePosterDraft();
      renderPosterGenerator();
    });
  });

  dom.posterWizard.querySelectorAll("[data-focus]").forEach((button) => {
    button.addEventListener("click", () => {
      posterWizard.draft.selectedFocus = button.dataset.focus;
      savePosterDraft();
      renderPosterGenerator();
    });
  });

  getActivePosterType().fields.forEach((field) => {
    const input = dom.posterWizard.querySelector(`#poster-${field.id}`);
    if (!input) return;
    input.addEventListener("input", () => {
      posterWizard.draft.inputs = { ...(posterWizard.draft.inputs || {}), [field.id]: input.value.trim() };
      savePosterDraft();
    });
  });

  const extraInput = dom.posterWizard.querySelector("#poster-extra");
  extraInput.addEventListener("input", () => {
    posterWizard.draft.optionalExtraRequirement = extraInput.value.trim();
    savePosterDraft();
  });

  dom.posterWizard.querySelector("#buildPosterPromptButton").addEventListener("click", () => {
    syncPosterForm();
    const prompt = buildPosterPrompt();
    state.lastPrompt = prompt;
    PomoStore.saveState(state);
    dom.posterWizard.querySelector("#posterPromptOutput").textContent = getPosterOutputText();
    PomoStore.showToast("提示词已生成");
  });

  dom.posterWizard.querySelector("#copyPosterPromptButton").addEventListener("click", copyPosterPrompt);
  dom.posterWizard.querySelector("#reservePosterImageButton").addEventListener("click", generatePosterFromPrompt);
  dom.posterWizard.querySelector("#resetPosterButton").addEventListener("click", resetPosterDraft);

  dom.posterWizard.querySelectorAll("[data-prompt-view]").forEach((button) => {
    button.addEventListener("click", () => {
      posterWizard.promptView = button.dataset.promptView;
      renderPosterGenerator();
    });
  });
}

function setPosterType(typeId) {
  const nextTypeId = posterTypes[typeId] ? typeId : posterTypeOrder[0];
  const type = posterTypes[nextTypeId];
  posterWizard.draft = {
    posterType: nextTypeId,
    selectedFeeling: [type.feelings[0]],
    selectedFocus: type.focuses[0],
    inputs: {},
    optionalExtraRequirement: "",
  };
  savePosterDraft();
}

function resetPosterDraft() {
  setPosterType(posterWizard.draft.posterType || posterTypeOrder[0]);
  renderPosterGenerator();
  PomoStore.showToast("已重新填写");
}

function syncPosterForm() {
  const type = getActivePosterType();
  const inputs = {};
  type.fields.forEach((field) => {
    const input = dom.posterWizard.querySelector(`#poster-${field.id}`);
    inputs[field.id] = input?.value.trim() || "";
  });
  const extraInput = dom.posterWizard.querySelector("#poster-extra");
  posterWizard.draft.inputs = inputs;
  posterWizard.draft.optionalExtraRequirement = extraInput?.value.trim() || "";
  savePosterDraft();
}

function normalizePosterDraft(draft) {
  const savedType = posterTypes[draft?.posterType] ? draft.posterType : posterTypeOrder[0];
  const type = posterTypes[savedType];
  return {
    posterType: savedType,
    selectedFeeling: normalizeSelectedFeelings(type, draft),
    selectedFocus: type.focuses.includes(draft?.selectedFocus) ? draft.selectedFocus : type.focuses[0],
    inputs: draft?.inputs && typeof draft.inputs === "object" ? draft.inputs : {},
    optionalExtraRequirement: draft?.optionalExtraRequirement || "",
  };
}

function getActivePosterType() {
  return posterTypes[posterWizard.draft.posterType] || posterTypes[posterTypeOrder[0]];
}

function getPosterOutputText() {
  return posterWizard.promptView === "readable" ? buildReadablePosterSummary() : buildPosterPrompt();
}

function buildReadablePosterSummary() {
  const type = getActivePosterType();
  const inputs = posterWizard.draft.inputs || {};
  const filled = type.fields
    .map((field) => {
      const value = inputs[field.id];
      return value ? `${field.label.replace("，可不填", "").replace("，可选", "")}：${value}` : "";
    })
    .filter(Boolean)
    .join("\n");
  return [
    `海报类型：${type.name}`,
    `画面感觉：${formatSelectedFeelings(posterWizard.draft.selectedFeeling)}`,
    `最突出：${posterWizard.draft.selectedFocus}`,
    filled || "还没有填写内容。",
    posterWizard.draft.optionalExtraRequirement ? `额外要求：${posterWizard.draft.optionalExtraRequirement}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildPrompt({ posterType, userInputs, selectedFeeling, selectedFocus, optionalExtraRequirement }) {
  const type = posterTypes[posterType] || posterTypes[posterTypeOrder[0]];
  const inputs = userInputs || {};
  const theme = getPosterTheme(type, inputs);
  const selectedFeelings = Array.isArray(selectedFeeling) ? selectedFeeling : [selectedFeeling].filter(Boolean);
  const feelingTerms = selectedFeelings.flatMap((feeling) => feelingMap[feeling] || []);
  const focusTerms = focusRules[selectedFocus] || [`画面需要突出${selectedFocus}，让用户第一眼能理解重点。`];
  const textLines = buildTextLines(type, inputs);
  const avoidList = normalizeAvoidList([...(type.backendPromptRules.avoid || []), ...commonAvoid]);

  return [
    `生成一张 ${type.defaultRatio} 竖版${type.name}，主题是${theme}。`,
    `画面需要符合${type.name}的使用场景：${joinCn(type.backendPromptRules.layout)}。${joinCn(focusTerms)}`,
    `整体感觉${formatSelectedFeelings(selectedFeeling)}。画面应体现${joinCn([...(type.backendPromptRules.qualityBoosters || []), ...feelingTerms])}。`,
    textLines.length ? `画面必须准确显示以下简体中文文字：\n${textLines.join("\n")}` : "",
    `文字要求：${joinCn([...(type.backendPromptRules.textRules || []), ...commonTextRules])}`,
    `通用质量要求：${joinCn(commonQualityBoosters)}。`,
    optionalExtraRequirement ? `额外要求：${optionalExtraRequirement}。` : "",
    `避免${avoidList.join("、")}。`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildPosterPrompt() {
  return buildPrompt({
    posterType: posterWizard.draft.posterType,
    userInputs: posterWizard.draft.inputs,
    selectedFeeling: posterWizard.draft.selectedFeeling,
    selectedFocus: posterWizard.draft.selectedFocus,
    optionalExtraRequirement: posterWizard.draft.optionalExtraRequirement,
    aspectRatio: getActivePosterType().defaultRatio,
  });
}

function getPosterTheme(type, inputs) {
  const primary = inputs[type.themeField];
  if (primary) {
    if (type.themeField === "productName") return `${primary}新品上市`;
    if (type.themeField === "courseName") return `${primary}课程招生`;
    if (type.themeField === "eventName") return `${primary}活动宣传`;
    if (type.themeField === "itemName") return `${primary}新品推荐`;
    return primary;
  }
  return "用户填写的内容";
}

function buildTextLines(type, inputs) {
  return type.fields
    .map((field) => {
      const value = inputs[field.id];
      if (!value) return "";
      const label = type.textLabels[field.id] || field.label.replace("，可不填", "").replace("，可选", "");
      const parts = splitContent(value);
      if (parts.length > 1) return `${label}：${parts.map((part) => `"${part}"`).join("、")}`;
      return `${label}："${value}"`;
    })
    .filter(Boolean);
}

function splitContent(value) {
  return value
    .split(/[、,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniqueList(values) {
  return [...new Set(values.filter(Boolean))];
}

function joinCn(values) {
  return uniqueList(values.map((value) => value.replace(/[。；;,\s]+$/g, ""))).join("，");
}

function formatSelectedFeelings(value) {
  return (Array.isArray(value) ? value : [value]).filter(Boolean).join("、") || "清晰专业";
}

function normalizeSelectedFeelings(type, draft) {
  const raw = Array.isArray(draft?.selectedFeeling) ? draft.selectedFeeling : [draft?.selectedFeeling].filter(Boolean);
  const valid = raw.filter((item) => type.feelings.includes(item));
  return valid.length ? valid : [type.feelings[0]];
}

function normalizeAvoidList(values) {
  return uniqueList(
    values.map((value) =>
      value
        .replace(/^避免/, "")
        .replace(/[。；;,\s]+$/g, "")
        .trim(),
    ),
  );
}

function generatePosterFromPrompt() {
  syncPosterForm();
  const prompt = buildPosterPrompt();
  state.lastPrompt = prompt;
  PomoStore.saveState(state);
  PomoStore.showToast("MVP 已预留生成海报按钮，当前先生成并复制提示词");
  dom.posterWizard.querySelector("#posterPromptOutput").textContent = getPosterOutputText();
}

async function copyPosterPrompt() {
  try {
    syncPosterForm();
    const prompt = buildPosterPrompt();
    state.lastPrompt = prompt;
    PomoStore.saveState(state);
    await PomoStore.copyText(prompt);
    dom.posterWizard.querySelector("#posterPromptOutput").textContent = getPosterOutputText();
    PomoStore.showToast("提示词已复制");
  } catch {
    PomoStore.showToast("浏览器未允许复制");
  }
}

function generateImage() {
  const model = PomoStore.getActiveModel(state);
  const brief = dom.briefInput.value.trim();

  if (!currentModule || !currentModule.visible) {
    PomoStore.showToast("模块不可用");
    return;
  }
  if (!model) {
    PomoStore.showToast("后台需要先添加模型");
    return;
  }
  if (!brief) {
    PomoStore.showToast("先输入内容");
    dom.briefInput.focus();
    return;
  }

  const prompt = [
    `模块：${currentModule.name}`,
    `风格：${state.selectedStyle}`,
    `画幅：${currentModule.ratio}`,
    `模块提示词：${currentModule.prompt}`,
    `用户内容：${brief}`,
  ].join("\n");

  state.lastPrompt = prompt;
  PomoStore.saveState(state);
  PomoStore.drawResultCanvas({
    canvas: dom.resultCanvas,
    module: currentModule,
    model,
    brief,
    styleName: state.selectedStyle,
  });
  dom.resultTitle.textContent = `${currentModule.name} · 已生成`;
  dom.resultModelName.textContent = model.name;
  PomoStore.showToast("图像已生成");
}

function downloadCanvas() {
  const link = document.createElement("a");
  link.download = `泼墨坊-${currentModule?.name || "作图"}-${Date.now()}.png`;
  link.href = dom.resultCanvas.toDataURL("image/png");
  link.click();
}

async function copyPrompt() {
  if (!state.lastPrompt) {
    PomoStore.showToast("还没有提示词");
    return;
  }
  try {
    await PomoStore.copyText(state.lastPrompt);
    PomoStore.showToast("提示词已复制");
  } catch {
    PomoStore.showToast("浏览器未允许复制");
  }
}

dom.generateButton.addEventListener("click", generateImage);
dom.downloadButton.addEventListener("click", downloadCanvas);
dom.copyPromptButton.addEventListener("click", copyPrompt);

initModulePage();
