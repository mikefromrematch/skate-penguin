const { app, BrowserWindow, ipcMain, screen, Menu } = require("electron");
const path = require("node:path");
let win, skateTimer = null, desktopDirection = 1, desktopMode = false;
function stopDesktopSkating() { if (skateTimer) clearInterval(skateTimer); skateTimer = null; }
function startDesktopSkating() {
  if (!desktopMode || skateTimer || !win) return;
  const area = screen.getDisplayMatching(win.getBounds()).workArea;
  const [x] = win.getPosition(), [width] = win.getSize();
  desktopDirection = x + width / 2 < area.x + area.width / 2 ? -1 : 1;
  win.webContents.send("pet:desktop-direction", desktopDirection);
  skateTimer = setInterval(() => {
    if (!desktopMode || !win || win.isDestroyed() || win.isMinimized()) return stopDesktopSkating();
    const [currentX, y] = win.getPosition(), [currentWidth] = win.getSize();
    const currentArea = screen.getDisplayMatching(win.getBounds()).workArea;
    const minX = currentArea.x, maxX = Math.max(minX, currentArea.x + currentArea.width - currentWidth);
    let nextX = currentX + desktopDirection * 4;
    if (nextX >= maxX) { nextX = maxX; desktopDirection = -1; win.webContents.send("pet:desktop-direction", desktopDirection); }
    else if (nextX <= minX) { nextX = minX; desktopDirection = 1; win.webContents.send("pet:desktop-direction", desktopDirection); }
    win.setPosition(Math.round(nextX), y, false);
  }, 30);
}
function setDesktopMode(enabled) {
  desktopMode = Boolean(enabled);
  if (!desktopMode) stopDesktopSkating();
  if (!win || win.isDestroyed()) return;
  if (desktopMode) { win.setMinimumSize(150,150); win.setResizable(false); win.setSize(150,150); win.setSkipTaskbar(true); }
  else { win.setResizable(true); win.setMinimumSize(260,320); win.setSize(300,370); win.setSkipTaskbar(false); }
  win.webContents.send("pet:desktop-mode", desktopMode);
  if (desktopMode) startDesktopSkating();
}
function showPetWindow() { if (!win || win.isDestroyed()) createWindow(); if (win.isMinimized()) win.restore(); win.show(); win.focus(); }
function createApplicationMenu() {
  const template = [
    ...(process.platform === "darwin" ? [{label:app.name,submenu:[{role:"about"},{type:"separator"},{role:"quit"}]}] : []),
    {label:"View",submenu:[
      {label:"Show Pet Window",accelerator:"CommandOrControl+Shift+M",click:showPetWindow},
      {label:"Minimize Pet Window",accelerator:"CommandOrControl+M",click:()=>win?.minimize()},
      {type:"separator"},
      {label:"Toggle Desktop Mode",accelerator:"CommandOrControl+Shift+D",click:()=>setDesktopMode(!desktopMode)}
    ]}
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
function createWindow() {
  win = new BrowserWindow({width:300,height:370,minWidth:260,minHeight:320,frame:false,transparent:true,backgroundColor:"#00000000",alwaysOnTop:true,resizable:true,hasShadow:false,skipTaskbar:false,webPreferences:{preload:path.join(__dirname,"preload.js"),contextIsolation:true,nodeIntegration:false}});
  win.setAlwaysOnTop(true,"floating"); win.loadFile(path.join(__dirname,"index.html"));
  win.on("closed",()=>{stopDesktopSkating();win=null;});
}
app.whenReady().then(()=>{createApplicationMenu();createWindow();});
app.on("window-all-closed",()=>app.quit()); app.on("activate",showPetWindow);
ipcMain.on("pet:drag-start",()=>{if(desktopMode)stopDesktopSkating();});
ipcMain.on("pet:drag",(_event,{dx,dy})=>{if(!win)return;const [x,y]=win.getPosition();win.setPosition(x+dx,y+dy);});
ipcMain.on("pet:drag-end",()=>{if(desktopMode)startDesktopSkating();});
ipcMain.on("pet:skating",(_event,active)=>{if(desktopMode&&active)startDesktopSkating();});
ipcMain.on("pet:minimize",()=>win?.minimize()); ipcMain.on("pet:close",()=>app.quit());
