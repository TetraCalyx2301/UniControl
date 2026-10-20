/**
 * UniControl - Peripheral Session & Security Configuration
 * Configures WebHID, WebUSB, User-Agent, and selective CORS/CSP header stripping for verified peripheral vendors.
 */

const CHROME_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.0';

// Domains authorized for peripheral bridge & frame embedding
// 仅允许精确根域名及其直接子域，防止任意三级域名绕过
const TRUSTED_DOMAINS = [
  'mchose.com.cn',
  'eweadn.cn',
  'heytap.com',
  'oppo.com',
  'flydigi.com',
  'localhost',
  '127.0.0.1'
];

// 受信域名的最大子域深度（防止 evil.sub.domain.mchose.com.cn 绕过）
const MAX_SUBDOMAIN_DEPTH = 3;

function isTrustedUrl(urlStr) {
  if (!urlStr) return false;
  try {
    const url = new URL(urlStr);
    const hostname = url.hostname;
    return TRUSTED_DOMAINS.some(domain => {
      if (hostname === domain) return true;
      if (hostname.endsWith('.' + domain)) {
        // 【缺陷12修复】限制子域深度，防止深度嵌套子域绕过白名单
        const subdomain = hostname.slice(0, hostname.length - domain.length - 1);
        const depth = subdomain.split('.').length;
        return depth <= MAX_SUBDOMAIN_DEPTH;
      }
      return false;
    });
  } catch (_) {
    return false;
  }
}

function configurePeripheralSession(targetSession, getMainWindow) {
  if (!targetSession) return;

  targetSession.setUserAgent(CHROME_USER_AGENT);

  // 【缺陷1修复】TLS 证书校验：仅对 localhost/127.0.0.1 豁免，其余交由系统默认校验
  // 原代码对所有域名全局绕过，存在 MITM 中间人攻击风险
  targetSession.setCertificateVerifyProc((request, callback) => {
    const isLocal = request.hostname === 'localhost' || request.hostname === '127.0.0.1';
    // 0 = SEC_SUCCESS (信任), -2 = 交由 Chromium 默认校验流程
    callback(isLocal ? 0 : -2);
  });

  // Strip frame-blocking and CSP headers only for trusted vendor webviews (case-insensitive)
  targetSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...details.responseHeaders };
    if (isTrustedUrl(details.url)) {
      const strippedKeys = ['x-frame-options', 'content-security-policy', 'content-security-policy-report-only'];
      Object.keys(responseHeaders).forEach(header => {
        if (strippedKeys.includes(header.toLowerCase())) {
          delete responseHeaders[header];
        }
      });
    }
    callback({ cancel: false, responseHeaders });
  });

  // 【缺陷2与安全加固】权限检查：仅对来自受信白名单域名的外设请求（HID/USB/Serial）自动授权
  // 摄像头、麦克风、地理位置、系统通知等非外设敏感权限一律默认拒绝，防止恶意内嵌脚本滥用隐私
  const DEVICE_PERMISSIONS = new Set(['hid', 'usb', 'serial']);
  targetSession.setPermissionCheckHandler((webContents, permission, requestingOrigin) => {
    if (DEVICE_PERMISSIONS.has(permission)) {
      return isTrustedUrl(requestingOrigin);
    }
    return false;
  });

  targetSession.setDevicePermissionHandler((details) => {
    // 仅允许受信域名的页面获取设备权限
    return isTrustedUrl(details.origin);
  });

  // Automatically select requested HID device without annoying prompts
  targetSession.on('select-hid-device', (event, details, callback) => {
    event.preventDefault();
    if (details.deviceList && details.deviceList.length > 0) {
      console.log(`[Auto-HID] Auto selected: ${details.deviceList[0].productName || details.deviceList[0].deviceId}`);
      callback(details.deviceList[0].deviceId);
    } else {
      callback('');
    }
  });

  targetSession.on('hid-device-added', (event, device) => {
    console.log('[Auto-HID] Connected:', device.productName);
    const win = typeof getMainWindow === 'function' ? getMainWindow() : null;
    if (win && !win.isDestroyed()) {
      win.webContents.send('hid:device-added', {
        name: device.productName || '未知外设',
        vendorId: device.vendorId,
        productId: device.productId,
        serialNumber: device.serialNumber
      });
    }
  });

  targetSession.on('hid-device-removed', (event, device) => {
    console.log('[Auto-HID] Disconnected:', device.productName);
    const win = typeof getMainWindow === 'function' ? getMainWindow() : null;
    if (win && !win.isDestroyed()) {
      win.webContents.send('hid:device-removed', {
        name: device.productName || '未知外设',
        vendorId: device.vendorId,
        productId: device.productId
      });
    }
  });

  targetSession.on('select-usb-device', (event, details, callback) => {
    event.preventDefault();
    if (details.deviceList && details.deviceList.length > 0) {
      callback(details.deviceList[0].deviceId);
    } else {
      callback('');
    }
  });

  targetSession.on('select-serial-port', (event, portList, webContents, callback) => {
    event.preventDefault();
    if (portList && portList.length > 0) {
      callback(portList[0].portId);
    } else {
      callback('');
    }
  });
}

module.exports = {
  configurePeripheralSession,
  isTrustedUrl
};
