/**
 * UniControl - Native Docking Manager for Win32 External Windows (OPPO Connect)
 * Handles DPI scaling, resize debounce, undock cleanup, and process lifecycle.
 *
 * 【缺陷9修复】顶栏高度不再硬编码为 46px，改为通过构造函数/方法动态传入，
 * 默认值保留 46 以保证向后兼容，但支持运行时更新。
 */

const { screen } = require('electron');
const path = require('path');
const { execFile } = require('child_process');

// 顶栏高度常量：与渲染层 CSS --titlebar-height 保持一致
// 如需修改顶栏高度，只需改此处，dockManager 自动同步
const DEFAULT_TITLEBAR_HEIGHT = 46;

class DockManager {
  constructor(getMainWindow, titlebarHeight = DEFAULT_TITLEBAR_HEIGHT) {
    this.getMainWindow = getMainWindow;
    this.oppoDockTool = path.join(__dirname, '..', '..', 'OppoDockTool.exe');
    this.isOppoDocked = false;
    this.resizeDebounceTimer = null;
    this.titlebarHeight = titlebarHeight;
  }

  /**
   * 动态更新顶栏高度（当 UI 层顶栏高度变化时调用）
   * @param {number} height
   */
  setTitlebarHeight(height) {
    if (typeof height === 'number' && height > 0) {
      this.titlebarHeight = Math.round(height);
    }
  }

  getNativeHandle() {
    const win = this.getMainWindow();
    if (!win || win.isDestroyed()) return '0';
    const buf = win.getNativeWindowHandle();
    return buf.readBigInt64LE ? buf.readBigInt64LE(0).toString() : buf.readUInt32LE(0).toString();
  }

  getDpiScale() {
    const win = this.getMainWindow();
    if (!win || win.isDestroyed()) return 1.0;
    try {
      const currentDisplay = screen.getDisplayMatching(win.getBounds());
      return currentDisplay?.scaleFactor || 1.0;
    } catch (_) {
      return 1.0;
    }
  }

  triggerResize() {
    if (!this.isOppoDocked) return;
    const win = this.getMainWindow();
    if (!win || win.isDestroyed()) return;

    if (this.resizeDebounceTimer) {
      clearTimeout(this.resizeDebounceTimer);
    }

    this.resizeDebounceTimer = setTimeout(() => {
      if (!this.isOppoDocked) return;
      const currentWin = this.getMainWindow();
      if (!currentWin || currentWin.isDestroyed()) return;

      const parentHWnd = this.getNativeHandle();
      const bounds = currentWin.getContentBounds();
      const scale = this.getDpiScale();
      const tbH = this.titlebarHeight; // 使用实例变量，非硬编码
      const x = Math.round(0 * scale);
      const y = Math.round(tbH * scale);
      const w = Math.round(bounds.width * scale);
      const h = Math.round((bounds.height - tbH) * scale);

      execFile(this.oppoDockTool, [parentHWnd, 'resize', String(x), String(y), String(w), String(h)], (err) => {
        if (err) console.error('[Oppo resize error]', err);
      });
    }, 50);
  }

  async dock(bounds) {
    const parentHWnd = this.getNativeHandle();
    const b = bounds || {};
    const scale = this.getDpiScale();
    const tbH = this.titlebarHeight;
    const x = Math.round((b.x || 0) * scale);
    const y = Math.round((b.y || tbH) * scale);
    const w = Math.round((b.width || 1440) * scale);
    const h = Math.round((b.height || (874)) * scale);

    return new Promise((resolve) => {
      execFile(this.oppoDockTool, [parentHWnd, 'dock', String(x), String(y), String(w), String(h)], (err, stdout, stderr) => {
        if (err) {
          console.error('[OppoDockTool dock error]', err, stderr);
          return resolve({ success: false, error: err.message });
        }
        console.log('[OppoDockTool dock result]:', stdout.trim());
        this.isOppoDocked = stdout.includes('DOCKED_SUCCESS');
        resolve({ success: this.isOppoDocked, output: stdout.trim() });
      });
    });
  }

  async undock() {
    if (!this.isOppoDocked) return { success: true };
    const parentHWnd = this.getNativeHandle();

    return new Promise((resolve) => {
      execFile(this.oppoDockTool, [parentHWnd, 'undock'], (err) => {
        this.isOppoDocked = false;
        if (err) {
          return resolve({ success: false, error: err.message });
        }
        resolve({ success: true });
      });
    });
  }

  cleanup() {
    if (this.isOppoDocked) {
      console.log('[DockManager] Performing app exit undock cleanup...');
      const parentHWnd = this.getNativeHandle();
      try {
        const { execFileSync } = require('child_process');
        execFileSync(this.oppoDockTool, [parentHWnd, 'undock']);
      } catch (e) {
        console.warn('[DockManager] Exit undock failed:', e.message);
      }
      this.isOppoDocked = false;
    }
  }
}

module.exports = DockManager;
