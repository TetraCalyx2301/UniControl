// UniControl - Desktop Experience Engine

let currentZoom = 1.0;
let currentView = 'home';
let currentOppoMode = 'web';
let themeSetting = localStorage.getItem('unicontrol-theme-setting') || 'dark';

// DOM Elements
const views = {};
const webviews = {};
const progressBars = {};
const fallbacks = {};
const elements = {};

function initDOMElements() {
  views.home = document.getElementById('view-home');
  views.mchose = document.getElementById('view-mchose');
  views.eweadn = document.getElementById('view-eweadn');
  views.oppo = document.getElementById('view-oppo');

  webviews.mchose = document.getElementById('webview-mchose');
  webviews.eweadn = document.getElementById('webview-eweadn');
  webviews.oppo = document.getElementById('webview-oppo');

  progressBars.mchose = document.getElementById('progress-mchose');
  progressBars.eweadn = document.getElementById('progress-eweadn');
  progressBars.oppo = document.getElementById('progress-oppo');

  fallbacks.mchose = document.getElementById('fallback-mchose');
  fallbacks.eweadn = document.getElementById('fallback-eweadn');
  fallbacks.oppo = document.getElementById('fallback-oppo');

  elements.btnBack = document.getElementById('btn-floating-back') || document.getElementById('btn-back-home');
  elements.titleText = document.getElementById('titlebar-brand-title');
  elements.titlebarHomeBrand = document.getElementById('titlebar-home-brand');
  elements.titlebarNavPill = document.getElementById('titlebar-nav-pill');
  elements.titlebarDeviceLogo = document.getElementById('titlebar-device-logo');
  elements.titlebarDeviceName = document.getElementById('titlebar-device-name');
  elements.zoomText = document.getElementById('zoom-text');
  elements.settingsBackdrop = document.getElementById('settings-backdrop');
  elements.settingsCard = document.getElementById('settings-card');
  elements.btnOpenSettings = document.getElementById('btn-open-settings');
  elements.btnCloseSettings = document.getElementById('btn-close-settings');
  elements.chkCloseTray = document.getElementById('chk-close-tray');
  elements.chkAutoLaunch = document.getElementById('chk-auto-launch');
  elements.btnSettingsClearCache = document.getElementById('btn-settings-clear-cache');
  elements.btnShortcutRecord = document.getElementById('btn-shortcut-record');
  elements.shortcutDisplayText = document.getElementById('shortcut-display-text');
  elements.btnShortcutReset = document.getElementById('btn-shortcut-reset');
  elements.confirmBackdrop = document.getElementById('confirm-backdrop');
  elements.confirmCard = document.getElementById('confirm-card');
  elements.btnConfirmCancel = document.getElementById('btn-confirm-cancel');
  elements.btnConfirmOk = document.getElementById('btn-confirm-ok');
  elements.btnCancelConfirmDot = document.getElementById('btn-cancel-confirm-dot');
}

// ==========================================================================
// Theme Management (System, Light, Dark)
// ==========================================================================
function getEffectiveTheme(setting) {
  if (setting === 'system') {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  return setting;
}

function applyTheme(setting, showNotification = false) {
  themeSetting = setting;
  localStorage.setItem('unicontrol-theme-setting', setting);
  const effective = getEffectiveTheme(setting);
  document.documentElement.setAttribute('data-theme', effective);

  // Update segmented control buttons
  ['system', 'light', 'dark'].forEach(val => {
    const btn = document.getElementById(`theme-opt-${val}`);
    if (btn) {
      if (val === setting) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
  });

  if (typeof updateThemeSegmentedThumb === 'function') {
    requestAnimationFrame(() => updateThemeSegmentedThumb(setting));
  }

  if (showNotification) {
    const textMap = { system: '跟随系统', light: '白色', dark: '暗色' };
    const iconMap = { system: '💻', light: '☀️', dark: '🌙' };
    showToast(`主题已设置为：${textMap[setting]}`, iconMap[setting]);
  }
}

// System theme listener
if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    if (themeSetting === 'system') {
      applyTheme('system', false);
    }
  });
}

// ==========================================================================
// Language Management & i18n
// ==========================================================================
let currentLang = localStorage.getItem('unicontrol-lang') || 'zh-CN';

const I18N = {
  'zh-CN': {
    brandMchose: '迈从 (MCHOSE)',
    brandEweadn: '前行者 (EWEADN)',
    backOverview: '返回概览',
    back: '返回',
    reload: '刷新',
    settingsTitle: 'UniControl 设置',
    settingTheme: '外观主题',
    themeSystem: '跟随系统',
    themeLight: '白色',
    themeDark: '暗色',
    settingLang: '界面语言',
    settingTray: '关闭主窗口时后台运行',
    settingAutoLaunch: '开机自启动',
    settingAutoLaunchSub: '系统启动时自动在后台托盘静默运行',
    settingShortcut: '后台呼出快捷键',
    settingCache: '清理驱动缓存',
    cleanNow: '立即清理',
    cancel: '取消',
    confirmTitle: '清理驱动缓存',
    confirmMsg: '确定要清理所有驱动临时缓存与会话存储吗？',
    toastTheme: '主题已设置为：',
    toastLang: '语言已切换为简体中文',
    toastCacheCleaned: '驱动缓存已清理完毕',
    toastResetZoom: '缩放比例已重置为 100%',
    toastBack: '已返回主界面',
    toastPrevPage: '后退上一页',
    toastNextPage: '前进下一页',
    webhidTag: 'WebHID 直通',
    mchoseFailTitle: '迈从驱动加载超时或响应异常',
    mchoseFailDesc: '可能由于网络波动或官方服务器策略拦截，点击下方按钮重试或切换官方备用接入点。',
    eweadnFailTitle: '前行者驱动加载超时或响应异常',
    eweadnFailDesc: '可能由于新版驱动服务器网络波动，点击下方按钮重试或切换官方备用服务节点。',
    btnReloadNode: '重新加载原节点',
    btnSwitchHome: '切换官方首页',
    oppoModeWeb: '云端工作台 (免安装)',
    oppoModeLocal: '本地客户端 (跨屏互联)',
    oppoCardWeb: '云端',
    oppoCardLocal: '本地',
    settingOppoPath: 'OPPO 客户端路径',
    settingOppoPathSub: '自定义唤起本地 OPPO 跨屏互联程序 (.exe)',
    settingFlydigiPath: '飞智空间站路径',
    settingFlydigiPathSub: '自定义唤起及嵌入飞智 PC 空间站程序 (.exe)',
    btnBrowse: '浏览',
    brandFlydigi: '飞智 (FLYDIGI)',
  },
  'en-US': {
    brandMchose: 'MCHOSE Hub',
    brandEweadn: 'EWEADN Hub',
    backOverview: 'Overview',
    back: 'Back',
    reload: 'Reload',
    settingsTitle: 'UniControl Settings',
    settingTheme: 'Appearance',
    themeSystem: 'System',
    themeLight: 'Light',
    themeDark: 'Dark',
    settingLang: 'Language',
    settingTray: 'Run in background on close',
    settingAutoLaunch: 'Launch at Startup',
    settingAutoLaunchSub: 'Silently start minimized in system tray when PC boots',
    settingShortcut: 'Global Wake Shortcut',
    settingCache: 'Clear Driver Cache',
    cleanNow: 'Clear Now',
    cancel: 'Cancel',
    confirmTitle: 'Clear Driver Cache',
    confirmMsg: 'Are you sure you want to clear driver cache and session storage?',
    toastTheme: 'Theme changed to: ',
    toastLang: 'Language switched to English',
    toastCacheCleaned: 'Driver cache cleared successfully',
    toastResetZoom: 'Zoom reset to 100%',
    toastBack: 'Returned to Home',
    toastPrevPage: 'Previous Page',
    toastNextPage: 'Next Page',
    webhidTag: 'WebHID Direct',
    mchoseFailTitle: 'MCHOSE Driver Loading Timeout',
    mchoseFailDesc: 'Due to network fluctuations, click below to retry or switch to alternate entry point.',
    eweadnFailTitle: 'EWEADN Driver Loading Timeout',
    eweadnFailDesc: 'Due to network fluctuations, click below to retry or switch to alternate entry point.',
    btnReloadNode: 'Reload Current',
    btnSwitchHome: 'Switch to Entry',
    oppoModeWeb: 'Cloud Hub (No Install)',
    oppoModeLocal: 'Local Client (PC Connect)',
    oppoCardWeb: 'Cloud',
    oppoCardLocal: 'Local',
    settingOppoPath: 'OPPO Client Path',
    settingOppoPathSub: 'Customize local OPPO Connect executable (.exe)',
    settingFlydigiPath: 'Flydigi Space Path',
    settingFlydigiPathSub: 'Customize local Flydigi PC Space executable (.exe)',
    btnBrowse: 'Browse',
    brandFlydigi: 'FLYDIGI Gamepad',
  }
};

