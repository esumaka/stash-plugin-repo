[English](README.md) | [简体中文](README.zh-Hans.md)

---

# Stash Plugin Repository

[Stash](https://github.com/stashapp/stash) 的插件仓库，收录本人开发维护的 Stash 插件。

## 插件列表

- [External Player Launcher](projects/external-player-launcher/README.zh-Hans.md)
  - 该插件添加了对某些媒体播放器的支持，可以在短片卡片和短片详情页中选择播放器播放视频。

## 安装插件

1. 在 Stash 中进入 **设置** → **插件**
2. 点击 **添加源**，填入以下信息：
   - **名称**: `esumaka plugin repo`
   - **来源 URL**: `https://esumaka.github.io/stash-plugin-repo/main/index.yml`
3. 点击 **确认** 添加源
4. 在可用插件列表中选择要安装的插件，点击 **安装**
5. 刷新 Stash 页面使插件生效

## 开发

### 前置要求

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/)

### 构建插件

- 运行 `cd projects/{name}`，`{name}` 为对应的项目名称
- 运行 `pnpm install`
- 运行 `npm run build`，或者在 Visual Studio Code 的 **资源管理器 → NPM脚本** 中，点击运行 `build` 脚本。

### 部署到本地 Stash（开发调试）

- 部署前先修改 `deploy.js` 的 `pluginsDir` 为自己的 Stash 插件目录
- 运行 `cd projects/{name}`，`{name}` 为对应的项目名称
- 运行 `npm run deploy`，或者在 Visual Studio Code 的 **资源管理器 → NPM脚本** 中，点击运行 `deploy` 脚本。
- 在 Stash 的 **设置** → **插件** 页面中点击 **重载插件**，然后刷新 Stash 页面使插件生效。

## 贡献

欢迎提交 Issue 和 Pull Request。
