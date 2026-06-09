const PomoStore = (() => {
  const storageKey = "pomo_fang_state_v2";
  const legacyKey = "pomo_fang_state_v1";

  const accentMap = {
    vermilion: "#c23b2e",
    jade: "#13795b",
    indigo: "#315aa6",
    gold: "#b8841a",
    ink: "#171716",
  };

  const styles = ["国潮", "极简", "写实", "电商", "手绘", "高级灰"];

  const defaultState = {
    activeModelId: "demo-model",
    selectedStyle: "国潮",
    selectedAspectRatio: "3:4",
    selectedResolution: "1K",
    lastPrompt: "",
    history: [],
    models: [
      {
        id: "demo-model",
        name: "演示图像模型",
        provider: "Local Demo",
        endpoint: "",
        apiKey: "",
        modelId: "",
        status: "ready",
        latency: 128,
      },
    ],
    modules: [
      {
        id: "poster",
        name: "智能海报",
        description: "小红书、卖货、课程、活动、餐饮，一键生成专业提示词",
        ratio: "3:4",
        accent: "vermilion",
        visible: true,
        prompt:
          "根据用户选择的海报类型、普通风格词和少量文字内容，自动组装适合 GPT Image 2 / image2 的专业结构化海报提示词。",
        fields: ["选择类型", "填写内容", "生成提示词"],
        examples: ["小红书封面", "产品卖货海报", "课程招生海报"],
      },
      {
        id: "wechat-cover",
        name: "公众号封面",
        description: "文章首图、栏目封面",
        ratio: "4:3",
        accent: "jade",
        visible: true,
        prompt:
          "生成一张微信公众号封面，信息层级清楚，标题区域醒目，背景有内容暗示，适合知识、商业和生活方式文章。",
        fields: ["文章标题", "栏目类型", "情绪基调"],
        examples: ["行业观察", "品牌故事", "知识科普"],
      },
      {
        id: "moments",
        name: "朋友圈配图",
        description: "日常分享、品牌动态",
        ratio: "1:1",
        accent: "indigo",
        visible: true,
        prompt:
          "生成一张朋友圈配图，画面自然、有生活感，文字少而精，适合手机端快速浏览，整体温和但有记忆点。",
        fields: ["分享内容", "画面氛围", "一句话文案"],
        examples: ["开业通知", "客户案例", "生活方式种草"],
      },
      {
        id: "product-shot",
        name: "产品图",
        description: "商品主图、质感展示",
        ratio: "1:1",
        accent: "gold",
        visible: true,
        prompt:
          "生成一张产品展示图，主体清晰、材质真实、光影干净，突出卖点和使用场景，适合电商、私域和社媒传播。",
        fields: ["产品名称", "核心卖点", "使用场景"],
        examples: ["茶礼盒主图", "护肤品质感图", "文创周边展示"],
      },
    ],
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeState(parsed) {
    const defaultModulesById = new Map(defaultState.modules.map((module) => [module.id, module]));
    const savedModules = Array.isArray(parsed?.modules) ? parsed.modules : clone(defaultState.modules);
    const savedModuleIds = new Set(savedModules.map((module) => module.id));
    const mergedModules = [
      ...savedModules,
      ...defaultState.modules.filter((module) => !savedModuleIds.has(module.id)),
    ];
    return {
      ...clone(defaultState),
      ...parsed,
      models: Array.isArray(parsed?.models) ? parsed.models : clone(defaultState.models),
      history: Array.isArray(parsed?.history) ? parsed.history : [],
      modules: mergedModules.map((module) => {
        const defaultModule = defaultModulesById.get(module.id);
        const fallback = defaultModule || {
          fields: ["主题", "核心信息", "风格要求"],
          examples: ["新品宣传", "节日活动", "品牌日常"],
        };
        const normalizedModule = {
          ...fallback,
          ...module,
          fields: normalizeList(module.fields, fallback.fields),
          examples: normalizeList(module.examples, fallback.examples),
        };
        if (module.id === "poster" && defaultModule) {
          return {
            ...normalizedModule,
            name: defaultModule.name,
            description: defaultModule.description,
            ratio: defaultModule.ratio,
            prompt: defaultModule.prompt,
            fields: defaultModule.fields,
            examples: defaultModule.examples,
          };
        }
        return normalizedModule;
      }),
    };
  }

  function normalizeList(value, fallback) {
    return Array.isArray(value) && value.length ? value : fallback;
  }

  const smartPoster = (() => {
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
    const commonTextRules = ["所有中文必须清晰、端正、可读", "不要乱码", "不要错别字", "不要拼音", "不要额外生成英文", "不要假中文", "不要生成用户没有提供的额外文字"];
    const commonQualityBoosters = ["画面要主体突出", "视觉中心明确", "层次分明", "真实材质", "自然光影", "丰富但不杂乱的细节", "具有商业海报完成度"];
    const commonAvoid = ["避免乱码", "错别字", "假品牌 logo", "廉价模板感", "塑料 CGI", "杂乱背景", "过多小字", "不可读微文字", "随机英文", "假中文", "透视错误", "主体变形"];
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

    function defaultDraft(draft = {}) {
      const posterType = posterTypes[draft.posterType] ? draft.posterType : posterTypeOrder[0];
      const type = posterTypes[posterType];
      return {
        posterType,
        selectedFeeling: normalizeSelectedFeelings(type, draft),
        selectedFocus: type.focuses.includes(draft.selectedFocus) ? draft.selectedFocus : type.focuses[0],
        inputs: draft.inputs && typeof draft.inputs === "object" ? draft.inputs : {},
        optionalExtraRequirement: draft.optionalExtraRequirement || "",
      };
    }

    function buildPrompt({ posterType, userInputs, selectedFeeling, selectedFocus, optionalExtraRequirement, aspectRatio }) {
      const type = posterTypes[posterType] || posterTypes[posterTypeOrder[0]];
      const inputs = userInputs || {};
      const theme = getPosterTheme(type, inputs);
      const outputRatio = aspectRatio || type.defaultRatio;
      const orientation = ratioOrientation(outputRatio);
      const layoutRules = type.backendPromptRules.layout.map((rule) =>
        rule.includes(type.defaultRatio)
          ? rule.replace(type.defaultRatio, outputRatio).replace(/竖版|横版|方形/g, orientation)
          : rule,
      );
      const selectedFeelings = Array.isArray(selectedFeeling) ? selectedFeeling : [selectedFeeling].filter(Boolean);
      const feelingTerms = selectedFeelings.flatMap((feeling) => feelingMap[feeling] || []);
      const focusTerms = focusRules[selectedFocus] || [`画面需要突出${selectedFocus}，让用户第一眼能理解重点。`];
      const textLines = buildTextLines(type, inputs);
      const avoidList = normalizeAvoidList([...(type.backendPromptRules.avoid || []), ...commonAvoid]);
      return [
        `生成一张 ${outputRatio} ${orientation}${type.name}，主题是${theme}。`,
        `画面需要符合${type.name}的使用场景：${joinCn(layoutRules)}。${joinCn(focusTerms)}`,
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

    function readableSummary(draft) {
      const normalized = defaultDraft(draft);
      const type = posterTypes[normalized.posterType];
      const filled = type.fields
        .map((field) => {
          const value = normalized.inputs[field.id];
          return value ? `${field.label.replace("，可不填", "").replace("，可选", "")}：${value}` : "";
        })
        .filter(Boolean)
        .join("\n");
      return [
        `海报类型：${type.name}`,
        `画面感觉：${formatSelectedFeelings(normalized.selectedFeeling)}`,
        `最突出：${normalized.selectedFocus}`,
        filled || "还没有填写内容。",
        normalized.optionalExtraRequirement ? `额外要求：${normalized.optionalExtraRequirement}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");
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

    function normalizeAvoidList(values) {
      return uniqueList(values.map((value) => value.replace(/^避免/, "").replace(/[。；;,\s]+$/g, "").trim()));
    }

    function normalizeSelectedFeelings(type, draft) {
      const raw = Array.isArray(draft.selectedFeeling) ? draft.selectedFeeling : [draft.selectedFeeling].filter(Boolean);
      const valid = raw.filter((item) => type.feelings.includes(item));
      return valid.length ? valid : [type.feelings[0]];
    }

    function ratioOrientation(value) {
      const [width, height] = String(value)
        .split(":")
        .map((item) => Number(item));
      if (!width || !height || width === height) return "方形";
      return width > height ? "横版" : "竖版";
    }

    function formatSelectedFeelings(value) {
      return (Array.isArray(value) ? value : [value]).filter(Boolean).join("、") || "清晰专业";
    }

    return { posterTypeOrder, posterTypes, defaultDraft, buildPrompt, readableSummary, formatSelectedFeelings };
  })();

  function loadState() {
    try {
      const saved = localStorage.getItem(storageKey) || localStorage.getItem(legacyKey);
      if (!saved) return clone(defaultState);
      return normalizeState(JSON.parse(saved));
    } catch {
      return clone(defaultState);
    }
  }

  function saveState(state) {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }

  function resetState() {
    const state = clone(defaultState);
    saveState(state);
    return state;
  }

  function uid(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function getActiveModel(state) {
    return state.models.find((model) => model.id === state.activeModelId) || state.models[0] || null;
  }

  function getVisibleModules(state) {
    return state.modules.filter((module) => module.visible);
  }

  function getModuleById(state, moduleId) {
    return state.modules.find((module) => module.id === moduleId) || null;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function showToast(message) {
    const toast = document.querySelector("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      toast.classList.remove("show");
    }, 2100);
  }

  async function copyText(text) {
    if (window.pomoDesktop?.copyText) {
      await window.pomoDesktop.copyText(text);
      return;
    }

    await navigator.clipboard.writeText(text);
  }

  function ratioToSize(ratio) {
    const sizes = {
      "1:1": { width: 1200, height: 1200 },
      "3:4": { width: 900, height: 1200 },
      "4:3": { width: 1200, height: 900 },
      "16:9": { width: 1280, height: 720 },
      "9:16": { width: 900, height: 1600 },
      "2:3": { width: 900, height: 1350 },
      "3:2": { width: 1350, height: 900 },
    };
    return sizes[ratio] || sizes["3:4"];
  }

  function drawEmptyCanvas(canvas, label = "等待生成") {
    const ctx = canvas.getContext("2d");
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#f1f4f0";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#d7ded6";
    ctx.fillRect(width * 0.12, height * 0.14, width * 0.76, height * 0.54);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(width * 0.18, height * 0.22, width * 0.64, height * 0.12);
    ctx.fillRect(width * 0.18, height * 0.39, width * 0.44, height * 0.06);
    ctx.fillStyle = "#686b63";
    ctx.font = `${Math.max(22, Math.round(width * 0.036))}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(label, width / 2, height * 0.76);
  }

  function setCanvasAspect(canvas, ratio) {
    const size = ratioToSize(ratio);
    canvas.width = size.width;
    canvas.height = size.height;
    canvas.style.aspectRatio = `${size.width} / ${size.height}`;
  }

  function drawResultCanvas({ canvas, module, model, brief, styleName }) {
    setCanvasAspect(canvas, module.ratio);
    const ctx = canvas.getContext("2d");
    const accent = accentMap[module.accent] || accentMap.ink;
    const width = canvas.width;
    const height = canvas.height;
    const seed = hashString(`${brief}${module.name}${styleName}`);

    ctx.clearRect(0, 0, width, height);
    paintBackground(ctx, width, height, accent, seed);
    paintArtwork(ctx, width, height, accent, seed);
    paintText(ctx, width, height, module, model, brief, styleName);
  }

  function paintBackground(ctx, width, height, accent, seed) {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#fbfcfa");
    gradient.addColorStop(0.54, shadeColor(accent, 0.84));
    gradient.addColorStop(1, "#e8eee8");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.globalAlpha = 0.88;
    ctx.fillStyle = shadeColor(accent, 0.06);
    ctx.beginPath();
    ctx.ellipse(width * 0.72, height * 0.21, width * 0.27, height * 0.16, seed % 2 ? 0.25 : -0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.78;
    ctx.fillStyle = "rgba(23, 23, 22, 0.09)";
    ctx.beginPath();
    ctx.ellipse(width * 0.23, height * 0.71, width * 0.21, height * 0.15, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function paintArtwork(ctx, width, height, accent, seed) {
    const left = width * 0.12;
    const top = height * 0.13;
    const artWidth = width * 0.76;
    const artHeight = height * 0.44;

    ctx.save();
    roundedRect(ctx, left, top, artWidth, artHeight, width * 0.018);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    const imageGradient = ctx.createLinearGradient(left, top, left + artWidth, top + artHeight);
    imageGradient.addColorStop(0, shadeColor(accent, 0.5));
    imageGradient.addColorStop(1, "#262622");
    ctx.fillStyle = imageGradient;
    roundedRect(ctx, left + width * 0.025, top + width * 0.025, artWidth - width * 0.05, artHeight - width * 0.05, width * 0.012);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.52)";
    ctx.lineWidth = Math.max(4, width * 0.008);
    const strokes = 5 + (seed % 4);
    for (let i = 0; i < strokes; i += 1) {
      ctx.beginPath();
      const startX = left + artWidth * (0.1 + i * 0.12);
      ctx.moveTo(startX, top + artHeight * (0.22 + ((seed + i) % 5) * 0.04));
      ctx.bezierCurveTo(
        left + artWidth * 0.28,
        top + artHeight * (0.68 - i * 0.04),
        left + artWidth * 0.68,
        top + artHeight * (0.1 + i * 0.08),
        left + artWidth * 0.9,
        top + artHeight * (0.56 + ((seed + i) % 3) * 0.08),
      );
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(255, 255, 255, 0.86)";
    ctx.beginPath();
    ctx.arc(left + artWidth * 0.74, top + artHeight * 0.28, artWidth * 0.095, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function paintText(ctx, width, height, module, model, brief, styleName) {
    const margin = width * 0.12;
    const titleTop = height * 0.64;
    const mainWords = splitTitle(brief);

    ctx.fillStyle = "#171716";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = `800 ${Math.max(36, Math.round(width * 0.078))}px sans-serif`;
    wrapCanvasText(ctx, mainWords, margin, titleTop, width - margin * 2, Math.max(44, width * 0.096), 2);

    ctx.fillStyle = "#686b63";
    ctx.font = `600 ${Math.max(18, Math.round(width * 0.031))}px sans-serif`;
    wrapCanvasText(ctx, `${module.name} · ${styleName} · ${module.ratio}`, margin, height * 0.82, width - margin * 2, width * 0.045, 1);

    ctx.fillStyle = "#171716";
    ctx.globalAlpha = 0.76;
    ctx.font = `600 ${Math.max(16, Math.round(width * 0.026))}px sans-serif`;
    wrapCanvasText(ctx, model?.name || "未选择模型", margin, height * 0.9, width - margin * 2, width * 0.04, 1);
    ctx.globalAlpha = 1;
  }

  function splitTitle(text) {
    const clean = text.replace(/\s+/g, " ").trim();
    if (clean.length <= 18) return clean;
    return clean.slice(0, 18);
  }

  function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
    const chars = Array.from(text);
    const lines = [];
    let line = "";
    chars.forEach((char) => {
      const testLine = `${line}${char}`;
      if (ctx.measureText(testLine).width > maxWidth && line) {
        lines.push(line);
        line = char;
      } else {
        line = testLine;
      }
    });
    if (line) lines.push(line);
    lines.slice(0, maxLines).forEach((item, index) => {
      const output = index === maxLines - 1 && lines.length > maxLines ? `${item.slice(0, -1)}…` : item;
      ctx.fillText(output, x, y + index * lineHeight);
    });
  }

  function roundedRect(ctx, x, y, width, height, radius) {
    const safeRadius = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + safeRadius, y);
    ctx.arcTo(x + width, y, x + width, y + height, safeRadius);
    ctx.arcTo(x + width, y + height, x, y + height, safeRadius);
    ctx.arcTo(x, y + height, x, y, safeRadius);
    ctx.arcTo(x, y, x + width, y, safeRadius);
    ctx.closePath();
  }

  function shadeColor(hex, amount) {
    const value = hex.replace("#", "");
    const number = parseInt(value, 16);
    const r = Math.round(((number >> 16) & 255) + (255 - ((number >> 16) & 255)) * amount);
    const g = Math.round(((number >> 8) & 255) + (255 - ((number >> 8) & 255)) * amount);
    const b = Math.round((number & 255) + (255 - (number & 255)) * amount);
    return `rgb(${r}, ${g}, ${b})`;
  }

  function hashString(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i += 1) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  return {
    accentMap,
    styles,
    clone,
    loadState,
    saveState,
    resetState,
    uid,
    getActiveModel,
    getVisibleModules,
    getModuleById,
    escapeHtml,
    showToast,
    copyText,
    setCanvasAspect,
    drawEmptyCanvas,
    drawResultCanvas,
    smartPoster,
  };
})();
