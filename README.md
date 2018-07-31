# vscode-gpm

[![Build Status](https://travis-ci.org/axetroy/vscode-gpm.svg?branch=master)](https://travis-ci.org/axetroy/vscode-gpm)
[![Visual Studio Marketplace](https://img.shields.io/vscode-marketplace/d/axetroy.vscode-gpm.svg)](https://github.com/axetroy/vscode-gpm)

a cross-platform VSCode extension for managing your Git projects.

Support almost git address. including Github/Gitlab/Bitbucket/Coding...

**TIP: Not support private repository with https protocol, please use ssh protocol instead of https**

## Features

* [x] Manage your projects in tree view
* [x] Add project
* [x] Remove project
* [x] Prune project
* [x] Star project
* [x] Search project
* [x] Custom hooks

## [CHANGELOG](https://github.com/axetroy/vscode-gpm/blob/master/CHANGELOG.md)

## Screenshot

### Add project

![add project](https://github.com/axetroy/vscode-gpm/raw/master/resources/screenshot/add.gif)

### Edit project

![edit project](https://github.com/axetroy/vscode-gpm/raw/master/resources/screenshot/edit.gif)

### Open project

![open project](https://github.com/axetroy/vscode-gpm/raw/master/resources/screenshot/open.gif)

### Search project

![search project](https://github.com/axetroy/vscode-gpm/raw/master/resources/screenshot/search.gif)

### Star project

![star project](https://github.com/axetroy/vscode-gpm/raw/master/resources/screenshot/star.gif)

## Configuration

```json
{
  "gpm.rootPath": ["$HOME/gpm"],
  "gpm.isAutoRunHook": false,
  "gpm.searchBehavior": "openInNewWindow"
}
```

## Custom Hooks

Make sure the file `.gpmrc` has existed in the target project.

```json
{
  "hooks": {
    "postadd": "npm install",
    "preremove": "echo 'run preremove hook'",
    "postremove": "echo 'run postremove hook'"
  }
}
```

support hooks:

* [x] postadd: run command in **project path** after add project.
* [x] preremove: run command in **project path** before remove project.
* [x] postremove: run command in **owner path** after remove project.

hook is default disable. if you want enable it. see [Configuration](#configuration).

**WARNING: custom hook may be dangerous. risk on your own**.

## Q & A

Q: Should I need to install [gpm](https://github.com/gpmer/gpm.js) in global?

A: No, vscode-gpm is an independent package.

Q: How to interrupt `git clone` command if you got bad network?

A: Clone progress will print in the status bar. click status bar and show a dialog to confirm interrupt it.

Q: Where are the project be cloned?

A: See to [Configuration](#configuration), project will save in `gpm.rootPath`

## Related

[https://github.com/gpmer/gpm.js/](https://github.com/gpmer/gpm.js/)

## Contributors

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->

| [<img src="https://avatars1.githubusercontent.com/u/9758711?v=3" width="100px;"/><br /><sub>Axetroy</sub>](http://axetroy.github.io)<br />[💻](https://github.com/axetroy/kost/commits?author=axetroy) 🔌 [⚠️](https://github.com/axetroy/kost/commits?author=axetroy) [🐛](https://github.com/axetroy/kost/issues?q=author%3Aaxetroy) 🎨 |
| :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |


<!-- ALL-CONTRIBUTORS-LIST:END -->

## License

The [MIT License](https://github.com/axetroy/vscode-gpm/blob/master/LICENSE)