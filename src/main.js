const { app, BrowserWindow, ipcMain, screen, Menu } = require("electron");
const path = require("node:path");

let win;
let skateTimer = null;
let desktopDirection = 1;
let desktopMode = false;

function stopDesktopSkating() {
  if (skateTimer) clearInterval(skateTimer);
  skateTimer = null;
}

function startDesktopSkating() {
  // The native window is only allowed to move in the small Desktop Pet mode.
  if (!desktopMode || skateTimer || !win) return;
  desktopDirection = 1;
  skateTimer = setInterval(() => {
    if (!desktopMode || !win || win.isDestroyed() || win.isMinimized()) return stopDesktopSkating();
    const [x, y] = win.getPosition();
    const [width] = win.getSize();
    const area = screen.getDisplayMatching(win.getBounds()).workArea;
    const minX = area.x;
    const maxX = Math.max(minX, area.x + area.width - width);
    let nextX = x + desktopDirection * 2;
    if (nextX >= maxX) { nextX = maxX; desktopDirection = -1; }
    else if (nextX <= minX) { nextX = minX; desktopDirection = 1; }
    win.setPosition(Math.round(nextX), y, false);
  }, 30);
}

function setDesktopMode(enabled) {
  desktopMode = Boolean(enabled);
  if (!desktopMode) stopDesktopSkating();
  if (!win || win.isDestroyed()) return;
  if (desktopMode) {
    win.setMinimumSize(150, 150);
    win.setResizable(false);
    win.setSize(150, 150);
    win.setSkipTaskbar(true);
  } else {
    win.setResizable(true);
    win.setMinimumSize(260, 320);
    win.setSize(300, 370);
    win.setSkipTaskbar(false);
  }
  win.webContents.send("pet:desktop-mode", desktopMode);
}

function showPetWindow() {
  if (!win || win.isDestroyed()) createWindow();
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
}

function createApplicationMenu() {
  const template = [
    ...(process.platform === "darwin" ? [{
      label: app.name,
      submenu: [{ role: "about" }, { type: "separator" }, { role: "quit" }]
    }] : []),
    {
      label: "View",
      submenu: [
        { label: "Show Pet Window", accelerator: "CommandOrControl+Shift+M", click: showPetWindow },
        { label: "Minimize Pet Window", accelerator: "CommandOrControl+M", click: () => win?.minimize() },
        { type: "separator" },
        {
          label: "Toggle Desktop Mode",
          accelerator: "CommandOrControl+Shift+D",
          click: () => setDesktopMode(!desktopMode)
        }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createWindow() {
  win = new BrowserWindow({
    width: 300,
    height: 370,
    minWidth: 260,
    minHeight: 320,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    alwaysOnTop: true,
    resizable: true,
    hasShadow: false,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.setAlwaysOnTop(true, "floating");
  win.loadFile(path.join(__dirname, "index.html"));
  win.on("closed", () => {
    stopDesktopSkating();
    win = null;
  });
}

app.whenReady().then(() => {
  createApplicationMenu();
  createWindow();
});
app.on("window-all-closed", () => app.quit());
app.on("activate", showPetWindow);

ipcMain.on("pet:drag", (_event, { dx, dy }) => {
  if (!win) return;
  const [x, y] = win.getPosition();
  win.setPosition(x + dx, y + dy);
});
ipcMain.on("pet:skating", (_event, active) => {
  // Renderer skating must never move the full Pet Mode window.
  if (desktopMode && active) startDesktopSkating();
  else stopDesktopSkating();
});
ipcMain.on("pet:minimize", () => win?.minimize());
ipcMain.on("pet:close", () => app.quit());
