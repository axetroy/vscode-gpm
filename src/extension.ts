"use strict";
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs-extra";
import { Gpm } from "./gpm";
import { createRepository, createOwner, createSource } from "./projectTree";
import config from "./config";
import {
  ConfirmAction,
  IFile,
  ISource,
  IOwner,
  IRepository,
  Command
} from "./type";

import localize from "./localize";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(
  context: vscode.ExtensionContext
): Promise<void> {
  if (typeof config.rootPath === "string") {
    // if rootPath still set in string
    // change it to array
    const rootPath = config.select("rootPath");
    await rootPath.update([rootPath.get()], vscode.ConfigurationTarget.Global);
  }

  const gpm = new Gpm(context);

  // open file
  context.subscriptions.push(
    vscode.commands.registerCommand(
      Command.OpenFile,
      async (filepath: string): Promise<void> => {
        try {
          await vscode.commands.executeCommand(
            "vscode.open",
            vscode.Uri.file(filepath)
          );
        } catch (err) {
          vscode.window.showErrorMessage(err.message);
        }
      }
    )
  );

  // open project in current window
  context.subscriptions.push(
    vscode.commands.registerCommand(
      Command.OpenInCurrentWindow,
      (file: IFile) => gpm.openInCurrentWindow(file)
    )
  );

  // list project to open in current window
  context.subscriptions.push(
    vscode.commands.registerCommand(
      Command.ListProject2OpenInCurrentWindow,
      async () => {
        const repository = await gpm.selectRepository(void 0, {
          placeHolder: localize("tip.placeholder.list2open", "新窗口打开项目")
        });

        if (repository) {
          return gpm.openInCurrentWindow(repository);
        }
      }
    )
  );

  // open project in new window
  context.subscriptions.push(
    vscode.commands.registerCommand(Command.OpenInNewWindow, (file: IFile) =>
      gpm.openInNewWindow(file)
    )
  );

  // list project to open in new window
  context.subscriptions.push(
    vscode.commands.registerCommand(
      Command.ListProject2OpenInNewWindow,
      async () => {
        const repository = await gpm.selectRepository(void 0, {
          placeHolder: localize("tip.placeholder.list2openInNew", "新窗口打开")
        });

        if (repository) {
          return gpm.openInNewWindow(repository);
        }
      }
    )
  );

  // refresh project
  context.subscriptions.push(
    vscode.commands.registerCommand(Command.Refresh, gpm.refresh.bind(gpm))
  );

  // clear cache
  context.subscriptions.push(
    vscode.commands.registerCommand(
      Command.ClearCache,
      gpm.cleanCache.bind(gpm)
    )
  );

  // prune project
  context.subscriptions.push(
    vscode.commands.registerCommand(Command.Prune, gpm.prune.bind(gpm))
  );

  // add project
  context.subscriptions.push(
    vscode.commands.registerCommand(Command.AddProject, gpm.add.bind(gpm))
  );

  // remove project
  context.subscriptions.push(
    vscode.commands.registerCommand(
      Command.RemoveProject,
      async (repository: IRepository) => {
        const input = await vscode.window.showInputBox({
          placeHolder: localize("tip.message.irrevocable", "不能被撤销哦"),
          prompt: localize("tip.message.beforeRemove", "请输入名字", [
            repository.repository
          ])
        });

        if (!input) {
          return;
        }

        if (input !== repository.repository) {
          vscode.window.showErrorMessage(
            localize("err.invalidRepoName", "输入不正确", [
              input,
              repository.repository
            ])
          );
          return;
        }

        await gpm.remove(repository);
      }
    )
  );

  // remove owner
  context.subscriptions.push(
    vscode.commands.registerCommand(
      Command.RemoveOwner,
      async (owner: IOwner) => {
        const input = await vscode.window.showInputBox({
          placeHolder: localize("tip.message.irrevocable", "不能被撤销哦"),
          prompt: localize("tip.message.beforeRemoveOwner", "请输入名字", [
            owner.owner
          ])
        });

        if (!input) {
          return;
        }

        if (input !== owner.owner) {
          vscode.window.showErrorMessage(
            localize("err.invalidOwnerName", "输入不正确", [input, owner.owner])
          );
          return;
        }

        await gpm.removeOwner(owner);
      }
    )
  );

  // remove source
  context.subscriptions.push(
    vscode.commands.registerCommand(
      Command.RemoveSource,
      async (source: ISource) => {
        const input = await vscode.window.showInputBox({
          placeHolder: localize("tip.message.irrevocable", "不能被撤销哦"),
          prompt: localize("tip.message.beforeRemoveSource", "请输入名字", [
            source.source
          ])
        });

        if (!input) {
          return;
        }

        if (input !== source.source) {
          vscode.window.showErrorMessage(
            localize("err.invalidSourceName", "输入不正确", [
              input,
              source.source
            ])
          );
          return;
        }

        await gpm.removeSource(source);
      }
    )
  );

  // list project to remove
  context.subscriptions.push(
    vscode.commands.registerCommand(Command.ListProject2Remove, async () => {
      const repository = await gpm.selectRepository(void 0, {
        placeHolder: localize("tip.placeholder.list2remove", "请选择项目")
      });

      if (!repository) {
        return;
      }

      const yes = localize(ConfirmAction.Yes);

      const action = await vscode.window.showInformationMessage(
        localize("tip.message.beforeRemove", "你确定要删除吗", [
          repository.owner,
          repository.repository
        ]),
        yes,
        localize(ConfirmAction.No)
      );

      switch (action as ConfirmAction) {
        case yes:
          return gpm.remove(repository);
      }
    })
  );

  // star project
  context.subscriptions.push(
    vscode.commands.registerCommand(Command.Star, gpm.star.bind(gpm))
  );

  // star current project
  context.subscriptions.push(
    vscode.commands.registerCommand(
      Command.StarCurrentProject,
      async (repository: IRepository): Promise<void> => {
        // 当前项目的路径
        const rootPath = vscode.workspace.rootPath;
        if (!rootPath) {
          return;
        }
        const gpmRoot = path.join(rootPath, "..", "..", "..");

        // 如果存在的话
        if (config.rootPath.indexOf(gpmRoot) >= 0) {
          const repositoryName = path.basename(rootPath);
          const ownerName = path.basename(path.join(rootPath, ".."));
          const sourceName = path.basename(path.join(rootPath, "..", ".."));

          const source = createSource(context, sourceName, gpmRoot);
          const owner = createOwner(context, source, ownerName);
          const repositoryEntity = createRepository(
            context,
            owner,
            repositoryName
          );

          await gpm.star(repositoryEntity);
        } else {
          vscode.window.showWarningMessage(
            localize("err.invalidProject", "无效的项目", [rootPath])
          );
        }
      }
    )
  );

  // list project to star
  context.subscriptions.push(
    vscode.commands.registerCommand(Command.ListProject2Star, async () => {
      const repository = await gpm.selectRepository(void 0, {
        placeHolder: localize("tip.placeholder.list2star", "请选择项目")
      });

      if (repository) {
        return gpm.star(repository);
      }
    })
  );

  // unstar project
  context.subscriptions.push(
    vscode.commands.registerCommand(Command.Unstar, gpm.unstar.bind(gpm))
  );

  // list project to unstar
  context.subscriptions.push(
    vscode.commands.registerCommand(Command.ListProject2UnStar, async () => {
      const repository = await gpm.selectRepository(gpm.starList(), {
        placeHolder: localize("tip.placeholder.list2star", "请选择项目")
      });

      if (repository) {
        return gpm.unstar(repository);
      }
    })
  );

  // clear star
  context.subscriptions.push(
    vscode.commands.registerCommand(
      Command.ClearStars,
      gpm.clearStars.bind(gpm)
    )
  );

  // interrupt running command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      Command.InterruptCommand,
      gpm.interruptCommand.bind(gpm)
    )
  );

  // search project
  context.subscriptions.push(
    vscode.commands.registerCommand(Command.Search, gpm.search.bind(gpm))
  );

  // open project in terminal
  context.subscriptions.push(
    vscode.commands.registerCommand(
      Command.OpenInTerminal,
      gpm.openTerminal.bind(gpm)
    )
  );

  // list to open project in terminal
  context.subscriptions.push(
    vscode.commands.registerCommand(
      Command.ListProject2OpenInTerminal,
      async () => {
        const repository = await gpm.selectRepository(void 0, {
          placeHolder: localize(
            "tip.placeholder.list2OpenInTerminal",
            "请选择项目然后在终端打开"
          )
        });

        if (!repository) {
          return;
        }

        return gpm.openTerminal(repository);
      }
    )
  );

  // create repository
  context.subscriptions.push(
    vscode.commands.registerCommand(
      Command.CreateRepository,
      async (owner: IOwner) => {
        const repositoryName = await vscode.window.showInputBox({
          placeHolder: localize(
            "tip.placeholder.requireProject",
            "请输入项目名称"
          )
        });

        if (!repositoryName) {
          return;
        }

        const repositoryPath = path.join(owner.path, repositoryName);

        const exist: boolean = await fs.pathExists(repositoryPath);

        if (exist) {
          return;
        }

        await fs.ensureDir(repositoryPath);

        return gpm.refresh();
      }
    )
  );

  // create owner
  context.subscriptions.push(
    vscode.commands.registerCommand(
      Command.CreateOwner,
      async (source: ISource) => {
        const ownerName = await vscode.window.showInputBox({
          placeHolder: localize(
            "tip.placeholder.requireOwner",
            "请输入所有者名称"
          )
        });

        if (!ownerName) {
          return;
        }

        const ownerPath = path.join(source.path, ownerName);

        const exist: boolean = await fs.pathExists(ownerPath);

        if (exist) {
          return;
        }

        await fs.ensureDir(ownerPath);

        return gpm.refresh();
      }
    )
  );

  // watch config change and refresh
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration("gpm.rootPath")) {
        gpm.refresh();
      }
    })
  );

  // tree view
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("GPMExplorer", gpm.explorer)
  );
}

// this method is called when your extension is deactivated
export async function deactivate(
  context: vscode.ExtensionContext
): Promise<void> {
  // when disable extension
  // clear cache
  const gpm = new Gpm(context);
  try {
    await fs.remove(gpm.CachePath);
  } catch (err) {
    console.error(err);
  }
}
