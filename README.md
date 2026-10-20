# UniControl

UniControl 是一个面向 Windows 的统一外设控制中心，将多个品牌的驱动入口与设备工具集中到一个 Electron 界面中。

## 功能

- 迈从（MCHOSE）与前行者（EWEADN）驱动页面集成
- OPPO 随身工作台窗口嵌入与 Win32 Docking
- 飞智（FLYDIGI）驱动程序启动
- 简体中文 / English 双语切换
- 跟随系统、亮色与深色主题
- 全局唤醒快捷键，默认为 `Ctrl + Alt + U`
- 最小化到系统托盘
- WebHID / WebUSB / Web Serial 支持
- 外设驱动页面缓存清理与离线兜底

## 项目结构

```text
.
├── main.js                 # Electron 主进程入口
├── preload.js              # 安全 IPC 桥接
├── src/
│   ├── app.js              # 渲染层交互逻辑
│   ├── index.html          # 主界面
│   ├── styles/             # 界面样式
│   ├── assets/             # 图标与品牌资源
│   └── main/
│       ├── appLauncher.js  # 外部驱动探测与启动
│       ├── dockManager.js  # OPPO 窗口嵌入与 DPI 适配
│       └── sessionManager.js
├── sync_build.ps1          # 语法检查与运行副本同步脚本
└── package.json
```

## 环境要求

- Windows 10/11
- Node.js 18 或更高版本
- PowerShell
- 已安装的 Electron 运行环境或项目配套的 Electron Runtime

OPPO Connect 与 FLYDIGI 功能需要对应的官方 Windows 客户端。应用会优先使用用户设置的路径，并尝试从注册表和常见安装目录中自动探测。

## 开发与运行

```powershell
# 检查 JavaScript 语法并同步 resources/app 运行副本
npm run sync

# 启动现有 Windows 运行程序
npm start
```

每次修改 `main.js`、`preload.js` 或 `src/` 下的源码后，建议先执行 `npm run sync`。

## 构建说明

`sync_build.ps1` 会：

1. 检查主进程、预加载脚本和渲染层 JavaScript 语法；
2. 将源码同步到 `resources/app/`；
3. 再次校验同步后的运行副本。

仓库默认不提交 Electron 打包生成的大型运行时文件和最终安装包。若需要发布 Windows 安装包，请使用适配当前 Electron 版本的打包流程生成发行物。

## 安全说明

应用只对受信任的官方驱动域名启用相关设备能力。请勿将个人配置、访问令牌或本机安装目录信息提交到仓库。

## License

本项目采用 [MIT License](LICENSE)。
