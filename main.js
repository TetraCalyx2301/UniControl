/**
 * UniControl - Main Process Entry Point
 * Unified peripheral control center for MCHOSE, EWEADN, OPPO Connect, and FLYDIGI.
 */

const { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage, globalShortcut, session, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const { configurePeripheralSession } = require('./src/main/sessionManager');
const DockManager = require('./src/main/dockManager');
const AppLauncher = require('./src/main/appLauncher');

// Setup custom profile path to prevent permission collisions
app.setPath('userData', path.join(app.getPath('appData'), 'UniControl_Profile'));
require('events').EventEmitter.defaultMaxListeners = 50;

// Enable GPU hardware acceleration flags
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('enable-hardware-overlays');
app.commandLine.appendSwitch('ignore-gpu-blocklist');

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  console.log('[UniControl] Second instance detected, requesting primary to show and exiting...');
  app.quit();
  process.exit(0);
}

// Essential chromium flags for WebHID/WebUSB stability
app.commandLine.appendSwitch('ignore-certificate-errors');
app.commandLine.appendSwitch('allow-insecure-localhost');
app.commandLine.appendSwitch('enable-features', 'WebHID,WebUSB,WebSerial');
app.commandLine.appendSwitch('disable-site-isolation-trials');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

let mainWindow = null;
let tray = null;
let isQuitting = false;
let currentShortcut = 'CommandOrControl+Alt+U';

// 【缺陷5修复】closeToTray 从持久化文件中读取，避免启动时序竞争导致使用错误默认值
// 渲染进程使用 localStorage 存储，主进程通过独立 JSON 文件持久化同步
const SETTINGS_PATH = path.join(app.getPath('appData'), 'UniControl_Profile', 'settings.json');

function loadMainSettings() {
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      const data = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
      return {
        closeToTray: typeof data.closeToTray === 'boolean' ? data.closeToTray : true,
        wakeShortcut: typeof data.wakeShortcut === 'string' ? data.wakeShortcut : 'CommandOrControl+Alt+U',
      };
    }
  } catch (e) {
    console.warn('[UniControl] Failed to load settings.json, using defaults:', e.message);
  }
  return { closeToTray: true, wakeShortcut: 'CommandOrControl+Alt+U' };
}

function saveMainSettings(updates) {
  try {
    const dir = path.dirname(SETTINGS_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    let current = {};
    if (fs.existsSync(SETTINGS_PATH)) {
      current = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
    }
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify({ ...current, ...updates }, null, 2), 'utf8');
  } catch (e) {
    console.warn('[UniControl] Failed to save settings.json:', e.message);
  }
}

const mainSettings = loadMainSettings();
let closeToTray = mainSettings.closeToTray;
currentShortcut = mainSettings.wakeShortcut;

const dockManager = new DockManager(() => mainWindow);

function createWindow() {
  console.log('[UniControl] Initializing main window...');
  try {
    configurePeripheralSession(session.defaultSession, () => mainWindow);
    const hubPartition = session.fromPartition('persist:unicontrol_profile');
    configurePeripheralSession(hubPartition, () => mainWindow);

    mainWindow = new BrowserWindow({
      width: 1440,
      height: 920,
      minWidth: 1080,
      minHeight: 700,
      title: 'UniControl - 统一外设控制中心',
      frame: false,
      backgroundColor: '#0a0a0c',
      show: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        webviewTag: true,
        contextIsolation: true,
        nodeIntegration: false,
        spellcheck: false,
        backgroundThrottling: false,
      }
    });

    mainWindow.loadFile(path.join(__dirname, 'src', 'index.html')).catch(err => {
      console.error('[UniControl] loadFile failed:', err);
    });

    const isHiddenLaunch = process.argv.includes('--hidden');

    mainWindow.once('ready-to-show', () => {
      console.log('[UniControl] Window ready to show.');
      mainWindow.center();
      if (!isHiddenLaunch) {
        mainWindow.show();
        mainWindow.setAlwaysOnTop(true);
        mainWindow.focus();
        setTimeout(() => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.setAlwaysOnTop(false);
          }
        }, 300);
      } else {
        console.log('[UniControl] Started in hidden background tray mode.');
      }
    });

    setTimeout(() => {
      if (!isHiddenLaunch && mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
        mainWindow.center();
        mainWindow.show();
        mainWindow.focus();
      }
    }, 400);

    mainWindow.webContents.on('render-process-gone', (event, details) => {
      console.error('[UniControl] Main window render process gone:', details);
    });

    mainWindow.webContents.on('unresponsive', () => {
      console.warn('[UniControl] Main window unresponsive.');
    });

    mainWindow.webContents.on('console-message', (e, level, message, line, sourceId) => {
      console.log(`[Renderer LOG ${level}] ${message} (${sourceId}:${line})`);
    });

    mainWindow.on('close', (event) => {
      if (!isQuitting) {
        if (closeToTray) {
          event.preventDefault();
          mainWindow.hide();
          if (tray) {
            tray.displayBalloon({
              title: 'UniControl 已最小化到托盘',
              content: '应用在后台运行中，可随时通过快捷键 Ctrl+Alt+U 唤出。'
            });
          }
        } else {
          isQuitting = true;
          app.quit();
        }
      }
    });

    mainWindow.on('maximize', () => {
      mainWindow.webContents.send('window:maximized-change', true);
      dockManager.triggerResize();
    });

    mainWindow.on('unmaximize', () => {
      mainWindow.webContents.send('window:maximized-change', false);
      dockManager.triggerResize();
    });

    mainWindow.on('resize', () => {
      dockManager.triggerResize();
    });

    mainWindow.on('moved', () => {
      dockManager.triggerResize();
    });

    // Hardware mouse back/forward button navigation
    mainWindow.on('app-command', (e, cmd) => {
      if (cmd === 'browser-backward') {
        mainWindow.webContents.send('nav:mouse-back');
      } else if (cmd === 'browser-forward') {
        mainWindow.webContents.send('nav:mouse-forward');
      }
    });

    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.type === 'keyDown' && (input.key === 'BrowserBack' || input.code === 'BrowserBack')) {
        mainWindow.webContents.send('nav:mouse-back');
      }
    });
  } catch (err) {
    console.error('[UniControl] Fatal error during createWindow:', err);
  }
}

