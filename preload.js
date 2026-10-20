const { contextBridge, ipcRenderer } = require('electron');

/**
 * 【缺陷4修复】所有 onXxx IPC 监听器现在返回 unsubscribe 函数，
 * 防止每次调用都累积新监听器导致内存泄漏。
 * 调用方：const unsub = electronAPI.onMouseBack(cb); // 后续可调用 unsub() 取消订阅
 */
contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
  toggleDevTools: () => ipcRenderer.send('window:devtools'),
  clearCache: () => ipcRenderer.send('app:clear-cache'),
  setCloseToTray: (enabled) => ipcRenderer.send('app:set-close-to-tray', enabled),
  getCloseToTray: () => ipcRenderer.invoke('app:get-close-to-tray'),
  setAutoLaunch: (enabled) => ipcRenderer.invoke('app:set-auto-launch', enabled),
  getAutoLaunch: () => ipcRenderer.invoke('app:get-auto-launch'),
  setGlobalShortcut: (accelerator) => ipcRenderer.invoke('app:set-global-shortcut', accelerator),
  getGlobalShortcut: () => ipcRenderer.invoke('app:get-global-shortcut'),
  launchOppo: (customPath) => ipcRenderer.invoke('app:launch-oppo', customPath),
  dockOppoWindow: (bounds) => ipcRenderer.invoke('app:dock-oppo-window', bounds),
  undockOppoWindow: () => ipcRenderer.invoke('app:undock-oppo-window'),
  getOppoConfig: () => ipcRenderer.invoke('app:get-oppo-config'),
  updateOppoConfig: (key, val) => ipcRenderer.invoke('app:update-oppo-config', key, val),
  launchFlydigi: (customPath) => ipcRenderer.invoke('app:launch-flydigi', customPath),
  selectExecutablePath: (title) => ipcRenderer.invoke('app:select-executable-path', title),

  onMaximizedChange: (callback) => {
    const handler = (_event, isMax) => callback(isMax);
    ipcRenderer.on('window:maximized-change', handler);
    return () => ipcRenderer.removeListener('window:maximized-change', handler);
  },
  onDeviceAdded: (callback) => {
    const handler = (_event, device) => callback(device);
    ipcRenderer.on('hid:device-added', handler);
    return () => ipcRenderer.removeListener('hid:device-added', handler);
  },
  onDeviceRemoved: (callback) => {
    const handler = (_event, device) => callback(device);
    ipcRenderer.on('hid:device-removed', handler);
    return () => ipcRenderer.removeListener('hid:device-removed', handler);
  },
  onSwitchView: (callback) => {
    const handler = (_event, target) => callback(target);
    ipcRenderer.on('nav:switch-view', handler);
    return () => ipcRenderer.removeListener('nav:switch-view', handler);
  },
  onCacheCleared: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('app:cache-cleared', handler);
    return () => ipcRenderer.removeListener('app:cache-cleared', handler);
  },
  onMouseBack: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('nav:mouse-back', handler);
    return () => ipcRenderer.removeListener('nav:mouse-back', handler);
  },
  onMouseForward: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('nav:mouse-forward', handler);
    return () => ipcRenderer.removeListener('nav:mouse-forward', handler);
  }
});