function applyLanguage(lang, showNotification = false) {
  currentLang = lang;
  localStorage.setItem('unicontrol-lang', lang);

  const t = I18N[lang] || I18N['zh-CN'];

  // Update Segmented Control
  ['zh', 'en'].forEach(l => {
    const btn = document.getElementById(`lang-opt-${l}`);
    if (btn) {
      if ((l === 'zh' && lang === 'zh-CN') || (l === 'en' && lang === 'en-US')) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
  });

  if (typeof updateLangSegmentedThumb === 'function') {
    requestAnimationFrame(() => updateLangSegmentedThumb(lang));
  }

  // Update Settings UI text
  const lblTheme = document.querySelectorAll('.setting-item .setting-label')[0];
  if (lblTheme) lblTheme.textContent = t.settingTheme;
  const optSys = document.querySelector('#theme-opt-system span');
  if (optSys) optSys.textContent = t.themeSystem;
  const optLight = document.querySelector('#theme-opt-light span');
  if (optLight) optLight.textContent = t.themeLight;
  const optDark = document.querySelector('#theme-opt-dark span');
  if (optDark) optDark.textContent = t.themeDark;

  const lblLang = document.getElementById('lbl-setting-lang');
  if (lblLang) lblLang.textContent = t.settingLang;

  const titleSettings = document.querySelector('.settings-title-group h2');
  if (titleSettings) titleSettings.textContent = t.settingsTitle;

  const lblTray = document.querySelector('label[for="chk-close-tray"]')?.previousElementSibling || document.querySelectorAll('.setting-item .setting-label')[2];
  if (lblTray) lblTray.textContent = t.settingTray;

  const lblAutoLaunch = document.getElementById('lbl-setting-autolaunch');
  if (lblAutoLaunch) lblAutoLaunch.textContent = t.settingAutoLaunch;
  const sublblAutoLaunch = document.getElementById('sublbl-setting-autolaunch');
  if (sublblAutoLaunch) sublblAutoLaunch.textContent = t.settingAutoLaunchSub;

  const lblShortcut = document.getElementById('lbl-setting-shortcut');
  if (lblShortcut) lblShortcut.textContent = t.settingShortcut;

  const lblCache = document.getElementById('lbl-setting-cache');
  if (lblCache) lblCache.textContent = t.settingCache;

  const lblOppoPath = document.getElementById('lbl-setting-oppo-path');
  if (lblOppoPath) lblOppoPath.textContent = t.settingOppoPath;
  const sublblOppoPath = document.getElementById('sublbl-setting-oppo-path');
  if (sublblOppoPath) sublblOppoPath.textContent = t.settingOppoPathSub;

  const lblFlydigiPath = document.getElementById('lbl-setting-flydigi-path');
  if (lblFlydigiPath) lblFlydigiPath.textContent = t.settingFlydigiPath;
  const sublblFlydigiPath = document.getElementById('sublbl-setting-flydigi-path');
  if (sublblFlydigiPath) sublblFlydigiPath.textContent = t.settingFlydigiPathSub;

  document.querySelectorAll('.btn-path-browse span').forEach(el => el.textContent = t.btnBrowse);

  // Home card titles
  const cardMchoseTitle = document.querySelector('#card-mchose .card-title');
  if (cardMchoseTitle) cardMchoseTitle.textContent = t.brandMchose;
  const cardEweadnTitle = document.querySelector('#card-eweadn .card-title');
  if (cardEweadnTitle) cardEweadnTitle.textContent = t.brandEweadn;
  const cardFlydigiTitle = document.querySelector('#card-flydigi .card-title');
  if (cardFlydigiTitle) cardFlydigiTitle.textContent = t.brandFlydigi;

  // Titlebar device name if in device view
  if (elements.titlebarDeviceName && currentView !== 'home') {
    if (currentView === 'mchose') elements.titlebarDeviceName.textContent = lang === 'en-US' ? 'MCHOSE' : '迈从';
    else if (currentView === 'eweadn') elements.titlebarDeviceName.textContent = lang === 'en-US' ? 'EWEADN' : '前行者';
    else if (currentView === 'oppo') elements.titlebarDeviceName.textContent = 'OPPO';
  }

  // Fallback error overlays
  const mchoseFailT = document.querySelector('.i18n-mchose-fail-title');
  if (mchoseFailT) mchoseFailT.textContent = t.mchoseFailTitle;
  const mchoseFailD = document.querySelector('.i18n-mchose-fail-desc');
  if (mchoseFailD) mchoseFailD.textContent = t.mchoseFailDesc;
  const eweadnFailT = document.querySelector('.i18n-eweadn-fail-title');
  if (eweadnFailT) eweadnFailT.textContent = t.eweadnFailTitle;
  const eweadnFailD = document.querySelector('.i18n-eweadn-fail-desc');
  if (eweadnFailD) eweadnFailD.textContent = t.eweadnFailDesc;

  // Floating button labels
  document.querySelectorAll('.i18n-back').forEach(el => el.textContent = t.back);
  document.querySelectorAll('.i18n-reload').forEach(el => el.textContent = t.reload);

  // OPPO mode segmented control labels (in subview and on home card)
  const oppoWebLabel = document.querySelector('.i18n-oppo-mode-web');
  if (oppoWebLabel) oppoWebLabel.textContent = t.oppoModeWeb;
  const oppoLocalLabel = document.querySelector('.i18n-oppo-mode-local');
  if (oppoLocalLabel) oppoLocalLabel.textContent = t.oppoModeLocal;
  const oppoCardWeb = document.querySelector('.i18n-oppo-card-web');
  if (oppoCardWeb) oppoCardWeb.textContent = t.oppoCardWeb || (currentLang === 'en-US' ? 'Cloud' : '云端');
  const oppoCardLocal = document.querySelector('.i18n-oppo-card-local');
  if (oppoCardLocal) oppoCardLocal.textContent = t.oppoCardLocal || (currentLang === 'en-US' ? 'Local' : '本地');

  
  // Return to overview button
  const btnBackSpan = document.querySelector('.i18n-back') || document.querySelector('#btn-back-home span');
  if (btnBackSpan) btnBackSpan.textContent = t.backOverview || t.back || '返回';

  // Status pill
  const statusPill = document.querySelector('#status-pill span:last-child');
  if (statusPill) statusPill.textContent = t.webhidTag;

  // Level-3 Dialog
  const confirmTitle = document.querySelector('.confirm-title-text');
  if (confirmTitle) confirmTitle.textContent = t.confirmTitle;
  const confirmMsg = document.querySelector('.confirm-message-text');
  if (confirmMsg) confirmMsg.textContent = t.confirmMsg;
  const btnConfirmCancel = document.getElementById('btn-confirm-cancel');
  if (btnConfirmCancel) btnConfirmCancel.textContent = t.cancel;
  const btnConfirmOk = document.getElementById('btn-confirm-ok');
  if (btnConfirmOk) btnConfirmOk.textContent = t.cleanNow;

  if (showNotification) {
    showToast(t.toastLang, '🌐');
  }

  // Synchronize Language across all active Webviews
  syncWebviewLanguage(lang);
}

// Deep Language Synchronization for Embedded Drivers
function syncWebviewLanguage(lang) {
  const isEn = lang === 'en-US';

  // 1. MCHOSE Hub Language Switch
  if (webviews.mchose) {
    try {
      webviews.mchose.executeJavaScript(`
        try {
          const targetLang = '${isEn ? 'en' : 'zh'}';
          localStorage.setItem('lang', targetLang);
          localStorage.setItem('language', targetLang);
          localStorage.setItem('locale', targetLang);
          // Trigger Vue/React i18n switcher button if present on page
          const langBtn = Array.from(document.querySelectorAll('button, span, a, div')).find(el => {
            const txt = (el.textContent || '').trim().toLowerCase();
            return txt === '${isEn ? 'english' : '中文'}' || txt === '${isEn ? 'en' : 'zh'}';
          });
          if (langBtn) langBtn.click();
        } catch(e) {}
      `).catch(() => {});
    } catch(e) {}
  }

  // 2. EWEADN Hub Language Switch
  if (webviews.eweadn) {
    try {
      webviews.eweadn.executeJavaScript(`
        try {
          const targetLang = '${isEn ? 'en_US' : 'zh_CN'}';
          localStorage.setItem('language', targetLang);
          localStorage.setItem('lang', targetLang);
          localStorage.setItem('locale', targetLang);
          const langBtn = Array.from(document.querySelectorAll('button, span, a')).find(el => {
            const txt = (el.textContent || '').trim().toLowerCase();
            return txt === '${isEn ? 'en' : '中'}' || txt === '${isEn ? 'english' : '简体中文'}';
          });
          if (langBtn) langBtn.click();
        } catch(e) {}
      `).catch(() => {});
    } catch(e) {}
  }
}

// 【缺陷11修复】不在脚本顶层执行 DOM 操作，统一移入 DOMContentLoaded 内部。
// 此处只保留纯数据状态初始化（不涉及 DOM 访问）。
// applyTheme / applyLanguage 的首次调用已移至 DOMContentLoaded 中统一执行，避免重复。

// ==========================================================================
// Settings Modal
// ==========================================================================
function openSettings() {
  if (!elements.settingsBackdrop) return;
  elements.settingsBackdrop.classList.add('visible');
  const mainViewport = document.querySelector('.main-viewport');
  if (mainViewport) mainViewport.classList.add('modal-blurred');

  // 【缺陷8修复】用 transitionend 替代多个魔法数字 setTimeout，
  // 确保在 CSS 过渡真正完成后再计算 thumb 位置，兼容低端设备。
  const refreshThumbs = () => {
    if (typeof updateThemeSegmentedThumb === 'function') updateThemeSegmentedThumb();
    if (typeof updateLangSegmentedThumb === 'function') updateLangSegmentedThumb();
  };

  // 立即刷新一次（处理无动画情况）
  refreshThumbs();
  requestAnimationFrame(refreshThumbs);

  // 监听 backdrop 过渡结束后再刷新，避免过渡期间 offsetLeft 计算偏差
  const onTransitionEnd = () => {
    refreshThumbs();
    elements.settingsBackdrop.removeEventListener('transitionend', onTransitionEnd);
  };
  elements.settingsBackdrop.addEventListener('transitionend', onTransitionEnd);
}

function closeSettings() {
  if (!elements.settingsBackdrop) return;
  closeConfirmDialog();
  elements.settingsBackdrop.classList.remove('visible');
  const mainViewport = document.querySelector('.main-viewport');
  if (mainViewport) mainViewport.classList.remove('modal-blurred');
}

// ==========================================================================
// Level-3 Confirmation Modal (Apple Liquid Glass)
// ==========================================================================
function openConfirmDialog() {
  if (!elements.confirmBackdrop) return;
  elements.confirmBackdrop.classList.add('visible');
  if (elements.settingsCard) {
    elements.settingsCard.classList.add('confirm-blurred');
  }
}

function closeConfirmDialog() {
  if (!elements.confirmBackdrop) return;
  elements.confirmBackdrop.classList.remove('visible');
  if (elements.settingsCard) {
    elements.settingsCard.classList.remove('confirm-blurred');
  }
}

// Apple Liquid Glass Toast
// 【缺陷14修复】改用 textContent + createElement 替代 innerHTML，防止 XSS
function showToast(message, icon = '✨') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';

  const iconSpan = document.createElement('span');
  iconSpan.style.fontSize = '14px';
  iconSpan.textContent = icon; // 安全：textContent 不解析 HTML

  const msgSpan = document.createElement('span');
  msgSpan.textContent = message; // 安全：textContent 不解析 HTML

  toast.appendChild(iconSpan);
  toast.appendChild(document.createTextNode(' '));
  toast.appendChild(msgSpan);
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px) scale(0.96)';
    toast.style.transition = 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
    setTimeout(() => toast.remove(), 260);
  }, 2200);
}

