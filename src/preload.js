const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("petDesktop", {
  drag: (dx, dy) => ipcRenderer.send("pet:drag", { dx, dy }),
  close: () => ipcRenderer.send("pet:close")
});
