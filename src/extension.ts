"use strict";
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as fs from "fs-extra";
import { Gpm } from "./gpm";
import { ProjectTreeProvider, IRepo } from "./projectTree";
import { getRootPath } from "./config";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  const rootPath: string = getRootPath();

  // if root path not exist
  // ask user create it or not
  if (!await fs.pathExists(rootPath)) {
    const action = await vscode.window.showInformationMessage(
      `GPM root folder '${rootPath}' not found.`,
      "Create",
      "Cancel"
    );
    switch (action) {
      case "Create":
        await fs.ensureDir(rootPath);
        break;
      default:
    }
  }

  // status bar
  const statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );

  const gpm = new Gpm(context);

  gpm.statusBar = statusBar;

  // overwrite refresh method
  gpm.refresh = () => gpmExplorer.refresh();

  const gpmExplorer = new ProjectTreeProvider(context);

  gpmExplorer.traverse();

  // open file
  context.subscriptions.push(
    vscode.commands.registerCommand("gpm.open", async filepath => {
      try {
        const statInfo = await fs.stat(filepath);
        if (statInfo.isFile()) {
          const openPath = vscode.Uri.file(filepath);
          vscode.workspace
            .openTextDocument(openPath)
            .then(doc => vscode.window.showTextDocument(doc));
        }
      } catch (err) {
        vscode.window.showErrorMessage(err.message);
      }
    })
  );

  // open project in current window
  context.subscriptions.push(
    vscode.commands.registerCommand("gpm.openInCurrentWindow", (repo: IRepo) =>
      vscode.commands.executeCommand(
        "vscode.openFolder",
        vscode.Uri.file(repo.path)
      )
    )
  );

  // list project to open in current window
  context.subscriptions.push(
    vscode.commands.registerCommand("gpm.list2open", async () => {
      const repo = await gpmExplorer.selectPick();

      if (!repo) {
        return;
      }

      return vscode.commands.executeCommand(
        "vscode.openFolder",
        vscode.Uri.file(repo.path)
      );
    })
  );

  // open project in new window
  context.subscriptions.push(
    vscode.commands.registerCommand("gpm.openInNewWindow", (repo: IRepo) =>
      vscode.commands.executeCommand(
        "vscode.openFolder",
        vscode.Uri.file(repo.path),
        true
      )
    )
  );

  // list project to open in new window
  context.subscriptions.push(
    vscode.commands.registerCommand("gpm.list2openNew", async () => {
      const repo = await gpmExplorer.selectPick();

      if (!repo) {
        return;
      }

      return vscode.commands.executeCommand(
        "vscode.openFolder",
        vscode.Uri.file(repo.path),
        true
      );
    })
  );

  // refresh project
  context.subscriptions.push(
    vscode.commands.registerCommand("gpm.refresh", () => gpmExplorer.refresh())
  );

  // clear cache
  context.subscriptions.push(
    vscode.commands.registerCommand("gpm.clearCache", () => gpm.cleanCache())
  );

  // prune project
  context.subscriptions.push(
    vscode.commands.registerCommand("gpm.prune", () => gpm.prune())
  );

  // add project
  context.subscriptions.push(
    vscode.commands.registerCommand("gpm.add", () => gpm.add())
  );

  // remove project
  context.subscriptions.push(
    vscode.commands.registerCommand("gpm.remove", (repo: IRepo) =>
      gpm.remove(repo, gpmExplorer)
    )
  );

  // list project to remove
  context.subscriptions.push(
    vscode.commands.registerCommand("gpm.list2remove", async () => {
      const repo = await gpmExplorer.selectPick();
      if (repo) {
        return gpm.remove(repo, gpmExplorer);
      }
    })
  );

  // star project
  // TODO: support star same name project
  context.subscriptions.push(
    vscode.commands.registerCommand("gpm.star", async (repo: IRepo) => {
      await gpmExplorer.star.star(repo);
      await gpmExplorer.refresh();
    })
  );

  // unstar project
  // TODO: only show unstar when project was stared
  context.subscriptions.push(
    vscode.commands.registerCommand("gpm.unstar", async (repo: IRepo) => {
      await gpmExplorer.star.unstar(repo);
      await gpmExplorer.refresh();
    })
  );

  // interrupt running command
  context.subscriptions.push(
    vscode.commands.registerCommand("gpm.interruptCommand", () =>
      gpm.interruptCommand()
    )
  );

  // search project
  context.subscriptions.push(
    vscode.commands.registerCommand("gpm.search", async () => {
      type DoAction = "Open" | "Remove" | "Cancel";

      const repo = await gpmExplorer.selectPick();

      if (!repo) {
        return;
      }

      const repoSymbol: string = `@${repo.owner}/${repo.repo}`;

      const doAction = await vscode.window.showInformationMessage(
        `What do you want to do about ${repoSymbol}?`,
        "Open",
        "Remove",
        "Cancel"
      );

      switch (doAction as DoAction) {
        case "Open":
          type OpenAction = "Current Window" | "New Window" | "Cancel";
          const action = await vscode.window.showInformationMessage(
            `Which way to open ${repoSymbol}?`,
            "Current Window",
            "New Window",
            "Cancel"
          );

          switch (action as OpenAction) {
            case "Current Window":
              return vscode.commands.executeCommand(
                "vscode.openFolder",
                vscode.Uri.file(repo.path)
              );
            case "New Window":
              return vscode.commands.executeCommand(
                "vscode.openFolder",
                vscode.Uri.file(repo.path),
                true
              );
            default:
              return;
          }

        case "Remove":
          return gpm.remove(repo, gpmExplorer);
        default:
          return;
      }
    })
  );

  // clear star
  context.subscriptions.push(
    vscode.commands.registerCommand("gpm.clearStars", async (repo: IRepo) => {
      await gpmExplorer.star.clear();
      await gpmExplorer.refresh();
    })
  );

  // watch config change and refresh
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration("gpm.rootPath")) {
        gpmExplorer.refresh();
      }
    })
  );

  vscode.commands.executeCommand("setContext", "gpmInit", true);

  // tree view
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("gpmExplorer", gpmExplorer)
  );
}

// this method is called when your extension is deactivated
export async function deactivate(context: vscode.ExtensionContext) {
  // when disable extension
  // clear cache
  const gpm = new Gpm(context);
  try {
    await fs.remove(gpm.cachePath);
  } catch (err) {
    console.error(err);
  }
}