// ==========================================================================
// OPPO Mode Switcher & Win32 Native Docking Controller
// ==========================================================================
let isOppoDockedInRenderer = false;

function updateOppoModeSegmentedThumb(mode = currentOppoMode) {
  const container = document.getElementById('oppo-mode-capsule');
  const thumb = document.getElementById('oppo-mode-slider-thumb');
  const activeBtn = document.getElementById(`oppo-mode-opt-${mode}`);
  if (!container || !thumb || !activeBtn) return;

  const leftOffset = Math.round(activeBtn.offsetLeft);
  thumb.style.transform = `translateX(${leftOffset}px)`;
  thumb.style.width = `${Math.round(activeBtn.offsetWidth)}px`;
  thumb.style.opacity = '1';
}

async function switchOppoMode(mode = 'web') {
  currentOppoMode = mode;
  const wv = webviews.oppo;
  const localDashboard = document.getElementById('oppo-local-dashboard');
  const btnWeb = document.getElementById('oppo-mode-opt-web');
  const btnLocal = document.getElementById('oppo-mode-opt-local');

  if (btnWeb && btnLocal) {
    if (mode === 'web') {
      btnWeb.classList.add('active');
      btnLocal.classList.remove('active');
    } else {
      btnLocal.classList.add('active');
      btnWeb.classList.remove('active');
    }
  }

  requestAnimationFrame(() => updateOppoModeSegmentedThumb(mode));

  if (mode === 'web') {
    if (isOppoDockedInRenderer) {
      await triggerOppoUndock(false);
    }
    if (localDashboard) localDashboard.style.display = 'none';
    if (wv) {
      wv.style.display = 'flex';
      if (!wv.getAttribute('src') && wv.getAttribute('data-src')) {
        wv.setAttribute('src', wv.getAttribute('data-src'));
      }
      adaptWebviewSize(wv);
    }
  } else {
    if (wv) wv.style.display = 'none';
    if (localDashboard) localDashboard.style.display = 'flex';
  }
}

async function triggerOppoDock() {
  const isEn = currentLang === 'en-US';
  const statusEl = document.getElementById('oppo-dock-status');
  const btnDock = document.getElementById('btn-dock-oppo');
  const btnUndock = document.getElementById('btn-undock-oppo');

  if (statusEl) statusEl.textContent = isEn ? 'Status: Detecting OPPO window...' : '状态：正在探测并嵌入 OPPO 窗口...';
  showToast(isEn ? 'Docking OPPO window...' : '正在嵌入 OPPO 跨屏互联窗口...', '📌');

  if (window.electronAPI && typeof window.electronAPI.dockOppoWindow === 'function') {
    const mainViewport = document.querySelector('.main-viewport');
    const rect = mainViewport ? mainViewport.getBoundingClientRect() : { x: 0, y: 46, width: 1440, height: 874 };
    const res = await window.electronAPI.dockOppoWindow({
      x: Math.round(rect.x || 0),
      y: Math.round(rect.y || 46),
      width: Math.round(rect.width || 1440),
      height: Math.round(rect.height || 874)
    });

    if (res && res.success) {
      isOppoDockedInRenderer = true;
      if (statusEl) statusEl.textContent = isEn ? 'Status: Docked successfully' : '状态：已成功嵌入当前视口';
      if (btnDock) btnDock.style.display = 'none';
      if (btnUndock) btnUndock.style.display = 'inline-flex';
      showToast(isEn ? 'OPPO window docked' : 'OPPO 跨屏互联已嵌入中控', '✅');
    } else {
      isOppoDockedInRenderer = false;
      if (statusEl) statusEl.textContent = isEn ? 'Status: OPPO window not found' : '状态：未检测到运行中的 OPPO 窗口';
      showToast(isEn ? 'Could not find running OPPO window. Please launch it first.' : '未检测到运行中的 OPPO 客户端，请先唤起程序', '⚠️');
    }
  }
}

async function triggerOppoUndock(showNotification = true) {
  const isEn = currentLang === 'en-US';
  const statusEl = document.getElementById('oppo-dock-status');
  const btnDock = document.getElementById('btn-dock-oppo');
  const btnUndock = document.getElementById('btn-undock-oppo');

  if (window.electronAPI && typeof window.electronAPI.undockOppoWindow === 'function') {
    try {
      await window.electronAPI.undockOppoWindow();
    } catch (_) {}
  }

  isOppoDockedInRenderer = false;
  if (statusEl) statusEl.textContent = isEn ? 'Status: Ready / Undocked' : '状态：就绪 / 未嵌入';
  if (btnDock) btnDock.style.display = 'inline-flex';
  if (btnUndock) btnUndock.style.display = 'none';

  if (showNotification) {
    showToast(isEn ? 'OPPO window restored' : '已还原 OPPO 独立窗口', '🔄');
  }
}

// Open Device View with smooth animation
function openDevice(brand, mode) {
  if (!views[brand]) return;
  currentView = brand;

  // If opening OPPO, apply specified mode or retain current mode
  if (brand === 'oppo' && typeof switchOppoMode === 'function') {
    switchOppoMode(mode || currentOppoMode || 'web');
  }

  // If opening FLYDIGI, apply specified mode or retain current mode
  
  // Hide any existing fallback errors
  if (fallbacks[brand]) fallbacks[brand].classList.remove('visible');

  // Instant Keep-Alive View Activation with fluid Apple animation

  Object.keys(views).forEach(key => {
    if (key === brand) {
      views[key].classList.add('active');
    } else {
      views[key].classList.remove('active');
    }
  });

  // Update Titlebar: Switch from Home Brand to Unified Nav Pill with Brand Logo
  if (elements.titlebarHomeBrand) elements.titlebarHomeBrand.style.display = 'none';
  if (elements.titlebarNavPill) elements.titlebarNavPill.classList.add('visible');

  if (brand === 'mchose') {
    if (elements.titlebarDeviceLogo) {
      elements.titlebarDeviceLogo.src = 'assets/mchose-logo.png';
      elements.titlebarDeviceLogo.style.display = 'inline-block';
    }
    if (elements.titlebarDeviceName) elements.titlebarDeviceName.textContent = currentLang === 'en-US' ? 'MCHOSE' : '迈从';
  } else if (brand === 'eweadn') {
    if (elements.titlebarDeviceLogo) {
      elements.titlebarDeviceLogo.src = 'assets/eweadn-logo.png';
      elements.titlebarDeviceLogo.style.display = 'inline-block';
    }
    if (elements.titlebarDeviceName) elements.titlebarDeviceName.textContent = currentLang === 'en-US' ? 'EWEADN' : '前行者';
  } else if (brand === 'oppo') {
    if (elements.titlebarDeviceLogo) {
      elements.titlebarDeviceLogo.src = 'assets/oppo-logo.png';
      elements.titlebarDeviceLogo.style.display = 'inline-block';
    }
    if (elements.titlebarDeviceName) elements.titlebarDeviceName.textContent = 'OPPO';
  }

  const oppoWakeWrap = document.getElementById('oppo-titlebar-wake-wrap');
  if (oppoWakeWrap) {
    oppoWakeWrap.style.display = brand === 'oppo' ? 'flex' : 'none';
  }


  const wv = webviews[brand];
  if (wv) {
    // Lazy load webview src upon user entrance
    if (!wv.getAttribute('src') && wv.getAttribute('data-src')) {
      wv.setAttribute('src', wv.getAttribute('data-src'));
    }
    adaptWebviewSize(wv);
  }
}

