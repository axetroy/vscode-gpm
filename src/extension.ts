"use strict";
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs-extra";
import { Gpm } from "./gpm";
import { ProjectTreeProvider, IRepo } from "./projectTree";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  const gpm = new Gpm(context);
  // overwrite refresh method
  gpm.refresh = () => gpmExplorer.refresh();

  const gpmExplorer = new ProjectTreeProvider(context);

  // open file
  vscode.commands.registerCommand("gpm.open", filepath => {
    fs
      .stat(filepath)
      .then(stat => {
        if (stat.isFile()) {
          const openPath = vscode.Uri.file(filepath);
          vscode.workspace.openTextDocument(openPath).then(doc => {
            vscode.window.showTextDocument(doc);
          });
        }
      })
      .catch((err: Error) => {
        vscode.window.showErrorMessage(err.message);
      });
  });

  // open project in current window
  vscode.commands.registerCommand("gpm.openInCurrentWindow", element => {
    const openPath = vscode.Uri.file(element.filepath);
    vscode.commands.executeCommand("vscode.openFolder", openPath);
  });

  // open project in new window
  vscode.commands.registerCommand("gpm.openInNewWindow", element => {
    const openPath = vscode.Uri.file(element.filepath);
    vscode.commands.executeCommand("vscode.openFolder", openPath, true);
  });

  // refresh project
  vscode.commands.registerCommand("gpm.refreshProject", element => {
    gpmExplorer.refresh();
  });

  // prune project
  vscode.commands.registerCommand("gpm.pruneProject", () => gpm.prune());

  // add project
  vscode.commands.registerCommand("gpm.addProject", () => gpm.add());

  // remove project
  vscode.commands.registerCommand("gpm.removeProject", async (repo: IRepo) => {
    try {
      const action = await vscode.window.showInformationMessage(
        "[Irrevocable] Are you sure to remove project?",
        "Yes",
        "No"
      );

      if (action !== "Yes") {
        return;
      }

      // remove project
      await fs.remove(repo.path);

      const ownerPath: string = path.dirname(repo.path);
      const sourcePath: string = path.dirname(path.dirname(repo.path));

      const projectList = await fs.readdir(ownerPath);

      // if project is empty, remove owner folder
      if (!projectList || !projectList.length) {
        await fs.remove(ownerPath);
      }

      const ownerList = await fs.readdir(sourcePath);

      // if owner is empty, remove source folder
      if (!ownerList || !ownerList.length) {
        await fs.remove(sourcePath);
      }

      vscode.window.showInformationMessage(
        `@${repo.owner}/${repo.repo} have been removed.`
      );
      gpmExplorer.refresh(); // refresh
    } catch (err) {
      vscode.window.showErrorMessage(err.message);
    }
  });

  // star project
  // TODO: support star same name project
  vscode.commands.registerCommand("gpm.starProject", async (repo: IRepo) => {
    await gpmExplorer.star.star(repo);
    await gpmExplorer.refresh();
  });

  // unstar project
  // TODO: only show unstar when project was stared
  vscode.commands.registerCommand("gpm.unstarProject", async (repo: IRepo) => {
    await gpmExplorer.star.unstar(repo);
    await gpmExplorer.refresh();
  });

  // clear star
  vscode.commands.registerCommand("gpm.clearStarProject", async (repo: IRepo) => {
    await gpmExplorer.star.clear();
    await gpmExplorer.refresh();
  });

  // watch config change and refresh
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration("gpm.rootPath")) {
        gpmExplorer.refresh();
      }
    })
  );

  vscode.window.registerTreeDataProvider("gpmExplorer", gpmExplorer);
}

// this method is called when your extension is deactivated
export function deactivate() {
  // when disable extension
}
