## [1.2.1](https://github.com/axetroy/vscode-gpm/compare/v1.2.0...v1.2.1) (2019-02-08)


### Bug Fixes

* add to workspace command not in activationEvents ([cd6d90a](https://github.com/axetroy/vscode-gpm/commit/cd6d90a))



# [1.2.0](https://github.com/axetroy/vscode-gpm/compare/v1.1.1...v1.2.0) (2019-02-07)


### Features

* allow add project to workspace. close [#22](https://github.com/axetroy/vscode-gpm/issues/22) ([f75a625](https://github.com/axetroy/vscode-gpm/commit/f75a625))



## [1.1.1](https://github.com/axetroy/vscode-gpm/compare/v1.1.0...v1.1.1) (2019-01-27)


### Features

* improve error messages ([e416b4e](https://github.com/axetroy/vscode-gpm/commit/e416b4e))
* support clone with submodules ([9fecfd6](https://github.com/axetroy/vscode-gpm/commit/9fecfd6))
* upgrade deps ([628c43a](https://github.com/axetroy/vscode-gpm/commit/628c43a))



# [1.1.0](https://github.com/axetroy/vscode-gpm/compare/v1.0.0...v1.1.0) (2018-12-18)


### Bug Fixes

* fix searchBehavior config enum ([12de9fd](https://github.com/axetroy/vscode-gpm/commit/12de9fd))
* fix travers in flatten mode ([55f5c7b](https://github.com/axetroy/vscode-gpm/commit/55f5c7b))


### Features

* add flatten option to show flat project in tree view, closed [#20](https://github.com/axetroy/vscode-gpm/issues/20) ([c0be31e](https://github.com/axetroy/vscode-gpm/commit/c0be31e))



# [1.0.0](https://github.com/axetroy/vscode-gpm/compare/v0.26.0...v1.0.0) (2018-07-31)


### Bug Fixes

* deactivate and clean cache ([959da9a](https://github.com/axetroy/vscode-gpm/commit/959da9a))
* fix prune not work like expect ([b406c0f](https://github.com/axetroy/vscode-gpm/commit/b406c0f))
* i18n not work ([61a75a4](https://github.com/axetroy/vscode-gpm/commit/61a75a4))


### Features

* add d.ts file for 3th party lib ([a0cacb3](https://github.com/axetroy/vscode-gpm/commit/a0cacb3))
* add tooltip ([3d6b87d](https://github.com/axetroy/vscode-gpm/commit/3d6b87d))
* group source by rootPath ([1813bad](https://github.com/axetroy/vscode-gpm/commit/1813bad))
* sort source/owner/repo ([b3d13d5](https://github.com/axetroy/vscode-gpm/commit/b3d13d5))
* update en/cn translation ([307c728](https://github.com/axetroy/vscode-gpm/commit/307c728))



# [0.26.0](https://github.com/axetroy/vscode-gpm/compare/v0.25.0...v0.26.0) (2018-07-27)


### Features

* When there is only one rootPath, no pop-up window selection ([6d4f8e3](https://github.com/axetroy/vscode-gpm/commit/6d4f8e3))



# [0.25.0](https://github.com/axetroy/vscode-gpm/compare/v0.24.0...v0.25.0) (2018-07-27)


### Features

* sort the repo pick , close [#16](https://github.com/axetroy/vscode-gpm/issues/16) ([8d6451e](https://github.com/axetroy/vscode-gpm/commit/8d6451e))



# [0.24.0](https://github.com/axetroy/vscode-gpm/compare/v0.23.5...v0.24.0) (2018-07-26)


### Bug Fixes

* do not alert error when process be terminated. always remove temp file ([1f7cf01](https://github.com/axetroy/vscode-gpm/commit/1f7cf01))
* open file behavior not same with native ([817489d](https://github.com/axetroy/vscode-gpm/commit/817489d))


### Features

* add copy file path menu ([d2da24b](https://github.com/axetroy/vscode-gpm/commit/d2da24b))
* add gitee icon ([8f952a8](https://github.com/axetroy/vscode-gpm/commit/8f952a8))
* add icon for item pick ([880658c](https://github.com/axetroy/vscode-gpm/commit/880658c))
* add icon for pick item ([15225a8](https://github.com/axetroy/vscode-gpm/commit/15225a8))
* update english translation ([160737f](https://github.com/axetroy/vscode-gpm/commit/160737f))



## [0.23.5](https://github.com/axetroy/vscode-gpm/compare/v0.23.4...v0.23.5) (2018-07-25)


### Bug Fixes

* clear all stared project will not refresh ([b3595c6](https://github.com/axetroy/vscode-gpm/commit/b3595c6))



## [0.23.4](https://github.com/axetroy/vscode-gpm/compare/v0.23.3...v0.23.4) (2018-07-25)



## [0.23.3](https://github.com/axetroy/vscode-gpm/compare/v0.23.2...v0.23.3) (2018-07-25)


### Bug Fixes

* can not close stream ([eec0051](https://github.com/axetroy/vscode-gpm/commit/eec0051))


### Features

* now will not close input box when focus out ([70f4def](https://github.com/axetroy/vscode-gpm/commit/70f4def))



## [0.23.2](https://github.com/axetroy/vscode-gpm/compare/v0.23.1...v0.23.2) (2018-07-24)


### Bug Fixes

* deps ([e4b1b66](https://github.com/axetroy/vscode-gpm/commit/e4b1b66))



## [0.23.1](https://github.com/axetroy/vscode-gpm/compare/v0.23.0...v0.23.1) (2018-07-24)


### Bug Fixes

* tree view item's id duplicate [#13](https://github.com/axetroy/vscode-gpm/issues/13) ([1838f64](https://github.com/axetroy/vscode-gpm/commit/1838f64))


### Features

* update fs-extra@7.0.7 and git-url-parse@10.0.1 ([796880b](https://github.com/axetroy/vscode-gpm/commit/796880b))


### Performance Improvements

* add p-map for better performance file exploer ([f7d58e9](https://github.com/axetroy/vscode-gpm/commit/f7d58e9))



# [0.23.0](https://github.com/axetroy/vscode-gpm/compare/v0.22.0...v0.23.0) (2018-07-06)


### Bug Fixes

* compile error ([961281d](https://github.com/axetroy/vscode-gpm/commit/961281d))


### Features

* confirm project name before you remove it. ([14e4844](https://github.com/axetroy/vscode-gpm/commit/14e4844))
* update chinese translate ([31bca3e](https://github.com/axetroy/vscode-gpm/commit/31bca3e))



# [0.22.0](https://github.com/axetroy/vscode-gpm/compare/v0.21.3...v0.22.0) (2018-07-06)


### Features

* 增加i18n的支持 close [#2](https://github.com/axetroy/vscode-gpm/issues/2) ([720055e](https://github.com/axetroy/vscode-gpm/commit/720055e))



## [0.21.3](https://github.com/axetroy/vscode-gpm/compare/v0.21.2...v0.21.3) (2018-07-05)


### Bug Fixes

* bug ([833966b](https://github.com/axetroy/vscode-gpm/commit/833966b))



## [0.21.2](https://github.com/axetroy/vscode-gpm/compare/v0.21.1...v0.21.2) (2018-07-05)


### Bug Fixes

* fix rootPath can not container space when use string as it ([8d4f3ae](https://github.com/axetroy/vscode-gpm/commit/8d4f3ae))



## [0.21.1](https://github.com/axetroy/vscode-gpm/compare/v0.21.0...v0.21.1) (2018-07-05)


### Bug Fixes

* rootPath promble in old version ([868b4b0](https://github.com/axetroy/vscode-gpm/commit/868b4b0))



# [0.21.0](https://github.com/axetroy/vscode-gpm/compare/v0.20.1...v0.21.0) (2018-06-22)


### Bug Fixes

* fix type for configuration property rootPath ([c3b4a99](https://github.com/axetroy/vscode-gpm/commit/c3b4a99))


### Features

* change logo ([23b4f95](https://github.com/axetroy/vscode-gpm/commit/23b4f95))
* no more active extension by default ([376e4b8](https://github.com/axetroy/vscode-gpm/commit/376e4b8))
* support golang icon in tree view ([376abea](https://github.com/axetroy/vscode-gpm/commit/376abea))



## [0.20.1](https://github.com/axetroy/vscode-gpm/compare/v0.20.0...v0.20.1) (2018-06-13)


### Features

* list project to remove before you confirm ([f8588e1](https://github.com/axetroy/vscode-gpm/commit/f8588e1))



# [0.20.0](https://github.com/axetroy/vscode-gpm/compare/v0.19.0...v0.20.0) (2018-06-07)


### Features

* no more show cloning message when add project ([984eba2](https://github.com/axetroy/vscode-gpm/commit/984eba2))
* support multiple rootPath close [#12](https://github.com/axetroy/vscode-gpm/issues/12) ([a92f7b7](https://github.com/axetroy/vscode-gpm/commit/a92f7b7))



# [0.19.0](https://github.com/axetroy/vscode-gpm/compare/v0.18.0...v0.19.0) (2018-05-28)


### Features

* for performance, now gpm will not pre init anymore. only init when you use it. ([24e4563](https://github.com/axetroy/vscode-gpm/commit/24e4563))
* remove .gpmrc.json associations ([6c36074](https://github.com/axetroy/vscode-gpm/commit/6c36074))
* remove showExplorer config, now explorer is always show ([0ad91de](https://github.com/axetroy/vscode-gpm/commit/0ad91de))



# [0.18.0](https://github.com/axetroy/vscode-gpm/compare/v0.17.0...v0.18.0) (2018-05-28)


### Features

* move explorer to activitybar ([55e45be](https://github.com/axetroy/vscode-gpm/commit/55e45be))



# [0.17.0](https://github.com/axetroy/vscode-gpm/compare/v0.16.3...v0.17.0) (2018-05-19)


### Features

* pipe process to writable statusbar ([793063c](https://github.com/axetroy/vscode-gpm/commit/793063c))



## [0.16.3](https://github.com/axetroy/vscode-gpm/compare/v0.16.2...v0.16.3) (2018-05-17)


### Features

* no more use home dir as temp dir ([c188912](https://github.com/axetroy/vscode-gpm/commit/c188912))



## [0.16.2](https://github.com/axetroy/vscode-gpm/compare/v0.16.1...v0.16.2) (2018-04-11)


### Bug Fixes

* add missing return type for openTerminal method ([9131c95](https://github.com/axetroy/vscode-gpm/commit/9131c95))
* can not open terminal if it have been close or exit before ([de87fac](https://github.com/axetroy/vscode-gpm/commit/de87fac))



## [0.16.1](https://github.com/axetroy/vscode-gpm/compare/v0.16.0...v0.16.1) (2018-04-09)


### Bug Fixes

* Update config in workspace, It will create .vscode folder ([1b25f66](https://github.com/axetroy/vscode-gpm/commit/1b25f66))


### Features

* Upgrade deps ([1b1d8d5](https://github.com/axetroy/vscode-gpm/commit/1b1d8d5))



# [0.16.0](https://github.com/axetroy/vscode-gpm/compare/v0.15.1...v0.16.0) (2018-04-07)


### Features

* support create project and owner in context menu ([6a98e27](https://github.com/axetroy/vscode-gpm/commit/6a98e27))
* support open in current window for owner and source ([8c88df9](https://github.com/axetroy/vscode-gpm/commit/8c88df9))
* support open in new window for owner and source ([43c5667](https://github.com/axetroy/vscode-gpm/commit/43c5667))
* support open source/owner in terminal command ([0ab1a1f](https://github.com/axetroy/vscode-gpm/commit/0ab1a1f))
* support remove owner and source command ([dd7a021](https://github.com/axetroy/vscode-gpm/commit/dd7a021))



## [0.15.1](https://github.com/axetroy/vscode-gpm/compare/v0.15.0...v0.15.1) (2018-04-06)


### Bug Fixes

* command list2openTerminal is not defined ([6f2334d](https://github.com/axetroy/vscode-gpm/commit/6f2334d))



# [0.15.0](https://github.com/axetroy/vscode-gpm/compare/v0.14.1...v0.15.0) (2018-04-04)


### Features

* support .gpmrc json file validate ([2a63943](https://github.com/axetroy/vscode-gpm/commit/2a63943))
* support auto set .gpmrc to json lang ([ed6960e](https://github.com/axetroy/vscode-gpm/commit/ed6960e))
* support open in terminal command ([c6810ee](https://github.com/axetroy/vscode-gpm/commit/c6810ee))



## [0.14.1](https://github.com/axetroy/vscode-gpm/compare/v0.14.0...v0.14.1) (2018-04-03)


### Bug Fixes

* try to fix bug in Windows ([126a3e5](https://github.com/axetroy/vscode-gpm/commit/126a3e5))



# [0.14.0](https://github.com/axetroy/vscode-gpm/compare/v0.13.1...v0.14.0) (2018-04-01)


### Bug Fixes

* fix icon path ([bb61c2d](https://github.com/axetroy/vscode-gpm/commit/bb61c2d))


### Features

* add config to set the tree view should be show or not ([9ecfb6b](https://github.com/axetroy/vscode-gpm/commit/9ecfb6b))
* support list to star and list to unstar command ([0f35966](https://github.com/axetroy/vscode-gpm/commit/0f35966))
* support star current project ([c314611](https://github.com/axetroy/vscode-gpm/commit/c314611))



## [0.13.1](https://github.com/axetroy/vscode-gpm/compare/v0.13.0...v0.13.1) (2018-03-29)


### Bug Fixes

* try support window ([b9c802b](https://github.com/axetroy/vscode-gpm/commit/b9c802b))



# [0.13.0](https://github.com/axetroy/vscode-gpm/compare/v0.12.1...v0.13.0) (2018-03-28)


### Features

* add config to set the behavior of search, default is open in new window ([c35db82](https://github.com/axetroy/vscode-gpm/commit/c35db82))



## [0.12.1](https://github.com/axetroy/vscode-gpm/compare/v0.12.0...v0.12.1) (2018-03-26)


### Bug Fixes

* fix open in new window not work ([122af2a](https://github.com/axetroy/vscode-gpm/commit/122af2a))



# [0.12.0](https://github.com/axetroy/vscode-gpm/compare/v0.11.0...v0.12.0) (2018-03-23)


### Features

* make sure if project cloned, opening dialog logic are same with other. ([19171f4](https://github.com/axetroy/vscode-gpm/commit/19171f4))



# [0.11.0](https://github.com/axetroy/vscode-gpm/compare/v0.10.0...v0.11.0) (2018-03-23)


### Features

* improve in search project ([eb17cbb](https://github.com/axetroy/vscode-gpm/commit/eb17cbb))
* listen on command and active extension ([0defc26](https://github.com/axetroy/vscode-gpm/commit/0defc26))
* now only show Unstar on stared project ([29fdb93](https://github.com/axetroy/vscode-gpm/commit/29fdb93))
* now show the command even the gpm haven't init ([b36891c](https://github.com/axetroy/vscode-gpm/commit/b36891c))
* show command after init job done ([9659ade](https://github.com/axetroy/vscode-gpm/commit/9659ade))
* unsubscript when inactive extension ([f32b4c5](https://github.com/axetroy/vscode-gpm/commit/f32b4c5))



# [0.10.0](https://github.com/axetroy/vscode-gpm/compare/v0.9.0...v0.10.0) (2018-03-22)


### Features

* add commands, 'list project to open' and 'list project to open in new window' and 'list project to remove' and add search button in tree view title ([e2da63a](https://github.com/axetroy/vscode-gpm/commit/e2da63a))



# [0.9.0](https://github.com/axetroy/vscode-gpm/compare/v0.8.4...v0.9.0) (2018-03-22)


### Features

* if root path not exist, then ask user create it or not ([cc7caed](https://github.com/axetroy/vscode-gpm/commit/cc7caed))
* when disable extension, auto clear cache ([197f9bf](https://github.com/axetroy/vscode-gpm/commit/197f9bf))



## [0.8.4](https://github.com/axetroy/vscode-gpm/compare/v0.8.3...v0.8.4) (2018-03-22)


### Bug Fixes

* fix bug can not open project ([38df6c7](https://github.com/axetroy/vscode-gpm/commit/38df6c7))



## [0.8.3](https://github.com/axetroy/vscode-gpm/compare/v0.8.2...v0.8.3) (2018-03-21)


### Features

* do not pipe command message to output channel ([4b638f9](https://github.com/axetroy/vscode-gpm/commit/4b638f9))



## [0.8.2](https://github.com/axetroy/vscode-gpm/compare/v0.8.1...v0.8.2) (2018-03-21)



## [0.8.1](https://github.com/axetroy/vscode-gpm/compare/v0.8.0...v0.8.1) (2018-03-21)



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



# [0.7.0](https://github.com/axetroy/vscode-gpm/compare/v0.6.0...v0.7.0) (2018-03-21)


### Features

* watch gpm.rootPath change and refresh tree view ([2631af0](https://github.com/axetroy/vscode-gpm/commit/2631af0))



# [0.6.0](https://github.com/axetroy/vscode-gpm/compare/v0.5.0...v0.6.0) (2018-03-21)


### Bug Fixes

* fix contextValue for folder ([a5403f2](https://github.com/axetroy/vscode-gpm/commit/a5403f2))


### Features

* support rename project if it exist ([9ac17e3](https://github.com/axetroy/vscode-gpm/commit/9ac17e3))
* support run hoos from .gpmrc ([c290d88](https://github.com/axetroy/vscode-gpm/commit/c290d88))



# [0.5.0](https://github.com/axetroy/vscode-gpm/compare/v0.4.1...v0.5.0) (2018-03-20)


### Features

* prinf the message of git clone ([d01d683](https://github.com/axetroy/vscode-gpm/commit/d01d683))



## [0.4.1](https://github.com/axetroy/vscode-gpm/compare/v0.4.0...v0.4.1) (2018-03-20)


### Bug Fixes

* can not open file ([7d9eff5](https://github.com/axetroy/vscode-gpm/commit/7d9eff5))



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