let lastGlobalNavTime = 0;
const GLOBAL_NAV_DEBOUNCE_MS = 200;

// Smart Global Back Navigation (Used by Back Button, Mouse Button 4, and Escape)
function handleGlobalNavigateBack() {
  const now = Date.now();
  if (now - lastGlobalNavTime < GLOBAL_NAV_DEBOUNCE_MS) {
    return false;
  }
  lastGlobalNavTime = now;
  // 1. If Level-3 confirmation dialog is open, close only Level-3 to smoothly return to Level-2 Settings
  if (elements.confirmBackdrop && elements.confirmBackdrop.classList.contains('visible')) {
    closeConfirmDialog();
    return true;
  }

  // 2. If Level-2 settings modal is open, close it to return to main/current view
  if (elements.settingsBackdrop && elements.settingsBackdrop.classList.contains('visible')) {
    closeSettings();
    return true;
  }

  // 3. If in device driver view, check if webview can go back internally
  if (currentView !== 'home') {
    // If in OPPO local dashboard mode, webview is not active, directly back to home
    if (currentView === 'oppo' && currentOppoMode === 'local') {
      backToHome();
      // 【缺陷7修复】使用 i18n 系统替代硬编码中文
      showToast(I18N[currentLang]?.toastBack || '已返回主界面', '🏠');
      return true;
    }

    const wv = webviews[currentView];
    try {
      if (wv && typeof wv.canGoBack === 'function' && wv.canGoBack()) {
        wv.goBack();
        // 【缺陷7修复】使用 i18n key
        showToast(I18N[currentLang]?.toastPrevPage || '后退上一页', '⬅️');
        return true;
      }
    } catch (e) {
      console.warn('Webview canGoBack check error:', e);
    }
    // Otherwise return to main home view (including during white-screen loading)
    backToHome();
    // 【缺陷7修复】使用 i18n key
    showToast(I18N[currentLang]?.toastBack || '已返回主界面', '🏠');
    return true;
  }

  return false;
}

// Return to Home Selection
// 【缺陷6修复】如果 OPPO 处于本地 Dock 模式，返回前先执行 undock，防止 Win32 窗口残留叠加
async function backToHome() {
  // 若当前是 OPPO 本地模式且已 Dock，先异步 undock 释放 Win32 窗口
  if (currentView === 'oppo') {
    try {
      await triggerOppoUndock(false);
    } catch (e) {
      console.warn('[backToHome] triggerOppoUndock error:', e);
    }
  }

  currentView = 'home';

  // Hide OPPO Titlebar Wake Wrap
  const oppoWakeWrap = document.getElementById('oppo-titlebar-wake-wrap');
  if (oppoWakeWrap) oppoWakeWrap.style.display = 'none';

  Object.keys(views).forEach(key => {
    if (key === 'home') {
      views[key].classList.add('active');
    } else {
      views[key].classList.remove('active');
    }
  });

  // Restore Titlebar to Home State
  if (elements.titlebarNavPill) elements.titlebarNavPill.classList.remove('visible');
  if (elements.titlebarHomeBrand) elements.titlebarHomeBrand.style.display = 'flex';
  if (elements.titleText) elements.titleText.textContent = 'UniControl';

  // 【缺陷修复】重新唤醒流体光幕 Canvas 动画循环，避免返回主页后背景冻结
  if (typeof window._canvasStartRender === 'function') {
    requestAnimationFrame(() => window._canvasStartRender());
  }
}

// Retry webview loader with alternative or fallback URL
function retryWebview(brand, targetUrl) {
  const wv = webviews[brand];
  const fb = fallbacks[brand];
  if (fb) fb.classList.remove('visible');
  if (wv) {
    if (targetUrl) {
      wv.src = targetUrl;
    } else {
      wv.reload();
    }
    showToast('正在重新加载驱动...', '🔄');
  }
}

// Screen and Viewport Adaptation Helper
function adaptWebviewSize(wv) {
  if (!wv) return;
  try {
    const css = `
      html, body {
        width: 100% !important;
        height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow-x: hidden !important;
      }
      #app, #root {
        width: 100% !important;
        min-height: 100% !important;
      }
      ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      ::-webkit-scrollbar-thumb {
        background: rgba(150, 150, 160, 0.3);
        border-radius: 3px;
      }
    `;
    wv.insertCSS(css);
  } catch (e) {
    // console.warn('adaptWebviewSize notice:', e);
  }
}

// Reload Current Device View
function reloadCurrentView() {
  const isEn = currentLang === 'en-US';
  if (currentView === 'mchose' && webviews.mchose) {
    webviews.mchose.reload();
    showToast(isEn ? 'MCHOSE Hub reloaded' : '迈从驱动已刷新', '🔄');
  } else if (currentView === 'eweadn' && webviews.eweadn) {
    webviews.eweadn.reload();
    showToast(isEn ? 'EWEADN Hub reloaded' : '前行者驱动已刷新', '🔄');
  } else if (currentView === 'oppo' && webviews.oppo) {
    webviews.oppo.reload();
    showToast(isEn ? 'OPPO Connect reloaded' : 'OPPO 随身工作台已刷新', '🔄');
  } else {
    showToast(isEn ? 'Overview reloaded' : '概览界面已刷新', '🔄');
  }
}

// 【缺陷10修复】所有全局 window 挂载统一集中在此处，确保函数定义完成后再挂载，
// 避免 HTML inline onclick 在脚本未完全解析时调用导致 undefined 错误。
// 注意：这些赋值必须在所有函数定义之后执行（文件底部）。
window.openDevice = openDevice;
window.handleGlobalNavigateBack = handleGlobalNavigateBack;
window.reloadCurrentView = reloadCurrentView;
window.retryWebview = retryWebview;
window.triggerOppoLaunch = triggerOppoLaunch;
window.triggerFlydigiLaunch = triggerFlydigiLaunch;
window.switchOppoMode = switchOppoMode;
window.triggerOppoDock = triggerOppoDock;
window.triggerOppoUndock = triggerOppoUndock;

// Zoom Management (Adapts both Home Overview & Device Webviews)
function applyZoom(delta) {
  if (delta === 0) {
    currentZoom = 1.0;
  } else {
    currentZoom = Math.min(Math.max(currentZoom + delta, 0.6), 1.6);
  }
  const zoomPercent = Math.round(currentZoom * 100) + '%';
  if (elements.zoomText) elements.zoomText.textContent = zoomPercent;

  // 1. Scale Home Overview Viewport
  const homeView = document.getElementById('view-home');
  if (homeView) {
    if (Math.abs(currentZoom - 1.0) < 0.001) {
      homeView.style.zoom = '';
      homeView.style.transform = '';
    } else {
      homeView.style.zoom = currentZoom;
    }
  }

  // 2. Scale Device Webviews
  Object.values(webviews).forEach(wv => {
    if (wv && typeof wv.setZoomFactor === 'function') {
      try {
        wv.setZoomFactor(currentZoom);
      } catch (e) {}
    }
  });
}

// Interactive Cursor Specular Tracking
function initLiquidSheen() {
  const cards = document.querySelectorAll('.device-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--mouse-x', `${x}%`);
      card.style.setProperty('--mouse-y', `${y}%`);
    });
  });
}

