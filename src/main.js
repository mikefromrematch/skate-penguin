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
  if (skateTimer || !win) return;
  desktopDirection = 1;
  skateTimer = setInterval(() => {
    if (!win || win.isDestroyed()) return stopDesktopSkating();
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
  if (!win || win.isDestroyed()) return;
  if (desktopMode) {
    win.setMinimumSize(150, 150);
    win.setResizable(false);
    win.setSize(150, 150);
  } else {
    win.setResizable(true);
    win.setMinimumSize(260, 320);
    win.setSize(300, 370);
  }
  win.webContents.send("pet:desktop-mode", desktopMode);
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
    skipTaskbar: true,
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
app.on("activate", () => { if (!win) createWindow(); });

ipcMain.on("pet:drag", (_event, { dx, dy }) => {
  if (!win) return;
  const [x, y] = win.getPosition();
  win.setPosition(x + dx, y + dy);
});
ipcMain.on("pet:skating", (_event, active) => {
  if (active) startDesktopSkating();
  else stopDesktopSkating();
});
ipcMain.on("pet:close", () => app.quit());