// Forward mouse navigation from all child WebContents (including webviews)
app.on('web-contents-created', (event, contents) => {
  contents.on('app-command', (e, cmd) => {
    if (cmd === 'browser-backward') {
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('nav:mouse-back');
    } else if (cmd === 'browser-forward') {
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('nav:mouse-forward');
    }
  });

  contents.on('before-input-event', (e, input) => {
    if (input.type === 'keyDown' && (input.key === 'BrowserBack' || input.code === 'BrowserBack')) {
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('nav:mouse-back');
    }
  });

  contents.on('render-process-gone', (e, details) => {
    console.error('[UniControl] Child render-process-gone:', details);
  });

  contents.on('unresponsive', () => {
    console.warn('[UniControl] Child webContents unresponsive');
  });
});

function createTray() {
  try {
    const icoPath = path.join(__dirname, 'src', 'assets', 'icon.ico');
    const pngPath = path.join(__dirname, 'src', 'assets', 'icon.png');
    let trayIcon;
    if (fs.existsSync(icoPath)) {
      trayIcon = nativeImage.createFromPath(icoPath);
    } else if (fs.existsSync(pngPath)) {
      trayIcon = nativeImage.createFromPath(pngPath);
    } else {
      trayIcon = nativeImage.createEmpty();
    }

    tray = new Tray(trayIcon);

    const contextMenu = Menu.buildFromTemplate([
      {
        label: '打开 UniControl 控制台',
        click: () => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
          }
        }
      },
      { type: 'separator' },
      {
        label: '完全退出',
        click: () => {
          isQuitting = true;
          app.quit();
        }
      }
    ]);

    tray.setToolTip('UniControl - 统一外设控制中心');
    tray.setContextMenu(contextMenu);
    tray.on('double-click', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.show();
          mainWindow.focus();
        }
      }
    });
    tray.on('click', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
      }
    });
  } catch (trayErr) {
    console.warn('[UniControl] Tray warning:', trayErr);
  }
}

// Global Shortcuts
function registerGlobalWakeShortcut(newShortcut) {
  try {
    if (currentShortcut) {
      globalShortcut.unregister(currentShortcut);
    }
    if (!newShortcut || newShortcut === 'None') {
      currentShortcut = null;
      return { success: true, shortcut: null };
    }
    const success = globalShortcut.register(newShortcut, () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        if (mainWindow.isVisible() && mainWindow.isFocused()) {
          mainWindow.hide();
        } else {
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.show();
          mainWindow.focus();
        }
      }
    });
    if (success) {
      currentShortcut = newShortcut;
      saveMainSettings({ wakeShortcut: newShortcut }); // 持久化
      return { success: true, shortcut: newShortcut };
    } else {
      if (currentShortcut) {
        globalShortcut.register(currentShortcut, () => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            if (mainWindow.isVisible() && mainWindow.isFocused()) {
              mainWindow.hide();
            } else {
              if (mainWindow.isMinimized()) mainWindow.restore();
              mainWindow.show();
              mainWindow.focus();
            }
          }
        });
      }
      return { success: false, error: '快捷键已被占用或无效' };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Window control IPC