// ==========================================================================
// Dynamic Fluid Canvas Aurora Engine (Apple Liquid Glow)
// ==========================================================================
function initDynamicFluidBackground() {
  const canvas = document.getElementById('ambient-dynamic-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  // Dynamic Fluid Blobs with sinusoidal motion
  const blobs = [
    { x: width * 0.25, y: height * 0.2, vx: 0.35, vy: 0.25, radius: 240, color: 'rgba(0, 180, 255, 0.45)', phase: 0 },
    { x: width * 0.75, y: height * 0.8, vx: -0.3, vy: -0.35, radius: 260, color: 'rgba(168, 85, 247, 0.45)', phase: 2 },
    { x: width * 0.5, y: height * 0.45, vx: -0.25, vy: 0.3, radius: 200, color: 'rgba(0, 110, 255, 0.35)', phase: 4 },
    { x: width * 0.85, y: height * 0.25, vx: 0.2, vy: -0.2, radius: 180, color: 'rgba(192, 132, 252, 0.35)', phase: 1 },
    { x: width * 0.15, y: height * 0.75, vx: 0.3, vy: -0.25, radius: 220, color: 'rgba(56, 189, 248, 0.35)', phase: 3 },
  ];

  let mouseX = width / 2;
  let mouseY = height / 2;
  let targetMouseX = width / 2;
  let targetMouseY = height / 2;

  window.addEventListener('mousemove', (e) => {
    targetMouseX = e.clientX;
    targetMouseY = e.clientY;
  });

  let t = 0;
  // 【缺陷13修复】使用 rafId 控制动画帧，在不需要渲染时 cancel 而不是继续空转
  let rafId = null;
  let isWindowFocused = document.hasFocus ? document.hasFocus() : true;

  window.addEventListener('focus', () => {
    isWindowFocused = true;
    if (currentView === 'home' && !document.hidden) {
      startRender();
    }
  });

  window.addEventListener('blur', () => {
    isWindowFocused = false;
  });

  function render() {
    // Only render canvas animation when on home overview, document is visible and window is focused
    if (currentView !== 'home' || document.hidden || !isWindowFocused) {
      rafId = null; // 标记为已停止，等待唤醒
      return;
    }

    t += 0.015;
    // Smooth mouse lerp
    mouseX += (targetMouseX - mouseX) * 0.04;
    mouseY += (targetMouseY - mouseY) * 0.04;

    ctx.clearRect(0, 0, width, height);

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';

    // Color definitions per theme
    const blobColorsDark = [
      'rgba(0, 180, 255, 0.42)',
      'rgba(168, 85, 247, 0.40)',
      'rgba(0, 110, 255, 0.32)',
      'rgba(192, 132, 252, 0.30)',
      'rgba(56, 189, 248, 0.32)'
    ];

    // Apple Light Theme: ultra-soft mist tints (Apple Studio/macOS Sequoia style, zero noise/grain)
    const blobColorsLight = [
      'rgba(235, 242, 255, 0.40)',
      'rgba(242, 238, 255, 0.35)',
      'rgba(230, 245, 255, 0.35)',
      'rgba(248, 240, 255, 0.30)',
      'rgba(232, 244, 252, 0.35)'
    ];

    blobs.forEach((b, i) => {
      // Natural organic floating motion
      b.x += b.vx + Math.sin(t + b.phase) * 0.7;
      b.y += b.vy + Math.cos(t + b.phase * 1.3) * 0.7;

      // Mouse subtle gravitational wave
      const dx = mouseX - b.x;
      const dy = mouseY - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 400 && dist > 1) {
        b.x += (dx / dist) * 0.45;
        b.y += (dy / dist) * 0.45;
      }

      // Boundary bouncing
      if (b.x < -b.radius) b.x = width + b.radius;
      if (b.x > width + b.radius) b.x = -b.radius;
      if (b.y < -b.radius) b.y = height + b.radius;
      if (b.y > height + b.radius) b.y = -b.radius;

      // Radial gradient splash tailored to theme
      const currentRadius = (isLight ? b.radius * 1.6 : b.radius) + Math.sin(t * 1.5 + i) * 20;
      const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, currentRadius);
      const baseColor = isLight ? blobColorsLight[i % blobColorsLight.length] : blobColorsDark[i % blobColorsDark.length];
      grad.addColorStop(0, baseColor);
      grad.addColorStop(0.6, baseColor.replace(/[\d\.]+\)$/, isLight ? '0.08)' : '0.10)'));
      grad.addColorStop(1, 'transparent');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(b.x, b.y, currentRadius, 0, Math.PI * 2);
      ctx.fill();
    });

    rafId = requestAnimationFrame(render);
  }

  function startRender() {
    if (!rafId) {
      rafId = requestAnimationFrame(render);
    }
  }

  // 页面可见性变化时恢复动画
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && currentView === 'home') {
      startRender();
    }
  });

  startRender();

  // 暴露 startRender 供 openDevice / backToHome 调用
  window._canvasStartRender = startRender;
}

