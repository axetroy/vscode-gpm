"use strict";
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs-extra";
import { Gpm } from "./gpm";
import {
  ProjectTreeProvider,
  IRepository,
  createRepo,
  createOwner,
  createSource,
  IOwner,
  ISource
} from "./projectTree";
import { getField, updateField, getRootPath } from "./config";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  const CAN_SHOW_EXPLORER: string = "showExplorer";

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
      const repository = await gpm.selectRepository(void 0, {
        placeHolder: "Select a Project to Open in Current Window."
      });

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
      const repository = await gpm.selectRepository(void 0, {
        placeHolder: "Select a Project to Open in New Window."
      });

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
    vscode.commands.registerCommand(
      "gpm.remove",
      async (repository: IRepository) => {
        const action = await vscode.window.showInformationMessage(
          `[Irrevocable] Are you sure to remove project @${repository.owner}/${
            repository.repository
          }?`,
          "Yes",
          "No"
        );

        if (action !== "Yes") {
          return;
        }

        await gpm.remove(repository);
      }
    )
  );

  // remove owner
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "gpm.removeOwner",
      async (owner: IOwner) => {
        const action = await vscode.window.showInformationMessage(
          `[Irrevocable] Are you sure to remove all project of @${
            owner.owner
          }?`,
          "Yes",
          "No"
        );

        if (action !== "Yes") {
          return;
        }

        await gpm.removeOwner(owner);
      }
    )
  );

  // remove source
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "gpm.removeSource",
      async (source: ISource) => {
        const action = await vscode.window.showInformationMessage(
          `[Irrevocable] Are you sure to remove all project of ${
            source.source
          }?`,
          "Yes",
          "No"
        );

        if (action !== "Yes") {
          return;
        }

        await gpm.removeSource(source);
      }
    )
  );

  // list project to remove
  context.subscriptions.push(
    vscode.commands.registerCommand("gpm.list2remove", async () => {
      const repository = await gpm.selectRepository(void 0, {
        placeHolder: "Select a Project to Remove."
      });
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

  // star current project
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "gpm.starCurrent",
      async (repository: IRepository) => {
        const rootPath = vscode.workspace.rootPath;
        if (!rootPath) {
          return;
        }
        const gpmRoot = path.join(rootPath, "..", "..", "..");
        if (gpmRoot === getRootPath()) {
          const repoName = path.basename(rootPath);
          const ownerName = path.basename(path.join(rootPath, ".."));
          const sourceName = path.basename(path.join(rootPath, "..", ".."));

          const source = createSource(context, sourceName);
          const owner = createOwner(context, source, ownerName);
          const repo = createRepo(context, owner, repoName);

          await gpm.explorer.star.star(repo);
          gpm.refresh();
        } else {
          vscode.window.showWarningMessage(`Invalid project: '${rootPath}'`);
        }
      }
    )
  );

  // list project to star
  context.subscriptions.push(
    vscode.commands.registerCommand("gpm.list2star", async () => {
      const repository = await gpm.selectRepository(void 0, {
        placeHolder: "Select a Project to Star."
      });

      if (repository) {
        await gpm.explorer.star.star(repository);
        return gpm.refresh();
      }
    })
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

  // list project to unstar
  context.subscriptions.push(
    vscode.commands.registerCommand("gpm.list2unstar", async () => {
      const repository = await gpm.selectRepository(gpm.explorer.star.list(), {
        placeHolder: "Select a Project to Unstar."
      });

      if (repository) {
        await gpm.explorer.star.unstar(repository);
        return gpm.refresh();
      }
    })
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

  // toggle tree view
  context.subscriptions.push(
    vscode.commands.registerCommand("gpm.toggleExplorer", async () => {
      await updateField(CAN_SHOW_EXPLORER, !getField(CAN_SHOW_EXPLORER));
      await vscode.commands.executeCommand(
        "setContext",
        CAN_SHOW_EXPLORER,
        getField(CAN_SHOW_EXPLORER)
      );
    })
  );

  // open project in terminal
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "gpm.openInTerminal",
      (repo: IRepository) => {
        return gpm.openTerminal(repo);
      }
    )
  );

  // list to open project in terminal
  context.subscriptions.push(
    vscode.commands.registerCommand("gpm.list2openInTerminal", async () => {
      const repo = await gpm.selectRepository(void 0, {
        placeHolder: "Select a Project to Open in Terminal"
      });

      if (!repo) {
        return;
      }

      return gpm.openTerminal(repo);
    })
  );

  // watch config change and refresh
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration("gpm.rootPath")) {
        gpm.refresh();
      }
    })
  );

  vscode.commands.executeCommand(
    "setContext",
    CAN_SHOW_EXPLORER,
    !!getField(CAN_SHOW_EXPLORER)
  );

  // tree view
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("GPMExplorer", explorer)
  );

  const fileConfig = vscode.workspace.getConfiguration("files");
  const associations = fileConfig.get("associations") || {};

  fileConfig.update("associations", {
    ...associations,
    ...{
      ".gpmrc": "json"
    }
  });
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
