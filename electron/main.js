const path = require("node:path");
const { app, BrowserWindow, Menu, shell, ipcMain } = require("electron");

function createWindow(route = "desktop.html") {
  const mainWindow = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 1180,
    minHeight: 720,
    show: false,
    backgroundColor: "#f7f8f6",
    title: "Pomo Fang",
    icon: path.join(__dirname, "..", "assets", "icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("file://")) {
      return {
        action: "allow",
        overrideBrowserWindowOptions: {
          width: 1320,
          height: 860,
          minWidth: 1180,
          minHeight: 720,
          backgroundColor: "#f7f8f6",
          webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
          },
        },
      };
    }

    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.loadFile(path.join(__dirname, "..", route));
  return mainWindow;
}

function buildMenu() {
  const template = [
    {
      label: "View",
      submenu: [
        {
          label: "Workspace",
          click: (_, browserWindow) => browserWindow?.loadFile(path.join(__dirname, "..", "desktop.html")),
        },
        { type: "separator" },
        { role: "reload", label: "Reload" },
        { role: "toggleDevTools", label: "Developer Tools" },
      ],
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize", label: "Minimize" },
        { role: "togglefullscreen", label: "Fullscreen" },
        { role: "close", label: "Close" },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

ipcMain.handle("clipboard:writeText", async (_event, text) => {
  const { clipboard } = require("electron");
  clipboard.writeText(String(text ?? ""));
  return true;
});

ipcMain.handle("image:testModel", async (_event, model) => {
  const startedAt = Date.now();
  const prompt = "A minimal black ink circle on warm rice paper, no text, no letters.";
  await requestImage({
    model,
    prompt,
    size: "1024x1024",
    quality: "low",
  });
  return { ok: true, latency: Date.now() - startedAt };
});

ipcMain.handle("image:generate", async (_event, payload) => {
  const result = await requestImage(payload);
  return result;
});

async function requestImage({ model, prompt, size, quality }) {
  if (!model?.endpoint || !model?.apiKey) {
    throw new Error("模型缺少 API 地址或 API Key。");
  }

  const endpoint = normalizeImageEndpoint(model.endpoint);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${model.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model.modelId || "gpt-image-2",
      prompt,
      size: normalizeImageSize(size || "1024x1024", model),
      quality: normalizeImageQuality(quality || "low"),
      n: 1,
    }),
  });

  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();
  if (!response.ok) {
    throw new Error(extractApiError(text) || `图片接口请求失败：HTTP ${response.status}`);
  }
  if (!contentType.includes("application/json")) {
    throw new Error("图片接口没有返回 JSON，请检查 API 地址是否指向 /v1/images/generations。");
  }

  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error("图片接口返回的 JSON 无法解析。");
  }

  const item = Array.isArray(payload.data) ? payload.data[0] : payload.data || payload;
  const b64 = item?.b64_json || item?.image_base64 || item?.base64;
  const url = item?.url || item?.image_url;

  if (b64) {
    return {
      ok: true,
      imageData: b64.startsWith("data:") ? b64 : `data:image/png;base64,${b64}`,
      source: "base64",
    };
  }

  if (url) {
    return {
      ok: true,
      imageData: await imageUrlToDataUrl(url),
      source: "url",
    };
  }

  throw new Error("图片接口返回成功，但没有找到 b64_json 或 url 图片数据。");
}

function normalizeImageEndpoint(value) {
  const url = new URL(String(value || "").trim());
  const path = url.pathname.replace(/\/+$/, "");
  if (path.endsWith("/images/generations")) return url.toString();
  if (!path || path === "") {
    url.pathname = "/v1/images/generations";
    return url.toString();
  }
  if (path.endsWith("/v1")) {
    url.pathname = `${path}/images/generations`;
    return url.toString();
  }
  url.pathname = `${path}/images/generations`;
  return url.toString();
}

function normalizeImageSize(value, model = {}) {
  const raw = String(value || "").toLowerCase();
  const modelId = String(model.modelId || "").toLowerCase();
  const shortcuts = {
    "1k": "1024x1024",
    "2k": "1024x1024",
    "4k": "1024x1024",
    square: "1024x1024",
    portrait: "1024x1536",
    landscape: "1536x1024",
    wide: "1536x1024",
  };
  if (shortcuts[raw]) return shortcuts[raw];

  const match = raw.match(/^(\d{2,5})x(\d{2,5})$/);
  if (!match) return value || "1024x1024";

  const width = Number(match[1]);
  const height = Number(match[2]);
  if (allowsArbitraryImageSize(modelId) && isValidArbitraryImageSize(width, height)) {
    return `${width}x${height}`;
  }
  if (width === height) return "1024x1024";
  if (modelId.includes("dall-e-3")) {
    return width > height ? "1792x1024" : "1024x1792";
  }
  return width > height ? "1536x1024" : "1024x1536";
}

function allowsArbitraryImageSize(modelId) {
  return modelId.includes("gpt-image-2") || (!modelId.includes("gpt-image") && !modelId.includes("dall-e"));
}

function isValidArbitraryImageSize(width, height) {
  const pixels = width * height;
  const longEdge = Math.max(width, height);
  const shortEdge = Math.min(width, height);
  return (
    Number.isFinite(width) &&
    Number.isFinite(height) &&
    width % 16 === 0 &&
    height % 16 === 0 &&
    longEdge <= 3840 &&
    longEdge / shortEdge <= 3 &&
    pixels >= 655360 &&
    pixels <= 8294400
  );
}

function normalizeImageQuality(value) {
  const quality = String(value || "").toLowerCase();
  if (["low", "medium", "high", "auto"].includes(quality)) return quality;
  if (quality === "4k") return "high";
  if (quality === "2k") return "medium";
  return "low";
}

function extractApiError(text) {
  try {
    const parsed = JSON.parse(text);
    return parsed?.error?.message || parsed?.message || "";
  } catch {
    return text.slice(0, 180);
  }
}

async function imageUrlToDataUrl(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`下载生成图片失败：HTTP ${response.status}`);
  const contentType = response.headers.get("content-type") || "image/png";
  const bytes = Buffer.from(await response.arrayBuffer());
  return `data:${contentType};base64,${bytes.toString("base64")}`;
}

app.whenReady().then(() => {
  buildMenu();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
