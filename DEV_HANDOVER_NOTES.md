# UniControl 开发交接与架构设计规范备忘录

本文件汇总了对 **UniControl**（聚合驱动中控平台，支持迈从 MCHOSE、前行者 EWEADN、OPPO 随身工作台与飞智游戏手柄）的所有功能迭代、交互规范、设计原则以及最新架构优化，供后续无缝衔接开发。

---

## 一、 项目工程信息与核心架构

1. **项目路径**：`d:\System\Desktop\UniControl`
2. **启动文件**：`d:\System\Desktop\UniControl\UniControl.exe`
3. **源码与运行时架构（已全面工程化优化）**：
   - 源代码存放在 `d:\System\Desktop\UniControl\src\` 以及根目录的 `main.js`。
   - 主进程采用清晰的模块化架构拆分：
     - `main.js`：Electron 应用生命周期、BrowserWindow 管理与全局 IPC 路由器；
     - `src/main/sessionManager.js`：外设 WebHID / WebUSB 直通鉴权，精准白名单域名过滤，动态安全策略；
     - `src/main/dockManager.js`：Win32 窗口原生 Docking（OppoDockTool）、高分屏多显示器 DPI 动态自适应、防抖 Resize 与退出时 Undock 自动资源回收；
     - `src/main/appLauncher.js`：外部应用（OPPO Connect、Flydigi PcSpace）路径自动多候选目录智能探测与子进程安全唤起。
   - **一键自动化同步构建**：
     - 每次修改源码后，直接执行根目录的 `npm run sync` 或 `powershell -ExecutionPolicy Bypass -File ./sync_build.ps1`。
     - 脚本将自动完成 JavaScript 静态语法检查、全量资源同步到 `resources/app/` 运行副本并二次验证无误。

---

## 二、 交互逻辑与多级界面体系

UniControl 遵循严谨的三级交互层次体系：

```
[一级主界面 (Home Overview)]
   ├── 卡片点击 -> [驱动视口 (MCHOSE / EWEADN Webview)]
   └── 右上角设置图标 -> [二级界面 (Settings Modal)]
                           └── 点击清理缓存 -> [三级界面 (Confirm Modal)]
```

### 1. 鼠标侧键（后退 / Button 4 / Back）与 Esc 返回机制
- **三级确认弹窗打开时**：触发侧键 / Esc / 取消按钮，**只关闭三级弹窗**并恢复二级设置卡片高斯模糊，**严禁**直接退到主界面。
- **二级设置面板打开时**：触发侧键 / Esc / 关闭按钮，关闭设置，平滑退回当前工作视图。
- **设备驱动视口（含白屏加载中）**：
  - 若内置 webview 有页面历史记录（`canGoBack() == true`），优先在网页内后退上一页。
  - 若无历史记录，或处于网络请求/白屏加载中，**一键退回主概览**。
- **Webview 穿透监听方案**：
  - 由于 `<webview>` 内部会阻断外层事件，在 `load-commit`、`did-start-navigation` 及 `dom-ready` 阶段均注入了原生鼠标事件捕获（`mouseup / pointerup / auxclick` 监听 `e.button === 3`），并通过 `console-message` 桥接转发至主渲染进程的 `handleGlobalNavigateBack()`。

---

## 三、 UI/UX 与视觉设计方向

### 1. 整体设计语言：Apple 流体毛玻璃 (Liquid Glass & macOS Sequoia Aesthetic)
- **一体性与克制感**：
  - 严禁粗糙厚重的色块与突兀的外框。
  - 使用超高斯多层柔光、极细高光内描边（`inset 0 1px 1.5px rgba(255, 255, 255, 0.95)`）与环境投影。
- **动态光幕背景**：
  - 动态 Canvas 光斑与呼吸流体网格层，暗色呈现赛博霓虹蓝紫，亮色模式下使用超轻柔微风纯净白羽光（无网格摩尔纹干扰）。

### 2. 顶栏（Titlebar）设计与空间替换规范
- **红黄绿三色按键**：保持标准 macOS 窗口控件设计，红（关闭/托盘）、黄（最小化）、绿（最大化）。
- **顶栏中区**：
  - **主界面状态**：展示 UniControl 原生图标与 `UniControl` 标题。
  - **进入设备驱动状态**：
    - 不在视口区域叠加浮动按钮（**坚决避免遮挡官方驱动页面的导航和功能区**）。
    - 顶栏中区动态平滑替换为 **一体化导航胶囊 (`.titlebar-nav-pill`)**：
      `[ ← 返回 | 🔄 刷新 | [品牌Logo] 品牌名称 ]`
    - 迈从加载展示 `mchose-logo.png` + `迈从`；前行者加载展示 `eweadn-logo.png` + `前行者`。

### 3. 缩放控制（Zoom）
- 位于顶栏右侧，以胶囊形式集成 `[-]`、`100%`、`[+]`。
- **滚轮无级缩放**：
  - 鼠标悬停在缩放胶囊或百分比文字上，直接使用滚轮即可调节大小（0.6x ~ 1.6x）。
  - **全局快捷键支持**：在软件任意位置按住 **`Ctrl` + 鼠标滚轮**，即可全局平滑放大或缩小界面。
  - 点击百分比数字直接一键重置为 100%。

---

## 四、 已实现的关键功能与配置清单

| 功能模块 | 说明 | 对应关键代码/文件 |
| :--- | :--- | :--- |
| **外观主题切换** | 跟随系统、亮色白羽、深色夜间，记忆于 `localStorage` | `applyTheme()`, `src/app.js` |
| **全生态双语即时同步** | 简体中文 (`zh-CN`) / English (`en-US`) 切换后，主界面与四大内置驱动（迈从、前行者、OPPO、飞智）跨视图底层语言动态联动 | `applyLanguage()`, `src/app.js` |
| **OPPO 随身工作台 (Oppo Connect)** | 专属翡翠青绿卡片、官方 O+ Logo 徽标胶囊、Win32 窗口无缝 Docking 嵌入 + 防抖高分屏 DPI 自适应 + 退出自动资源释放与还原 | `src/main/dockManager.js`, `OppoDockTool.exe`, `src/app.js` |
| **飞智游戏手柄驱动 (FLYDIGI)** | 极夜冰蓝电竞卡片、多路径智能探测唤起引擎与后台托盘静默拉起 | `src/main/appLauncher.js`, `src/app.js`, `main.js` |
| **外设鉴权与动态安全策略** | 仅对官方受信白名单域名精准放行 WebHID/WebUSB 与跨源 Frame，避免全局 CSP 暴力剔除 | `src/main/sessionManager.js` |
| **托盘运行与全局唤醒** | 支持自定义关闭到托盘或直接退出，支持自定义快捷键（默认 `Ctrl + Alt + U`）全局瞬时呼出/隐藏 | `main.js`, IPC `setGlobalShortcut` |
| **硬件缓存清理** | 三级确认设计，一键清理 Chromium webview 与驱动服务缓存 | IPC `clearCache` |
| **多品牌驱动容错** | 智能超时检测与离线兜底卡片，支持原节点重试与切换官方备用接入点 | `.webview-fallback`, `retryWebview()` |
