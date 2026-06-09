const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("pomoDesktop", {
  isDesktop: true,
  platform: process.platform,
  copyText: (text) => ipcRenderer.invoke("clipboard:writeText", text),
  testImageModel: (model) => ipcRenderer.invoke("image:testModel", model),
  generateImage: (payload) => ipcRenderer.invoke("image:generate", payload),
});
