# vscode-gpm

vscode-gpm is a extension to manage project.

## Features

* [x] Manage your projects in tree view.
* [x] Add project
* [x] Remove project
* [x] Prune project
* [x] Star project
* [x] Custom hooks

## [CHANGELOG](https://github.com/axetroy/vscode-gpm/blob/master/CHANGELOG.md)

## Screen shot

### Add project

![](https://github.com/axetroy/vscode-gpm/raw/master/resources/screenshot/add.gif)

### Edit project

![](https://github.com/axetroy/vscode-gpm/raw/master/resources/screenshot/edit.gif)

### Open project

![](https://github.com/axetroy/vscode-gpm/raw/master/resources/screenshot/open.gif)

### Star project

![](https://github.com/axetroy/vscode-gpm/raw/master/resources/screenshot/star.gif)

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
    "postadd": "npm install"
  }
}
```

support hooks:

* [x] postadd: The hook after add project, run command in **project path**
* [x] preRemove: The hook before remove project, run command in **project path**
* [x] postRemove: The hooks after remove project, run command in **owner path**

## Q & A

Q: Did I need to install [gpm](https://github.com/gpmer/gpm.js) in global?

A: No, vscode-gpm is an independent package.

Q: How to interrupt `git clone` command if you got bar network

A: Clone progress will print in status bar. click status bar and show an dialog to confirm interrupt it.

Q: Where are the project be cloned?

A: See to [Configuration](#Configuration), project will save in `gpm.rootPath`

## Related

[https://github.com/gpmer/gpm.js/](https://github.com/gpmer/gpm.js/)

## Contributors

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->

| [<img src="https://avatars1.githubusercontent.com/u/9758711?v=3" width="100px;"/><br /><sub>Axetroy</sub>](http://axetroy.github.io)<br />[💻](https://github.com/axetroy/kost/commits?author=axetroy) 🔌 [⚠️](https://github.com/axetroy/kost/commits?author=axetroy) [🐛](https://github.com/axetroy/kost/issues?q=author%3Aaxetroy) 🎨 |
| :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |


<!-- ALL-CONTRIBUTORS-LIST:END -->

## License

The [MIT License](https://github.com/axetroy/vscode-gpm/blob/master/LICENSE)
