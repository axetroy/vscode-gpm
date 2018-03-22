# vscode-gpm

vscode-gpm is a extension to manage project.

## Features

* [x] Manage your projects in tree view
* [x] Add project
* [x] Remove project
* [x] Prune project
* [x] Star project
* [x] Search project
* [x] Custom hooks

## [CHANGELOG](https://github.com/axetroy/vscode-gpm/blob/master/CHANGELOG.md)

## Support

* [ ] Windows (Not test on windows)
* [x] Mac OS
* [x] Linux

Support almost git address. including Github/Gitlab/Coding...

**TIP: Not support private repository with https**

## Screen shot

### Add project

![add project](https://github.com/axetroy/vscode-gpm/raw/master/resources/screenshot/add.gif)

### Edit project

![edit project](https://github.com/axetroy/vscode-gpm/raw/master/resources/screenshot/edit.gif)

### Open project

![open project](https://github.com/axetroy/vscode-gpm/raw/master/resources/screenshot/open.gif)

### Star project

![star project](https://github.com/axetroy/vscode-gpm/raw/master/resources/screenshot/star.gif)

### Search project

![search project](https://github.com/axetroy/vscode-gpm/raw/master/resources/screenshot/search.gif)

### List project to open

![list project to open](https://github.com/axetroy/vscode-gpm/raw/master/resources/screenshot/list2open.gif)

## Configuration

```json
{
  "gpm.rootPath": "$HOME/gpm",
  "gpm.isAutoRunHook": false
}
```

## Custom Hooks

Make sure the file `.gpmrc` have exist in the target project.

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

Q: How to interrupt `git clone` command if you got bar network?

A: Clone progress will print in status bar. click status bar and show an dialog to confirm interrupt it.

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