// Setup Event Listeners
window.addEventListener('DOMContentLoaded', () => {
  initDOMElements();
  applyTheme(themeSetting, false);
  applyLanguage(currentLang, false);

  // Settings Dialog Open/Close
  elements.btnOpenSettings?.addEventListener('click', openSettings);
  elements.btnCloseSettings?.addEventListener('click', closeSettings);
  elements.settingsBackdrop?.addEventListener('click', (e) => {
    if (e.target === elements.settingsBackdrop) {
      closeSettings();
    }
  });

  // Settings Segmented Control for Theme (system, light, dark)
  ['system', 'light', 'dark'].forEach(val => {
    document.getElementById(`theme-opt-${val}`)?.addEventListener('click', () => {
      applyTheme(val, true);
    });
  });

  // Settings Segmented Control for Language (zh, en)
  ['zh', 'en'].forEach(val => {
    document.getElementById(`lang-opt-${val}`)?.addEventListener('click', () => {
      applyLanguage(val === 'zh' ? 'zh-CN' : 'en-US', true);
    });
  });

  // Close to Tray Switch
  const savedCloseToTray = localStorage.getItem('unicontrol-close-to-tray');
  const closeToTrayVal = savedCloseToTray === null ? true : savedCloseToTray === 'true';
  if (elements.chkCloseTray) {
    elements.chkCloseTray.checked = closeToTrayVal;
    if (window.electronAPI && typeof window.electronAPI.setCloseToTray === 'function') {
      window.electronAPI.setCloseToTray(closeToTrayVal);
    }
    elements.chkCloseTray.addEventListener('change', (e) => {
      const isEnabled = e.target.checked;
      localStorage.setItem('unicontrol-close-to-tray', isEnabled);
      if (window.electronAPI && typeof window.electronAPI.setCloseToTray === 'function') {
        window.electronAPI.setCloseToTray(isEnabled);
      }
      showToast(isEnabled ? '已开启：关闭窗口后在托盘运行' : '已关闭：关闭窗口将直接退出程序', '⚙️');
    });
  }

  // Auto Launch at System Startup Switch
  if (elements.chkAutoLaunch) {
    if (window.electronAPI && typeof window.electronAPI.getAutoLaunch === 'function') {
      window.electronAPI.getAutoLaunch().then(enabled => {
        elements.chkAutoLaunch.checked = !!enabled;
      });
    }
    elements.chkAutoLaunch.addEventListener('change', async (e) => {
      const isEnabled = e.target.checked;
      if (window.electronAPI && typeof window.electronAPI.setAutoLaunch === 'function') {
        const res = await window.electronAPI.setAutoLaunch(isEnabled);
        if (res && res.success) {
          showToast(isEnabled ? '已开启开机自启动（后台静默托盘）' : '已取消开机自启动', '🚀');
        } else {
          elements.chkAutoLaunch.checked = !isEnabled;
          showToast((currentLang === 'en-US' ? 'Failed to update auto-launch: ' : '修改开机自启动失败：') + (res?.error || '权限不足'), '⚠️');
        }
      }
    });
  }

  // Level-3 Dialog: Clear cache from settings
  elements.btnSettingsClearCache?.addEventListener('click', () => {
    openConfirmDialog();
  });

  elements.btnConfirmCancel?.addEventListener('click', () => {
    closeConfirmDialog();
  });

  elements.btnCancelConfirmDot?.addEventListener('click', () => {
    closeConfirmDialog();
  });

  elements.confirmBackdrop?.addEventListener('click', (e) => {
    if (e.target === elements.confirmBackdrop) {
      closeConfirmDialog();
    }
  });

  elements.btnConfirmOk?.addEventListener('click', () => {
    closeConfirmDialog();
    if (window.electronAPI) {
      window.electronAPI.clearCache();
    }
  });

  // ==========================================================================
  // Global Background Wake Shortcut Setting & Key Recorder
  // ==========================================================================
  const DEFAULT_SHORTCUT = 'CommandOrControl+Alt+U';
  let savedShortcut = localStorage.getItem('unicontrol-wake-shortcut') || DEFAULT_SHORTCUT;

  function formatAcceleratorForDisplay(acc) {
    if (!acc || acc === 'None') return '无快捷键';
    return acc
      .replace(/CommandOrControl/g, 'Ctrl')
      .replace(/Control/g, 'Ctrl')
      .replace(/Alt/g, 'Alt')
      .replace(/Shift/g, 'Shift')
      .replace(/\+/g, ' + ');
  }

  function updateShortcutDisplay(acc) {
    if (elements.shortcutDisplayText) {
      elements.shortcutDisplayText.textContent = formatAcceleratorForDisplay(acc);
    }
  }

  // Initial load
  updateShortcutDisplay(savedShortcut);
  if (window.electronAPI && typeof window.electronAPI.setGlobalShortcut === 'function') {
    window.electronAPI.setGlobalShortcut(savedShortcut);
  }

  let isRecordingShortcut = false;

  elements.btnShortcutRecord?.addEventListener('click', () => {
    if (isRecordingShortcut) return;
    isRecordingShortcut = true;
    elements.btnShortcutRecord.classList.add('recording');
    if (elements.shortcutDisplayText) elements.shortcutDisplayText.textContent = '请按下快捷键...';
  });

  window.addEventListener('keydown', async (e) => {
    if (!isRecordingShortcut) return;

    // Ignore single modifier keys
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    // If Escape is pressed during recording, cancel recording
    if (e.key === 'Escape') {
      isRecordingShortcut = false;
      elements.btnShortcutRecord.classList.remove('recording');
      updateShortcutDisplay(savedShortcut);
      return;
    }

    // Build accelerator string
    const modifiers = [];
    if (e.ctrlKey) modifiers.push('CommandOrControl');
    if (e.altKey) modifiers.push('Alt');
    if (e.shiftKey) modifiers.push('Shift');

    // Need at least one modifier key (Ctrl, Alt, or Shift)
    if (modifiers.length === 0) {
      showToast('快捷键必须包含 Ctrl、Alt 或 Shift 组合键', '⚠️');
      return;
    }

    let keyPart = e.key.toUpperCase();
    if (keyPart === ' ') keyPart = 'Space';
    if (keyPart.length === 1 && keyPart >= 'A' && keyPart <= 'Z') {
      // standard letter
    } else if (keyPart.startsWith('F') && !isNaN(keyPart.slice(1))) {
      // function keys F1-F12
    } else if (/^[0-9]$/.test(keyPart)) {
      // numbers
    }

    const newAccelerator = `${modifiers.join('+')}+${keyPart}`;

    if (window.electronAPI && typeof window.electronAPI.setGlobalShortcut === 'function') {
      const res = await window.electronAPI.setGlobalShortcut(newAccelerator);
      if (res && res.success) {
        savedShortcut = newAccelerator;
        localStorage.setItem('unicontrol-wake-shortcut', newAccelerator);
        updateShortcutDisplay(newAccelerator);
        showToast(`呼出快捷键已更新为：${formatAcceleratorForDisplay(newAccelerator)}`, '⌨️');
      } else {
        updateShortcutDisplay(savedShortcut);
        showToast(res.error || '快捷键设置失败，可能被系统占用', '❌');
      }
    }

    isRecordingShortcut = false;
    elements.btnShortcutRecord.classList.remove('recording');
  }, true);

  // Reset Shortcut to Default
  elements.btnShortcutReset?.addEventListener('click', async () => {
    if (window.electronAPI && typeof window.electronAPI.setGlobalShortcut === 'function') {
      const res = await window.electronAPI.setGlobalShortcut(DEFAULT_SHORTCUT);
      if (res && res.success) {
        savedShortcut = DEFAULT_SHORTCUT;
        localStorage.setItem('unicontrol-wake-shortcut', DEFAULT_SHORTCUT);
        updateShortcutDisplay(DEFAULT_SHORTCUT);
        showToast('快捷键已恢复为默认：Ctrl + Alt + U', '🔄');
      }
    }
  });

  // Custom Local Paths (OPPO Connect & Flydigi Space)
  const inputOppoPath = document.getElementById('input-oppo-path');
  const btnBrowseOppoPath = document.getElementById('btn-browse-oppo-path');
  const btnResetOppoPath = document.getElementById('btn-reset-oppo-path');

  const inputFlydigiPath = document.getElementById('input-flydigi-path');
  const btnBrowseFlydigiPath = document.getElementById('btn-browse-flydigi-path');
  const btnResetFlydigiPath = document.getElementById('btn-reset-flydigi-path');

  if (inputOppoPath) {
    inputOppoPath.value = localStorage.getItem('unicontrol-oppo-custom-path') || '';
    inputOppoPath.addEventListener('change', () => {
      const val = inputOppoPath.value.trim();
      localStorage.setItem('unicontrol-oppo-custom-path', val);
      showToast(val ? 'OPPO 客户端路径已保存' : '已清除自定义路径，使用自动探测', '💾');
    });
  }

  btnBrowseOppoPath?.addEventListener('click', async () => {
    if (window.electronAPI && typeof window.electronAPI.selectExecutablePath === 'function') {
      const res = await window.electronAPI.selectExecutablePath('选择 OPPO 跨屏互联程序 (O+Connect.exe)');
      if (res && !res.canceled && res.filePath) {
        inputOppoPath.value = res.filePath;
        localStorage.setItem('unicontrol-oppo-custom-path', res.filePath);
        showToast('已更新 OPPO 客户端路径', '✅');
      }
    }
  });

  btnResetOppoPath?.addEventListener('click', () => {
    if (inputOppoPath) inputOppoPath.value = '';
    localStorage.removeItem('unicontrol-oppo-custom-path');
    showToast('OPPO 路径已重置为自动探测', '🔄');
  });

  if (inputFlydigiPath) {
    inputFlydigiPath.value = localStorage.getItem('unicontrol-flydigi-custom-path') || '';
    inputFlydigiPath.addEventListener('change', () => {
      const val = inputFlydigiPath.value.trim();
      localStorage.setItem('unicontrol-flydigi-custom-path', val);
      showToast(val ? '飞智空间站路径已保存' : '已清除自定义路径，使用自动探测', '💾');
    });
  }

  btnBrowseFlydigiPath?.addEventListener('click', async () => {
    if (window.electronAPI && typeof window.electronAPI.selectExecutablePath === 'function') {
      const res = await window.electronAPI.selectExecutablePath('选择飞智 PC 空间站程序 (FlydigiPcSpace.exe)');
      if (res && !res.canceled && res.filePath) {
        inputFlydigiPath.value = res.filePath;
        localStorage.setItem('unicontrol-flydigi-custom-path', res.filePath);
        showToast('已更新飞智空间站路径', '✅');
      }
    }
  });

  btnResetFlydigiPath?.addEventListener('click', () => {
    if (inputFlydigiPath) inputFlydigiPath.value = '';
    localStorage.removeItem('unicontrol-flydigi-custom-path');
    showToast('飞智空间站路径已重置为自动探测', '🔄');
  });

  // Apple Three-Color Dots Controls
  if (window.electronAPI) {
    document.getElementById('btn-win-close')?.addEventListener('click', (e) => {
      e.stopPropagation();
      window.electronAPI.close();
    });

    document.getElementById('btn-win-min')?.addEventListener('click', (e) => {
      e.stopPropagation();
      window.electronAPI.minimize();
    });

    document.getElementById('btn-win-max')?.addEventListener('click', (e) => {
      e.stopPropagation();
      window.electronAPI.maximize();
    });

    document.getElementById('btn-devtools')?.addEventListener('click', () => {
      window.electronAPI.toggleDevTools();
    });

    window.electronAPI.onCacheCleared(() => {
      showToast('驱动缓存已清理完毕', '🧹');
      reloadCurrentView();
    });

    window.electronAPI.onDeviceAdded((device) => {
      showToast(`检测到新外设: ${device.name}`, '🔌');
    });

    window.electronAPI.onDeviceRemoved((device) => {
      showToast(`外设已断开: ${device.name}`, '🔌');
    });

    // Tray Menu Direct Device Routing
    window.electronAPI.onSwitchView?.((target) => {
      if (target === 'home') {
        backToHome();
      } else if (target === 'flydigi') {
        triggerFlydigiLaunch();
      } else if (['mchose', 'eweadn', 'oppo'].includes(target)) {
        openDevice(target);
      }
    });

    // Sleep Resume Sync
    window.electronAPI.onSystemResume?.(() => {
      if (currentView !== 'home') {
        const wv = webviews[currentView];
        if (wv) adaptWebviewSize(wv);
      }
      if (typeof window._canvasStartRender === 'function') {
        window._canvasStartRender();
      }
    });
  }

  // Network Connectivity Awareness
  window.addEventListener('online', () => {
    showToast(currentLang === 'en-US' ? 'Network reconnected' : '网络已重新连接', '🌐');
  });

  window.addEventListener('offline', () => {
    showToast(currentLang === 'en-US' ? 'Network connection offline' : '网络连接已断开，请检查网络', '⚠️');
  });

  // Top action buttons
  elements.btnBack?.addEventListener('click', handleGlobalNavigateBack);
  document.getElementById('btn-reload')?.addEventListener('click', reloadCurrentView);
  document.getElementById('btn-zoom-in')?.addEventListener('click', () => applyZoom(0.1));
  document.getElementById('btn-zoom-out')?.addEventListener('click', () => applyZoom(-0.1));
  elements.zoomText?.addEventListener('click', () => {
    applyZoom(0);
    showToast('缩放比例已重置为 100%', '🔍');
  });

  // Mouse Wheel Zoom Adjustment on Zoom Controls (hover zoom)
  const zoomControlGroup = document.getElementById('zoom-control-group') || elements.zoomText;
  if (zoomControlGroup) {
    zoomControlGroup.addEventListener('wheel', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const step = e.deltaY < 0 ? 0.05 : -0.05;
      applyZoom(step);
    }, { passive: false });
  }

  // Global Ctrl + Mouse Wheel Zoom (Full Window Support)
  window.addEventListener('wheel', (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      const step = e.deltaY < 0 ? 0.05 : -0.05;
      applyZoom(step);
    }
  }, { passive: false });

  // Webview lifecycle and robust failure handling
  ['mchose', 'eweadn', 'oppo'].forEach(brand => {
    const wv = webviews[brand];
    const bar = progressBars[brand];
    const fb = fallbacks[brand];

    if (wv) {
      wv.addEventListener('did-start-loading', () => {
        if (fb) fb.classList.remove('visible');
        if (bar) {
          bar.style.opacity = '1';
          bar.style.width = '35%';
        }
      });

      const injectEarlyMouseHook = () => {
        try {
          wv.executeJavaScript(`
            if (!window.__unicontrol_mouse_hook) {
              window.__unicontrol_mouse_hook = true;
              ['mouseup', 'pointerup', 'auxclick'].forEach(evt => {
                window.addEventListener(evt, (e) => {
                  if (e.button === 3) {
                    e.preventDefault();
                    console.log('[UniControl Bridge] side-back-click');
                  }
                }, true);
              });

              window.addEventListener('wheel', (e) => {
                if (e.ctrlKey || e.metaKey) {
                  e.preventDefault();
                  const dir = e.deltaY < 0 ? 'in' : 'out';
                  console.log('[UniControl Bridge] ctrl-wheel-zoom:' + dir);
                }
              }, { passive: false });
            }
          `).catch(() => {});
        } catch (e) {}
      };

      wv.addEventListener('load-commit', injectEarlyMouseHook);
      wv.addEventListener('did-start-navigation', injectEarlyMouseHook);
      wv.addEventListener('did-navigate', injectEarlyMouseHook);

      wv.addEventListener('dom-ready', () => {
        if (bar) {
          bar.style.width = '85%';
          setTimeout(() => {
            bar.style.width = '100%';
            bar.style.opacity = '0';
          }, 300);
        }
        adaptWebviewSize(wv);
        injectEarlyMouseHook();
      });

      // Listen to console-message from webview to capture side back click and ctrl-wheel-zoom
      wv.addEventListener('console-message', (e) => {
        if (!e.message) return;
        if (e.message.includes('[UniControl Bridge] side-back-click')) {
          handleGlobalNavigateBack();
        } else if (e.message.includes('[UniControl Bridge] ctrl-wheel-zoom:in')) {
          applyZoom(0.05);
        } else if (e.message.includes('[UniControl Bridge] ctrl-wheel-zoom:out')) {
          applyZoom(-0.05);
        }
      });

      wv.addEventListener('did-stop-loading', () => {
        if (bar) {
          bar.style.width = '100%';
          bar.style.opacity = '0';
        }
        adaptWebviewSize(wv);
      });

      // Handle loading failure
      wv.addEventListener('did-fail-load', (e) => {
        if (e.errorCode !== -3 && e.errorCode !== 0) {
          console.warn(`Webview ${brand} load error:`, e.errorCode, e.errorDescription);
          if (bar) bar.style.opacity = '0';
          if (fb) fb.classList.add('visible');
        }
      });

      // Handle render process crash
      wv.addEventListener('render-process-gone', () => {
        if (fb) fb.classList.add('visible');
      });
    }
  });

  initLiquidSheen();
  initDynamicFluidBackground();
  initAppleTooltips();
  initSettingsSegmentedDragControls();

  // Mouse Side Button (Button 3 = Back / Button 4 = Forward) on Main Window
  // 【缺陷修复】增加 250ms 防抖锁与精准事件过滤，防止 pointerup/mouseup/auxclick 连环触发导致一次物理点击执行 3 次后退
  let lastSideBackTime = 0;
  let lastSideForwardTime = 0;
  const SIDE_KEY_DEBOUNCE_MS = 250;

  ['pointerdown', 'mousedown', 'mouseup', 'pointerup', 'auxclick'].forEach(evtName => {
    window.addEventListener(evtName, (e) => {
      if (e.button === 3) {
        // Mouse 4th button (Back side button)
        e.preventDefault();
        e.stopPropagation();
        if (evtName === 'pointerup' || evtName === 'auxclick') {
          const now = Date.now();
          if (now - lastSideBackTime > SIDE_KEY_DEBOUNCE_MS) {
            lastSideBackTime = now;
            handleGlobalNavigateBack();
          }
        }
      } else if (e.button === 4) {
        // Mouse 5th button (Forward side button)
        if (evtName === 'pointerup' || evtName === 'auxclick') {
          const now = Date.now();
          if (now - lastSideForwardTime > SIDE_KEY_DEBOUNCE_MS) {
            lastSideForwardTime = now;
            if (currentView !== 'home') {
              const wv = webviews[currentView];
              if (wv && typeof wv.canGoForward === 'function' && wv.canGoForward()) {
                wv.goForward();
                showToast('前进下一页', '➡️');
              }
            }
          }
        }
      }
    }, true);
  });

  // Hardware Mouse Back / Forward forwarded from Electron Main process
  if (window.electronAPI) {
    if (typeof window.electronAPI.onMouseBack === 'function') {
      window.electronAPI.onMouseBack(() => {
        handleGlobalNavigateBack();
      });
    }
    if (typeof window.electronAPI.onMouseForward === 'function') {
      window.electronAPI.onMouseForward(() => {
        if (currentView !== 'home') {
          const wv = webviews[currentView];
          if (wv && typeof wv.canGoForward === 'function' && wv.canGoForward()) {
            wv.goForward();
            showToast('前进下一页', '➡️');
          }
        }
      });
    }
  }

  // Keyboard Shortcuts (Escape triggers handleGlobalNavigateBack)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      handleGlobalNavigateBack();
    }
    if (e.ctrlKey || e.metaKey) {
      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        applyZoom(0.1);
      } else if (e.key === '-') {
        e.preventDefault();
        applyZoom(-0.1);
      } else if (e.key === '0') {
        e.preventDefault();
        currentZoom = 1.0;
        applyZoom(0);
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        reloadCurrentView();
      } else if (e.key === ',' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        if (elements.settingsBackdrop?.classList.contains('visible')) {
          closeSettings();
        } else {
          openSettings();
        }
      }
    }
  });
});

