![build](https://github.com/axetroy/vscode-gpm/workflows/build/badge.svg)
[![Version](https://vsmarketplacebadge.apphb.com/version/axetroy.vscode-gpm.svg)](https://marketplace.visualstudio.com/items?itemName=axetroy.vscode-gpm)
[![Downloads](https://vsmarketplacebadge.apphb.com/downloads/axetroy.vscode-gpm.svg)](https://marketplace.visualstudio.com/items?itemName=axetroy.vscode-gpm)
[![DeepScan grade](https://deepscan.io/api/teams/5773/projects/7593/branches/79865/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=5773&pid=7593&bid=79865)
[![996.icu](https://img.shields.io/badge/link-996.icu-red.svg)](https://996.icu)
[![LICENSE](https://img.shields.io/badge/license-Anti%20996-blue.svg)](https://github.com/996icu/996.ICU/blob/master/LICENSE)

# vscode-gpm

vscode extension for managing your Git projects with Golang style.

Support for all git addresses. including `Github/Gitlab/Bitbucket/Coding...`

**If you need to manage dozens or even hundreds of projects, then this extension can help you manage these projects easily**

## Features

- [x] Tree View
- [x] Clone/remove/star/search project
- [x] Work with multiple workspaces

## [CHANGELOG](https://github.com/axetroy/vscode-gpm/blob/master/CHANGELOG.md)

## Commands

| Command                  | description                                                  |
| ------------------------ | ------------------------------------------------------------ |
| gpm.search               | Search project                                               |
| gpm.find                 | alias for `gpm.search`                                       |
| gpm.refresh              | Refresh the treeview                                         |
| gpm.flatten              | Flatten project tree                                         |
| gpm.clearCache           | Clean cache                                                  |
| gpm.clone                | Clone project                                                |
| gpm.prune                | Prune project. Remove some useless files like `node_modules` |
| gpm.list2open            | List project and open in current window                      |
| gpm.list2openNew         | List project and open in new window                          |
| gpm.list2openInWorkspace | List project and open in workspaces                          |
| gpm.list2openInTerminal  | List project and open in terminal                            |
| gpm.list2star            | List project and star                                        |
| gpm.list2unstar          | List project and unstar                                      |
| gpm.clearStars           | Clean all started                                            |
| gpm.list2remove          | List project and remove it                                   |

## Related

[https://github.com/gpmer/gpm.js/](https://github.com/gpmer/gpm.js/)

## License

The [Anti 996 License](https://github.com/axetroy/vscode-gpm/blob/master/LICENSE)
