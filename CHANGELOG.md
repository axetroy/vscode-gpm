<a name="0.20.0"></a>
# [0.20.0](https://github.com/axetroy/vscode-gpm/compare/v0.19.0...v0.20.0) (2018-06-07)


### Features

* no more show cloning message when add project ([984eba2](https://github.com/axetroy/vscode-gpm/commit/984eba2))
* support multiple rootPath close [#12](https://github.com/axetroy/vscode-gpm/issues/12) ([a92f7b7](https://github.com/axetroy/vscode-gpm/commit/a92f7b7))



<a name="0.19.0"></a>
# [0.19.0](https://github.com/axetroy/vscode-gpm/compare/v0.18.0...v0.19.0) (2018-05-28)


### Features

* for performance, now gpm will not pre init anymore. only init when you use it. ([24e4563](https://github.com/axetroy/vscode-gpm/commit/24e4563))
* remove .gpmrc.json associations ([6c36074](https://github.com/axetroy/vscode-gpm/commit/6c36074))
* remove showExplorer config, now explorer is always show ([0ad91de](https://github.com/axetroy/vscode-gpm/commit/0ad91de))



<a name="0.18.0"></a>
# [0.18.0](https://github.com/axetroy/vscode-gpm/compare/v0.17.0...v0.18.0) (2018-05-28)


### Features

* move explorer to activitybar ([55e45be](https://github.com/axetroy/vscode-gpm/commit/55e45be))



<a name="0.17.0"></a>
# [0.17.0](https://github.com/axetroy/vscode-gpm/compare/v0.16.3...v0.17.0) (2018-05-19)


### Features

* pipe process to writable statusbar ([793063c](https://github.com/axetroy/vscode-gpm/commit/793063c))



<a name="0.16.3"></a>
## [0.16.3](https://github.com/axetroy/vscode-gpm/compare/v0.16.2...v0.16.3) (2018-05-17)


### Features

* no more use home dir as temp dir ([c188912](https://github.com/axetroy/vscode-gpm/commit/c188912))



<a name="0.16.2"></a>
## [0.16.2](https://github.com/axetroy/vscode-gpm/compare/v0.16.1...v0.16.2) (2018-04-11)


### Bug Fixes

* add missing return type for openTerminal method ([9131c95](https://github.com/axetroy/vscode-gpm/commit/9131c95))
* can not open terminal if it have been close or exit before ([de87fac](https://github.com/axetroy/vscode-gpm/commit/de87fac))



<a name="0.16.1"></a>
## [0.16.1](https://github.com/axetroy/vscode-gpm/compare/v0.16.0...v0.16.1) (2018-04-09)


### Bug Fixes

* Update config in workspace, It will create .vscode folder ([1b25f66](https://github.com/axetroy/vscode-gpm/commit/1b25f66))


### Features

* Upgrade deps ([1b1d8d5](https://github.com/axetroy/vscode-gpm/commit/1b1d8d5))



<a name="0.16.0"></a>
# [0.16.0](https://github.com/axetroy/vscode-gpm/compare/v0.15.1...v0.16.0) (2018-04-07)


### Features

* support create project and owner in context menu ([6a98e27](https://github.com/axetroy/vscode-gpm/commit/6a98e27))
* support open in current window for owner and source ([8c88df9](https://github.com/axetroy/vscode-gpm/commit/8c88df9))
* support open in new window for owner and source ([43c5667](https://github.com/axetroy/vscode-gpm/commit/43c5667))
* support open source/owner in terminal command ([0ab1a1f](https://github.com/axetroy/vscode-gpm/commit/0ab1a1f))
* support remove owner and source command ([dd7a021](https://github.com/axetroy/vscode-gpm/commit/dd7a021))



<a name="0.15.1"></a>
## [0.15.1](https://github.com/axetroy/vscode-gpm/compare/v0.15.0...v0.15.1) (2018-04-06)


### Bug Fixes

* command list2openTerminal is not defined ([6f2334d](https://github.com/axetroy/vscode-gpm/commit/6f2334d))



<a name="0.15.0"></a>
# [0.15.0](https://github.com/axetroy/vscode-gpm/compare/v0.14.1...v0.15.0) (2018-04-04)


### Features

* support .gpmrc json file validate ([2a63943](https://github.com/axetroy/vscode-gpm/commit/2a63943))
* support auto set .gpmrc to json lang ([ed6960e](https://github.com/axetroy/vscode-gpm/commit/ed6960e))
* support open in terminal command ([c6810ee](https://github.com/axetroy/vscode-gpm/commit/c6810ee))



<a name="0.14.1"></a>
## [0.14.1](https://github.com/axetroy/vscode-gpm/compare/v0.14.0...v0.14.1) (2018-04-03)


### Bug Fixes

* try to fix bug in Windows ([126a3e5](https://github.com/axetroy/vscode-gpm/commit/126a3e5))



<a name="0.14.0"></a>
# [0.14.0](https://github.com/axetroy/vscode-gpm/compare/v0.13.1...v0.14.0) (2018-04-01)


### Bug Fixes

* fix icon path ([bb61c2d](https://github.com/axetroy/vscode-gpm/commit/bb61c2d))


### Features

* add config to set the tree view should be show or not ([9ecfb6b](https://github.com/axetroy/vscode-gpm/commit/9ecfb6b))
* support list to star and list to unstar command ([0f35966](https://github.com/axetroy/vscode-gpm/commit/0f35966))
* support star current project ([c314611](https://github.com/axetroy/vscode-gpm/commit/c314611))



<a name="0.13.1"></a>
## [0.13.1](https://github.com/axetroy/vscode-gpm/compare/v0.13.0...v0.13.1) (2018-03-29)


### Bug Fixes

* try support window ([b9c802b](https://github.com/axetroy/vscode-gpm/commit/b9c802b))



<a name="0.13.0"></a>
# [0.13.0](https://github.com/axetroy/vscode-gpm/compare/v0.12.1...v0.13.0) (2018-03-28)


### Features

* add config to set the behavior of search, default is open in new window ([c35db82](https://github.com/axetroy/vscode-gpm/commit/c35db82))



<a name="0.12.1"></a>
## [0.12.1](https://github.com/axetroy/vscode-gpm/compare/v0.12.0...v0.12.1) (2018-03-26)


### Bug Fixes

* fix open in new window not work ([122af2a](https://github.com/axetroy/vscode-gpm/commit/122af2a))



<a name="0.12.0"></a>
# [0.12.0](https://github.com/axetroy/vscode-gpm/compare/v0.11.0...v0.12.0) (2018-03-23)


### Features

* make sure if project cloned, opening dialog logic are same with other. ([19171f4](https://github.com/axetroy/vscode-gpm/commit/19171f4))



<a name="0.11.0"></a>
# [0.11.0](https://github.com/axetroy/vscode-gpm/compare/v0.10.0...v0.11.0) (2018-03-23)


### Features

* improve in search project ([eb17cbb](https://github.com/axetroy/vscode-gpm/commit/eb17cbb))
* listen on command and active extension ([0defc26](https://github.com/axetroy/vscode-gpm/commit/0defc26))
* now only show Unstar on stared project ([29fdb93](https://github.com/axetroy/vscode-gpm/commit/29fdb93))
* now show the command even the gpm haven't init ([b36891c](https://github.com/axetroy/vscode-gpm/commit/b36891c))
* show command after init job done ([9659ade](https://github.com/axetroy/vscode-gpm/commit/9659ade))
* unsubscript when inactive extension ([f32b4c5](https://github.com/axetroy/vscode-gpm/commit/f32b4c5))



<a name="0.10.0"></a>
# [0.10.0](https://github.com/axetroy/vscode-gpm/compare/v0.9.0...v0.10.0) (2018-03-22)


### Features

* add commands, 'list project to open' and 'list project to open in new window' and 'list project to remove' and add search button in tree view title ([e2da63a](https://github.com/axetroy/vscode-gpm/commit/e2da63a))



<a name="0.9.0"></a>
# [0.9.0](https://github.com/axetroy/vscode-gpm/compare/v0.8.4...v0.9.0) (2018-03-22)


### Features

* if root path not exist, then ask user create it or not ([cc7caed](https://github.com/axetroy/vscode-gpm/commit/cc7caed))
* when disable extension, auto clear cache ([197f9bf](https://github.com/axetroy/vscode-gpm/commit/197f9bf))



<a name="0.8.4"></a>
## [0.8.4](https://github.com/axetroy/vscode-gpm/compare/v0.8.3...v0.8.4) (2018-03-22)


### Bug Fixes

* fix bug can not open project ([38df6c7](https://github.com/axetroy/vscode-gpm/commit/38df6c7))



<a name="0.8.3"></a>
## [0.8.3](https://github.com/axetroy/vscode-gpm/compare/v0.8.2...v0.8.3) (2018-03-21)


### Features

* do not pipe command message to output channel ([4b638f9](https://github.com/axetroy/vscode-gpm/commit/4b638f9))



<a name="0.8.2"></a>
## [0.8.2](https://github.com/axetroy/vscode-gpm/compare/v0.8.1...v0.8.2) (2018-03-21)



<a name="0.8.1"></a>
## [0.8.1](https://github.com/axetroy/vscode-gpm/compare/v0.8.0...v0.8.1) (2018-03-21)



<a name="0.8.0"></a>
# [0.8.0](https://github.com/axetroy/vscode-gpm/compare/v0.7.0...v0.8.0) (2018-03-21)


### Bug Fixes

* remove project did not unstar it ([5b2c9b7](https://github.com/axetroy/vscode-gpm/commit/5b2c9b7))
* whatever hook run, it should going on ([81091fb](https://github.com/axetroy/vscode-gpm/commit/81091fb))


### Features

* add clear cache command ([d3914f9](https://github.com/axetroy/vscode-gpm/commit/d3914f9))
* add config to set hook should run auto or not, default is not run hook ([bf59a95](https://github.com/axetroy/vscode-gpm/commit/bf59a95))
* support clear your stars ([4780e7d](https://github.com/axetroy/vscode-gpm/commit/4780e7d))
* support preremove and postremove hook ([1f84262](https://github.com/axetroy/vscode-gpm/commit/1f84262))
* support prinf clone process in status bar, and now command is cancelable just click status bar ([e094f12](https://github.com/axetroy/vscode-gpm/commit/e094f12))



<a name="0.7.0"></a>
# [0.7.0](https://github.com/axetroy/vscode-gpm/compare/v0.6.0...v0.7.0) (2018-03-21)


### Features

* watch gpm.rootPath change and refresh tree view ([2631af0](https://github.com/axetroy/vscode-gpm/commit/2631af0))



<a name="0.6.0"></a>
# [0.6.0](https://github.com/axetroy/vscode-gpm/compare/v0.5.0...v0.6.0) (2018-03-21)


### Bug Fixes

* fix contextValue for folder ([a5403f2](https://github.com/axetroy/vscode-gpm/commit/a5403f2))


### Features

* support rename project if it exist ([9ac17e3](https://github.com/axetroy/vscode-gpm/commit/9ac17e3))
* support run hoos from .gpmrc ([c290d88](https://github.com/axetroy/vscode-gpm/commit/c290d88))



<a name="0.5.0"></a>
# [0.5.0](https://github.com/axetroy/vscode-gpm/compare/v0.4.1...v0.5.0) (2018-03-20)


### Features

* prinf the message of git clone ([d01d683](https://github.com/axetroy/vscode-gpm/commit/d01d683))



<a name="0.4.1"></a>
## [0.4.1](https://github.com/axetroy/vscode-gpm/compare/v0.4.0...v0.4.1) (2018-03-20)


### Bug Fixes

* can not open file ([7d9eff5](https://github.com/axetroy/vscode-gpm/commit/7d9eff5))



<a name="0.4.0"></a>
# [0.4.0](https://github.com/axetroy/vscode-gpm/compare/4eed2aa...v0.4.0) (2018-03-20)


### Bug Fixes

* ensure dir exist ([94c3755](https://github.com/axetroy/vscode-gpm/commit/94c3755))
* fix config not work ([0b26a88](https://github.com/axetroy/vscode-gpm/commit/0b26a88))
* fix prune icon ([6c53201](https://github.com/axetroy/vscode-gpm/commit/6c53201))


### Features

* add google icon ([0feb391](https://github.com/axetroy/vscode-gpm/commit/0feb391))
* add icon for tree view ([4eed2aa](https://github.com/axetroy/vscode-gpm/commit/4eed2aa))
* remove project, if parent is empty, then remove parent folder ([950af70](https://github.com/axetroy/vscode-gpm/commit/950af70))
* support add project ([17f1b61](https://github.com/axetroy/vscode-gpm/commit/17f1b61))
* support env in rootPath ([616852a](https://github.com/axetroy/vscode-gpm/commit/616852a))
* support open project in new window ([bf366f2](https://github.com/axetroy/vscode-gpm/commit/bf366f2))
* support prune ([1d56786](https://github.com/axetroy/vscode-gpm/commit/1d56786))
* support prune ([8536fc4](https://github.com/axetroy/vscode-gpm/commit/8536fc4))
* support remove project ([93f8504](https://github.com/axetroy/vscode-gpm/commit/93f8504))
* support star and unstar project ([1ec8e8b](https://github.com/axetroy/vscode-gpm/commit/1ec8e8b))



