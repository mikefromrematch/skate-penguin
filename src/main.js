const { app, BrowserWindow, ipcMain, screen } = require("electron");
const path = require("node:path");

let win;
let skateTimer = null;
let desktopDirection = 1;

function stopDesktopSkating() {
  if (skateTimer) clearInterval(skateTimer);
  skateTimer = null;
}

function startDesktopSkating() {
  if (skateTimer || !win) return;
  desktopDirection = 1;
  // Move the whole companion gently across the desktop while Pip skates.
  skateTimer = setInterval(() => {
    if (!win || win.isDestroyed()) return stopDesktopSkating();
    const [x, y] = win.getPosition();
    const [width] = win.getSize();
    const display = screen.getDisplayMatching(win.getBounds());
    const area = display.workArea;
    const minX = area.x;
    const maxX = Math.max(minX, area.x + area.width - width);
    let nextX = x + desktopDirection * 2;
    if (nextX >= maxX) {
      nextX = maxX;
      desktopDirection = -1;
    } else if (nextX <= minX) {
      nextX = minX;
      desktopDirection = 1;
    }
    win.setPosition(Math.round(nextX), y, false);
  }, 30);
}

function createWindow() {
  win = new BrowserWindow({
    width: 300,
    height: 370,
    minWidth: 260,
    minHeight: 320,
    frame: false,
    transparent: true,
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

app.whenReady().then(createWindow);
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
