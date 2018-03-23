"use strict";
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as fs from "fs-extra";
import { Gpm } from "./gpm";
import { ProjectTreeProvider, IRepository } from "./projectTree";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  // status bar
  const statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  const explorer = new ProjectTreeProvider(context);
  const gpm = new Gpm(context, explorer, statusBar);

  await gpm.init();

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
    vscode.commands.registerCommand(
      "gpm.openInCurrentWindow",
      (repository: IRepository) => gpm.openInCurrentWindow(repository)
    )
  );

  // list project to open in current window
  context.subscriptions.push(
    vscode.commands.registerCommand("gpm.list2open", async () => {
      const repository = await gpm.select();

      if (repository) {
        return gpm.openInCurrentWindow(repository);
      }
    })
  );

  // open project in new window
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "gpm.openInNewWindow",
      (repository: IRepository) => gpm.openInNewWindow(repository)
    )
  );

  // list project to open in new window
  context.subscriptions.push(
    vscode.commands.registerCommand("gpm.list2openNew", async () => {
      const repository = await gpm.select();

      if (repository) {
        return gpm.openInNewWindow(repository);
      }
    })
  );

  // refresh project
  context.subscriptions.push(
    vscode.commands.registerCommand("gpm.refresh", () => gpm.refresh())
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
    vscode.commands.registerCommand("gpm.remove", (repository: IRepository) =>
      gpm.remove(repository)
    )
  );

  // list project to remove
  context.subscriptions.push(
    vscode.commands.registerCommand("gpm.list2remove", async () => {
      const repository = await gpm.select();
      if (repository) {
        return gpm.remove(repository);
      }
    })
  );

  // star project
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "gpm.star",
      async (repository: IRepository) => {
        await explorer.star.star(repository);
        await gpm.refresh();
      }
    )
  );

  // unstar project
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "gpm.unstar",
      async (repository: IRepository) => {
        await explorer.star.unstar(repository);
        await gpm.refresh();
      }
    )
  );

  // clear star
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "gpm.clearStars",
      async (repository: IRepository) => {
        await explorer.star.clear();
        await gpm.refresh();
      }
    )
  );

  // interrupt running command
  context.subscriptions.push(
    vscode.commands.registerCommand("gpm.interruptCommand", () =>
      gpm.interruptCommand()
    )
  );

  // search project
  context.subscriptions.push(
    vscode.commands.registerCommand("gpm.search", () => gpm.search())
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
    vscode.window.registerTreeDataProvider("GPMExplorer", explorer)
  );
}

// this method is called when your extension is deactivated
export async function deactivate(context: vscode.ExtensionContext) {
  // when disable extension
  // clear cache
  const gpm = new Gpm(
    context,
    new ProjectTreeProvider(context),
    vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100)
  );
  try {
    await fs.remove(gpm.cachePath);
  } catch (err) {
    console.error(err);
  }
}
