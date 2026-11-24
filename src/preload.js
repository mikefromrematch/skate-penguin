const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("petDesktop", {
  drag: (dx, dy) => ipcRenderer.send("pet:drag", { dx, dy }),
  setSkating: (active) => ipcRenderer.send("pet:skating", Boolean(active)),
  onDesktopMode: (callback) => ipcRenderer.on("pet:desktop-mode", (_event, enabled) => callback(Boolean(enabled))),
  close: () => ipcRenderer.send("pet:close")
});