// Oppo Connect Direct Launch Handler is exported via window.triggerOppoLaunch

// ==========================================================================
// Settings Segmented Controls: Apple Fluid Drag & Snap Engine
// ==========================================================================
function updateThemeSegmentedThumb(setting = themeSetting) {
  const container = document.getElementById('theme-segmented');
  const thumb = document.getElementById('theme-slider-thumb');
  const activeBtn = document.getElementById(`theme-opt-${setting}`);
  if (!container || !thumb || !activeBtn) return;

  const cRect = container.getBoundingClientRect();
  const bRect = activeBtn.getBoundingClientRect();
  if (cRect.width > 0 && bRect.width > 0) {
    const leftOffset = Math.round(activeBtn.offsetLeft);
    thumb.style.transform = `translateX(${leftOffset}px)`;
    thumb.style.width = `${Math.round(activeBtn.offsetWidth)}px`;
    thumb.style.opacity = '1';
  }
}

function updateLangSegmentedThumb(lang = currentLang) {
  const container = document.getElementById('lang-segmented');
  const thumb = document.getElementById('lang-slider-thumb');
  const shortLang = (lang === 'en-US' || lang === 'en') ? 'en' : 'zh';
  const activeBtn = document.getElementById(`lang-opt-${shortLang}`);
  if (!container || !thumb || !activeBtn) return;

  const cRect = container.getBoundingClientRect();
  const bRect = activeBtn.getBoundingClientRect();
  if (cRect.width > 0 && bRect.width > 0) {
    const leftOffset = Math.round(activeBtn.offsetLeft);
    thumb.style.transform = `translateX(${leftOffset}px)`;
    thumb.style.width = `${Math.round(activeBtn.offsetWidth)}px`;
    thumb.style.opacity = '1';
  }
}

