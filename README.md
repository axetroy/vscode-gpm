[![Build Status](https://travis-ci.org/axetroy/vscode-gpm.svg?branch=master)](https://travis-ci.org/axetroy/vscode-gpm)
[![Version](https://vsmarketplacebadge.apphb.com/version/axetroy.vscode-gpm.svg)](https://marketplace.visualstudio.com/items?itemName=axetroy.vscode-gpm)
[![Downloads](https://vsmarketplacebadge.apphb.com/downloads/axetroy.vscode-gpm.svg)](https://marketplace.visualstudio.com/items?itemName=axetroy.vscode-gpm)
[![996.icu](https://img.shields.io/badge/link-996.icu-red.svg)](https://996.icu)
[![LICENSE](https://img.shields.io/badge/license-Anti%20996-blue.svg)](https://github.com/996icu/996.ICU/blob/master/LICENSE)

# vscode-gpm

a cross-platform VSCode extension for managing your Git projects with Golang style.

Support almost git address. including Github/Gitlab/Bitbucket/Coding...

**TIP: Not support private repository with https protocol, please use ssh protocol instead of https**

## Features

* [x] Tree View
* [x] Clone/remove/star/search project
* [x] Work with multiple workspaces

## [CHANGELOG](https://github.com/axetroy/vscode-gpm/blob/master/CHANGELOG.md)

## Commands

| Command                      | description                                                  |
| ---------------------------- | ------------------------------------------------------------ |
| gpm.search                   | Search project                                               |
| gpm.refresh                  | Refresh the treeview                                         |
| gpm.clearCache               | Clean cache                                                  |
| gpm.clone                    | Clone project                                                |
| gpm.prune                    | Prune project. Remove some useless files like `node_modules` |
| gpm.list2openInCurrentWindow | List project and open in current window                      |
| gpm.list2openInNewWindow     | List project and open in new window                          |
| gpm.list2openInWorkspace     | List project and open in workspaces                          |
| gpm.list2openInTerminal      | List project and open in terminal                            |
| gpm.list2start               | List project and star                                        |
| gpm.list2unstart             | List project and unstar                                      |
| gpm.clearStars               | Clean all started                                            |
| gpm.list2remove              | List project and remove it                                   |
| gpm.interruptCommand         | Interrupt Current Running Command                            |

## Related

[https://github.com/gpmer/gpm.js/](https://github.com/gpmer/gpm.js/)

### 捐赠我

如果你觉得这个项目能帮助到你，可以考虑 **支付宝扫码(或搜索 511118132)领红包** 支持我

甚至可以请我喝一杯 ☕️

| 微信                                                                                                     | 支付宝                                                                                                   | 支付宝红包                                                                                                   |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| <img src="https://github.com/axetroy/blog/raw/master/public/donate/wechat.png" width="200" height="200"> | <img src="https://github.com/axetroy/blog/raw/master/public/donate/alipay.png" width="200" height="200"> | <img src="https://github.com/axetroy/blog/raw/master/public/donate/alipay-red.png" width="200" height="200"> |

## License

The [Anti 996 License](https://github.com/axetroy/vscode-gpm/blob/master/LICENSE)
