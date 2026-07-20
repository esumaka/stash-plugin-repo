[English](README.md) | [简体中文](README.zh-Hans.md)

---

# External Player Launcher

该插件添加了对某些媒体播放器的支持，可以在短片卡片和短片详情页中选择播放器播放视频。

## 特性

- 在短片卡片底部添加播放器下拉菜单，方便快速选择外部播放器
- 开启"单播放器模式"后，下拉菜单将替换为单个播放器按钮，一键播放
- 短片详情页同样支持打开外部播放器
- 可在设置中显示或隐藏各个播放器
- 设置仅在当前浏览器生效，因此不同设备可以配置不同的播放器

## 截图

短片卡片：

![scene-card01](preview/scene-card01.jpg)

短片卡片（单播放器模式）：

![scene-card02](preview/scene-card02.jpg)

短片详情：

![scene-detail](preview/scene-detail.jpg)

## 支持的播放器

目前支持的媒体播放器和操作系统：

⚠️注意，某些播放器需要安装额外的工具才能正常启动

| 播放器 | Windows | Android | iOS | macOS | Linux |
|--------|---------|---------|-----|-------|-------|
| IINA | | | | ✅ | |
| Infuse | | | ✅ | ✅ | |
| MPC-HC | ✅ (需要 [mpc-protocol](https://github.com/muse90673/mpc-protocol/tree/develop)) | | | | |
| MPV | ✅ (需要 [mpv-handler](https://github.com/akiirui/mpv-handler)) | ✅ | ✅ | | ✅ (需要 [mpv-handler](https://github.com/akiirui/mpv-handler)) |
| MX Player (Pro) | | ✅ | | | |
| nPlayer | | | ✅ | ✅ | |
| PotPlayer | ✅ | | | | |
| VLC | ✅ (需要 [vlc-protocol](https://github.com/muse90673/vlc-protocol/tree/develop)) | ✅ | ✅ | ✅ (需要 [vlc-protocol](https://github.com/muse90673/vlc-protocol/tree/develop)) | ✅ (需要 [vlc-protocol](https://github.com/muse90673/vlc-protocol/tree/develop)) |

## 安装插件

请查看 [安装插件](/README.zh-Hans.md#安装插件)

## 使用方法

- 确保已安装受支持的播放器，见 [支持的播放器](#支持的播放器)
- 点击短片卡片底部的播放器图标，在弹出的下拉菜单中选择想要的播放器
- 或者进入短片详情页面，点击“播放器”标签，然后点击想要的播放器按钮
- 浏览器可能弹出“尝试打开xxx”的对话框，点击“打开”按钮即可

## 警告

该插件可能会与其他修改了短片卡片的插件冲突，可能导致播放器按钮消失、显示位置不正确等。

## 开发

请查看 [开发](/README.zh-Hans.md#开发)

## 致谢

本插件部分代码来自：
- [bpking1/embyExternalUrl](https://github.com/bpking1/embyExternalUrl) (MIT License)
  - [embyLaunchPotplayer.js](https://github.com/bpking1/embyExternalUrl/blob/main/embyWebAddExternalUrl/embyLaunchPotplayer.js)

## 贡献代码

欢迎提交 Pull Request 或 Issue。
