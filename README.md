[English](README.md) | [简体中文](README.zh-Hans.md)

---

# Stash Plugin Repository

A collection of plugins for [Stash](https://github.com/stashapp/stash), maintained by esumaka.

## Plugin List

- [External Player Support](projects/external-player-support/README.md)
  - This plugin adds support for launching videos in external media players from scene cards and scene detail pages.

## Installing Plugins

1. In Stash, go to **Settings** → **Plugins**
2. Click **Add Source** and fill in the following:
   - **Name**: `esumaka plugin repo`
   - **Source URL**: `https://esumaka.github.io/stash-plugin-repo/main/index.yml`
3. Click **Confirm** to add the source
4. Select the plugin you want from the Available Plugins list and click **Install**
5. Refresh the Stash page for the plugin to take effect

## Development

### Requirements

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/)

### Building a Plugin

- Run `cd projects/{name}`, where `{name}` is the project directory name
- Run `pnpm install`
- Run `npm run build`, or in Visual Studio Code go to **Explorer → NPM Scripts** and click the `build` script

### Deploying to Local Stash (for debugging)

- Before deploying, modify the `pluginsDir` in `deploy.js` to point to your Stash plugins directory
- Run `cd projects/{name}`, where `{name}` is the project directory name
- Run `npm run deploy`, or in Visual Studio Code go to **Explorer → NPM Scripts** and click the `deploy` script
- In Stash, go to **Settings** → **Plugins**, click **Reload Plugins**, then refresh the Stash page for the plugin to take effect

## Contributing

Issues and Pull Requests are welcome.