function initAppleSegmentedDrag(options) {
  const { containerId, thumbId, items, getValue, onSelect } = options;
  const container = document.getElementById(containerId);
  const thumb = document.getElementById(thumbId);
  if (!container || !thumb) return;

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let downTarget = null;
  let moved = false;

  const getItemElements = () => {
    return items.map(item => ({
      val: item.val,
      el: document.getElementById(item.id)
    })).filter(x => x.el !== null);
  };

  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    isDragging = true;
    moved = false;
    startX = e.clientX;
    startY = e.clientY;
    downTarget = e.target.closest('.segment-btn') || e.target.closest('.oppo-mode-btn');
    container.classList.add('is-dragging');
    container.setPointerCapture(e.pointerId);

    const itemEls = getItemElements();
    const currentVal = getValue();
    const curItem = itemEls.find(x => x.val === currentVal) || itemEls[0];
    if (curItem) {
      thumb.style.transform = `translateX(${Math.round(curItem.el.offsetLeft)}px)`;
      thumb.style.width = `${Math.round(curItem.el.offsetWidth)}px`;
      thumb.style.opacity = '1';
    }
  };

  const onPointerMove = (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      moved = true;
    }

    const itemEls = getItemElements();
    if (itemEls.length === 0) return;

    const minX = itemEls[0].el.offsetLeft;
    const maxX = itemEls[itemEls.length - 1].el.offsetLeft;

    const currentVal = getValue();
    const curIndex = Math.max(0, itemEls.findIndex(x => x.val === currentVal));
    const curEl = itemEls[curIndex].el;
    const baseOrigin = curEl.offsetLeft;

    let newX = baseOrigin + deltaX;

    // Strict boundary clamping inside container bounds
    newX = Math.max(minX, Math.min(maxX, newX));

    // Dynamic width interpolation between neighbors
    let estimatedWidth = curEl.offsetWidth;
    for (let i = 0; i < itemEls.length - 1; i++) {
      const el1 = itemEls[i].el;
      const el2 = itemEls[i + 1].el;
      const pos1 = el1.offsetLeft;
      const pos2 = el2.offsetLeft;
      if (newX >= pos1 && newX <= pos2) {
        const factor = (pos2 === pos1) ? 0 : (newX - pos1) / (pos2 - pos1);
        estimatedWidth = el1.offsetWidth + (el2.offsetWidth - el1.offsetWidth) * factor;
        break;
      }
    }

    thumb.style.transform = `translateX(${Math.round(newX)}px)`;
    thumb.style.width = `${Math.round(estimatedWidth)}px`;
  };

  const onPointerUp = (e) => {
    if (!isDragging) return;
    isDragging = false;
    container.classList.remove('is-dragging');
    try {
      container.releasePointerCapture(e.pointerId);
    } catch (_) {}

    const itemEls = getItemElements();
    if (itemEls.length === 0) return;

    if (!moved) {
      // Direct click on button: use elementFromPoint or downTarget for 100% reliable click detection
      const targetEl = downTarget || document.elementFromPoint(e.clientX, e.clientY)?.closest('.segment-btn') || document.elementFromPoint(e.clientX, e.clientY)?.closest('.oppo-mode-btn');
      if (targetEl) {
        const matched = itemEls.find(x => x.el === targetEl);
        if (matched) {
          onSelect(matched.val);
          return;
        }
      }
    }

    // Drag release - find closest item by center distance
      const cRect = container.getBoundingClientRect();
      const thumbCurrentLeft = parseFloat(thumb.style.transform.replace(/[^0-9.-]/g, '')) || 0;
      const thumbWidth = parseFloat(thumb.style.width) || 60;
      const thumbCenter = thumbCurrentLeft + thumbWidth / 2;

      let closestItem = itemEls[0];
      let minDistance = Infinity;

      itemEls.forEach(item => {
        const bRect = item.el.getBoundingClientRect();
        const itemCenter = (bRect.left - cRect.left) + bRect.width / 2;
        const dist = Math.abs(thumbCenter - itemCenter);
        if (dist < minDistance) {
          minDistance = dist;
          closestItem = item;
        }
      });

      if (closestItem) {
        onSelect(closestItem.val);
      }
  };

  container.addEventListener('pointerdown', onPointerDown);
  container.addEventListener('pointermove', onPointerMove);
  container.addEventListener('pointerup', onPointerUp);
  container.addEventListener('pointercancel', onPointerUp);
}

function initSettingsSegmentedDragControls() {
  // Theme drag & tap controller
  initAppleSegmentedDrag({
    containerId: 'theme-segmented',
    thumbId: 'theme-slider-thumb',
    items: [
      { val: 'system', id: 'theme-opt-system' },
      { val: 'light', id: 'theme-opt-light' },
      { val: 'dark', id: 'theme-opt-dark' }
    ],
    getValue: () => themeSetting,
    onSelect: (val) => applyTheme(val, true)
  });

  // Language drag & tap controller
  initAppleSegmentedDrag({
    containerId: 'lang-segmented',
    thumbId: 'lang-slider-thumb',
    items: [
      { val: 'zh-CN', id: 'lang-opt-zh' },
      { val: 'en-US', id: 'lang-opt-en' }
    ],
    getValue: () => currentLang,
    onSelect: (val) => applyLanguage(val, true)
  });

  // Initial thumb layout after DOM render
  setTimeout(() => {
    updateThemeSegmentedThumb();
    updateLangSegmentedThumb();
  }, 100);

  window.addEventListener('resize', () => {
    updateThemeSegmentedThumb();
    updateLangSegmentedThumb();
  });
}

async function triggerOppoLaunch() {
  const isEn = currentLang === 'en-US';
  showToast(isEn ? 'Waking OPPO Connect Client...' : '正在唤起 OPPO 跨屏互联客户端...', '📲');
  if (window.electronAPI && typeof window.electronAPI.launchOppo === 'function') {
    const customPath = localStorage.getItem('unicontrol-oppo-custom-path') || '';
    const res = await window.electronAPI.launchOppo(customPath);
    if (res && res.success) {
      showToast(isEn ? 'OPPO Client launched in background' : 'OPPO 跨屏互联已在后台呼出', '✅');
    } else {
      if (res && res.error === 'NOT_INSTALLED') {
        showToast(isEn ? 'OPPO Connect executable not found. Please set path in Settings.' : '未检测到 OPPO 跨屏互联程序，请在“设置”中配置路径', '⚠️');
        setTimeout(() => openSettings(), 1200);
      } else {
        showToast((isEn ? 'Launch failed: ' : '启动客户端失败：') + (res?.error || '未知错误'), '⚠️');
      }
    }
  } else {
    showToast(isEn ? 'Environment does not support direct launch' : '当前环境不支持直接唤起客户端', '⚠️');
  }
}

// Apple Liquid Glass Tooltip System
function initAppleTooltips() {
  const tooltipEl = document.createElement('div');
  tooltipEl.className = 'apple-tooltip-capsule';
  document.body.appendChild(tooltipEl);

  let currentTarget = null;
  let showTimeout = null;

  function showTooltip(text, targetRect) {
    tooltipEl.textContent = text;
    tooltipEl.classList.add('visible');

    const tipRect = tooltipEl.getBoundingClientRect();
    let left = targetRect.left + (targetRect.width / 2) - (tipRect.width / 2);
    let top = targetRect.bottom + 8; // Display below element

    // Boundary protection
    if (left < 10) left = 10;
    if (left + tipRect.width > window.innerWidth - 10) {
      left = window.innerWidth - tipRect.width - 10;
    }
    if (top + tipRect.height > window.innerHeight - 10) {
      top = targetRect.top - tipRect.height - 8; // Flip to top if bottom overflows
    }

    tooltipEl.style.left = `${left}px`;
    tooltipEl.style.top = `${top}px`;
  }

  function hideTooltip() {
    clearTimeout(showTimeout);
    tooltipEl.classList.remove('visible');
    currentTarget = null;
  }

  // Delegate mouseover for elements with title or data-tooltip
  document.addEventListener('mouseover', (e) => {
    const el = e.target.closest('[title], [data-tooltip]');
    if (!el) return;
    if (el.closest('.device-card') || el.closest('.dual-device-grid')) return;

    // Grab tooltip content
    let text = el.getAttribute('data-tooltip');
    if (!text && el.hasAttribute('title')) {
      text = el.getAttribute('title');
      // Remove native Windows browser tooltip attribute to prevent square collision
      el.setAttribute('data-tooltip', text);
      el.removeAttribute('title');
    }

    if (!text || text.trim() === '') return;

    currentTarget = el;
    clearTimeout(showTimeout);
    showTimeout = setTimeout(() => {
      if (currentTarget === el) {
        showTooltip(text, el.getBoundingClientRect());
      }
    }, 180);
  }, true);

  document.addEventListener('mouseout', (e) => {
    if (currentTarget && !currentTarget.contains(e.relatedTarget)) {
      hideTooltip();
    }
  }, true);

  document.addEventListener('mousedown', () => {
    hideTooltip();
  }, true);

  window.addEventListener('scroll', () => {
    hideTooltip();
  }, true);
}

// ==========================================================================
// ==========================================================================
// FLYDIGI PC SPACE LAUNCHER
// ==========================================================================
async function triggerFlydigiLaunch() {
  const isEn = currentLang === 'en-US';
  showToast(isEn ? 'Waking Flydigi PC Space...' : '正在唤起飞智 PC 空间站...', '🎮');
  if (window.electronAPI && typeof window.electronAPI.launchFlydigi === 'function') {
    const customPath = localStorage.getItem('unicontrol-flydigi-custom-path') || '';
    const res = await window.electronAPI.launchFlydigi(customPath);
    if (res && res.success) {
      showToast(isEn ? 'Flydigi PC Space launched in background' : '飞智 PC 空间站已在后台呼出', '✅');
    } else {
      if (res && res.error === 'NOT_INSTALLED') {
        showToast(isEn ? 'Flydigi Space executable not found. Please set path in Settings.' : '未检测到飞智空间站程序，请在“设置”中配置路径', '⚠️');
        setTimeout(() => openSettings(), 1200);
      } else {
        showToast((isEn ? 'Launch failed: ' : '启动空间站失败：') + (res?.error || '未知错误'), '⚠️');
      }
    }
  } else {
    showToast(isEn ? 'Environment does not support direct launch' : '当前环境不支持直接唤起空间站', '⚠️');
  }
}

// triggerFlydigiLaunch 已在文件顶部全局挂载区统一注册，此处无需重复。
