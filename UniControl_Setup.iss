; Script generated for UniControl & Bundled OPPO Connect All-in-One Installer
#define MyAppName "UniControl"
#define MyAppFullName "UniControl - 统一外设控制中心"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "UniControl Team"
#define MyAppExeName "UniControl.exe"
#define UniSourceDir "."
#define OppoSourceDir "..\Oppo Connect"

[Setup]
AppId={{E697F8B2-9F22-4B38-A32C-901F12345678}
AppName={#MyAppFullName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppFullName} v{#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\UniControl
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
OutputDir=..
OutputBaseFilename=UniControl_Setup_v1.0.0
SetupIconFile={#UniSourceDir}\icon.ico
Compression=lzma2/normal
SolidCompression=yes
WizardStyle=modern
ArchitecturesInstallIn64BitMode=x64compatible
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
UninstallDisplayIcon={app}\{#MyAppExeName}

[Languages]
Name: "default"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"
Name: "oppoicon"; Description: "在桌面上创建「OPPO 跨屏互联」快捷方式"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
; 1. UniControl Core Application Files
Source: "{#UniSourceDir}\UniControl.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "{#UniSourceDir}\OppoDockTool.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "{#UniSourceDir}\icon.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "{#UniSourceDir}\*.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "{#UniSourceDir}\*.pak"; DestDir: "{app}"; Flags: ignoreversion
Source: "{#UniSourceDir}\*.dat"; DestDir: "{app}"; Flags: ignoreversion
Source: "{#UniSourceDir}\*.bin"; DestDir: "{app}"; Flags: ignoreversion
Source: "{#UniSourceDir}\locales\*"; DestDir: "{app}\locales"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "{#UniSourceDir}\resources\*"; DestDir: "{app}\resources"; Flags: ignoreversion recursesubdirs createallsubdirs

; 2. Bundled OPPO Connect Full Runtime & Application (Optional: 存在时自动打包，不存在时安全跳过)
#if DirExists(OppoSourceDir)
Source: "{#OppoSourceDir}\*"; DestDir: "{app}\Oppo Connect"; Flags: ignoreversion recursesubdirs createallsubdirs
#endif

[Icons]
Name: "{autoprograms}\{#MyAppFullName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{autodesktop}\{#MyAppFullName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon
#if DirExists(OppoSourceDir)
Name: "{autodesktop}\OPPO 跨屏互联"; Filename: "{app}\Oppo Connect\O+Connect.exe"; WorkingDir: "{app}\Oppo Connect"; Tasks: oppoicon
#endif

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppFullName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent
