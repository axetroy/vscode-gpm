"use strict";
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { ProjectTreeProvider } from "./projectTree";
import * as fs from "fs-extra";
import { Gpm } from "./gpm";

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

  // open project command
  vscode.commands.registerCommand("gpm.openProject", element => {
    const openPath = vscode.Uri.file(element.filepath);
    vscode.commands.executeCommand("vscode.openFolder", openPath);
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
  vscode.commands.registerCommand("gpm.removeProject", async element => {
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
      await fs.remove(element.filepath);

      const projectList = await fs.readdir(element.dir);

      if (!projectList || !projectList.length) {
        await fs.remove(element.dir);
      }

      vscode.window.showInformationMessage(`Project have been remove.`);
      gpmExplorer.refresh(); // refresh
    } catch (err) {
      vscode.window.showErrorMessage(err.message);
    }
  });

  vscode.window.registerTreeDataProvider("gpmExplorer", gpmExplorer);
}

// this method is called when your extension is deactivated
export function deactivate() {
  // when disable extension
}
