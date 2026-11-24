const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("petDesktop", {
 drag:(dx,dy)=>ipcRenderer.send("pet:drag",{dx,dy}),
 beginDrag:()=>ipcRenderer.send("pet:drag-start"),
 endDrag:()=>ipcRenderer.send("pet:drag-end"),
 setSkating:(active)=>ipcRenderer.send("pet:skating",Boolean(active)),
 onDesktopMode:(callback)=>ipcRenderer.on("pet:desktop-mode",(_event,enabled)=>callback(Boolean(enabled))),
 onDesktopDirection:(callback)=>ipcRenderer.on("pet:desktop-direction",(_event,direction)=>callback(direction<0?-1:1)),
 minimize:()=>ipcRenderer.send("pet:minimize"),
 close:()=>ipcRenderer.send("pet:close")
});
