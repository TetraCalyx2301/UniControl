/**
 * UniControl - External App Launcher & Path Resolver
 * Detects common install paths and manages child process spawning.
 *
 * 【缺陷3修复】移除所有硬编码开发者绝对路径（d:\System\Desktop\...），
 * 改用运行时相对路径、环境变量和注册表探测，确保可在任意机器运行。
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class AppLauncher {
  /**
   * 安全地从注册表读取已安装程序路径
   * @param {string} regKey 注册表键路径
   * @param {string} valueName 值名称
   * @returns {string|null}
   */
  static _readRegistry(regKey, valueName) {
    try {
      const { execSync } = require('child_process');
      const result = execSync(
        `reg query "${regKey}" /v "${valueName}"`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
      );
      const match = result.match(/REG_SZ\s+(.+)/);
      return match ? match[1].trim() : null;
    } catch (_) {
      return null;
    }
  }

  static getOppoCandidates(customPath, appPath, resourcesPath) {
    const pf = process.env.ProgramFiles || 'C:\\Program Files';
    const pf86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
    const localAppData = process.env.LOCALAPPDATA || '';
    const appData = process.env.APPDATA || '';

    // 注册表探测（O+Connect 常见卸载键）
    const regPath = AppLauncher._readRegistry(
      'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\O+Connect',
      'InstallLocation'
    );

    return [
      // 1. 用户自定义路径（最高优先级）
      customPath,
      // 2. 注册表探测
      regPath ? path.join(regPath, 'O+Connect.exe') : null,
      // 3. 应用相对路径（便携版捆绑场景）
      path.join(__dirname, '..', '..', '..', 'Oppo Connect', 'O+Connect.exe'),
      path.join(__dirname, '..', '..', 'Oppo Connect', 'O+Connect.exe'),
      path.join(resourcesPath || '', 'Oppo Connect', 'O+Connect.exe'),
      path.join(appPath || '', '..', 'Oppo Connect', 'O+Connect.exe'),
      // 4. 标准安装目录
      path.join(pf, 'O+Connect', 'O+Connect.exe'),
      path.join(pf86, 'O+Connect', 'O+Connect.exe'),
      path.join(localAppData, 'Programs', 'O+Connect', 'O+Connect.exe'),
      path.join(appData, 'O+Connect', 'O+Connect.exe'),
    ].filter(Boolean); // 过滤 null/undefined
  }

  static getFlydigiCandidates(customPath, resourcesPath) {
    const pf = process.env.ProgramFiles || 'C:\\Program Files';
    const pf86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
    const localAppData = process.env.LOCALAPPDATA || '';

    // 注册表探测（FlydigiPcSpace 常见安装键）
    const regPath = AppLauncher._readRegistry(
      'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\FlydigiPcSpace',
      'InstallLocation'
    );

    return [
      // 1. 用户自定义路径
      customPath,
      // 2. 注册表探测
      regPath ? path.join(regPath, 'FlydigiPcSpace.exe') : null,
      // 3. 应用相对路径（便携版捆绑场景）
      path.join(__dirname, '..', '..', 'FlydigiPcSpace', 'FlydigiPcSpace.exe'),
      path.join(__dirname, '..', '..', '..', 'FlydigiPcSpace', 'FlydigiPcSpace.exe'),
      path.join(resourcesPath || '', 'FlydigiPcSpace', 'FlydigiPcSpace.exe'),
      // 4. 标准安装目录
      path.join(pf86, 'FlydigiPcSpace', 'FlydigiPcSpace.exe'),
      path.join(pf, 'FlydigiPcSpace', 'FlydigiPcSpace.exe'),
      path.join(localAppData, 'Programs', 'FlydigiPcSpace', 'FlydigiPcSpace.exe'),
    ].filter(Boolean);
  }

  static resolveExecutable(candidates) {
    for (const c of candidates) {
      if (c && typeof c === 'string' && fs.existsSync(c)) {
        return c;
      }
    }
    return null;
  }

  static launch(executablePath) {
    if (!executablePath || !fs.existsSync(executablePath)) {
      return { success: false, error: 'NOT_INSTALLED' };
    }

    const targetDir = path.dirname(executablePath);
    try {
      const child = spawn(executablePath, [], {
        detached: true,
        stdio: 'ignore',
        cwd: targetDir
      });
      child.on('error', (spawnErr) => {
        console.warn(`[AppLauncher] Spawn error for ${executablePath}:`, spawnErr.message);
      });
      child.unref();
      return { success: true, path: executablePath };
    } catch (err) {
      console.error(`[AppLauncher] Launch error for ${executablePath}:`, err);
      return { success: false, error: err.message };
    }
  }
}

module.exports = AppLauncher;