ipcMain.on('window:minimize', () => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.minimize();
});

ipcMain.on('window:maximize', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window:close', () => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.close();
});

ipcMain.on('window:devtools', () => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.toggleDevTools();
});

// Cache & Settings IPC
ipcMain.on('app:clear-cache', async () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    const hubPartition = session.fromPartition('persist:unicontrol_profile');
    await hubPartition.clearCache();
    await session.defaultSession.clearCache();
    mainWindow.webContents.send('app:cache-cleared');
  }
});

ipcMain.on('app:set-close-to-tray', (event, enabled) => {
  closeToTray = !!enabled;
  // 【缺陷5修复】同步持久化到主进程 settings.json，确保下次冷启动时序一致
  saveMainSettings({ closeToTray: closeToTray });
});

ipcMain.handle('app:get-close-to-tray', () => closeToTray);

ipcMain.handle('app:set-auto-launch', (event, enabled) => {
  try {
    app.setLoginItemSettings({
      openAtLogin: !!enabled,
      openAsHidden: true,
      path: process.execPath,
      args: ['--hidden']
    });
    return { success: true, openAtLogin: !!enabled };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('app:get-auto-launch', () => {
  try {
    return app.getLoginItemSettings().openAtLogin;
  } catch (_) {
    return false;
  }
});

ipcMain.handle('app:set-global-shortcut', (event, accelerator) => registerGlobalWakeShortcut(accelerator));
ipcMain.handle('app:get-global-shortcut', () => currentShortcut);

ipcMain.handle('app:select-executable-path', async (event, title) => {
  if (!mainWindow || mainWindow.isDestroyed()) return { canceled: true };
  const res = await dialog.showOpenDialog(mainWindow, {
    title: title || '选择可执行程序 (.exe)',
    properties: ['openFile'],
    filters: [
      { name: 'Executable Files', extensions: ['exe'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  if (res.canceled || !res.filePaths || res.filePaths.length === 0) {
    return { canceled: true };
  }
  return { canceled: false, filePath: res.filePaths[0] };
});

// OPPO Connect & Flydigi Launch IPC
ipcMain.handle('app:dock-oppo-window', async (event, bounds) => dockManager.dock(bounds));
ipcMain.handle('app:undock-oppo-window', async () => dockManager.undock());

ipcMain.handle('app:launch-oppo', async (event, customPath) => {
  const candidates = AppLauncher.getOppoCandidates(customPath, app.getAppPath(), process.resourcesPath);
  const targetExe = AppLauncher.resolveExecutable(candidates);
  return AppLauncher.launch(targetExe);
});

const OP_CONFIG_PATH = path.join(app.getPath('appData'), 'O+Connect', 'config.json');

ipcMain.handle('app:get-oppo-config', async () => {
  try {
    if (fs.existsSync(OP_CONFIG_PATH)) {
      const data = fs.readFileSync(OP_CONFIG_PATH, 'utf8');
      return { success: true, config: JSON.parse(data) };
    }
    return { success: false, error: 'CONFIG_NOT_FOUND' };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('app:update-oppo-config', async (event, key, val) => {
  try {
    if (fs.existsSync(OP_CONFIG_PATH)) {
      const data = JSON.parse(fs.readFileSync(OP_CONFIG_PATH, 'utf8'));
      data[key] = val;
      fs.writeFileSync(OP_CONFIG_PATH, JSON.stringify(data, null, '\t'), 'utf8');
      return { success: true };
    }
    return { success: false, error: 'CONFIG_NOT_FOUND' };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('app:launch-flydigi', async (event, customPath) => {
  const candidates = AppLauncher.getFlydigiCandidates(customPath, process.resourcesPath);
  const targetExe = AppLauncher.resolveExecutable(candidates);
  return AppLauncher.launch(targetExe);
});

// App lifecycle
app.on('second-instance', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.setAlwaysOnTop(true);
    mainWindow.focus();
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.setAlwaysOnTop(false);
      }
    }, 200);
  }
});

app.whenReady().then(() => {
  createWindow();
  createTray();
  registerGlobalWakeShortcut(currentShortcut);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', () => {
  dockManager.cleanup();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

process.on('uncaughtException', (err) => {
  console.error('[UniControl] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[UniControl] Unhandled Rejection:', reason);
});
