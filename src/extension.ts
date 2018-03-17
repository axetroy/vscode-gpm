"use strict";
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { ProjectTreeProvider } from "./projectTree";
import * as fs from "fs";
import * as path from "path";
const which = require("which");

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const gpmPath: boolean = which.sync("gpm");

  if (!gpmPath) {
    vscode.window.showErrorMessage(
      "Run 'npm install @axetroy/gpm -g' to install gpm."
    );
  }

  // open file
  vscode.commands.registerCommand("gpm.open", filepath => {
    const stat = fs.statSync(filepath);
    if (stat.isFile()) {
      const openPath = vscode.Uri.file(filepath);
      vscode.workspace.openTextDocument(openPath).then(doc => {
        vscode.window.showTextDocument(doc);
      });
    }
  });

  // open project command
  vscode.commands.registerCommand("gpm.openProject", element => {
    const openPath = vscode.Uri.file(element.filepath);
    vscode.commands.executeCommand("vscode.openFolder", openPath);
  });

  vscode.window.registerTreeDataProvider("GPM", new ProjectTreeProvider());
}

// this method is called when your extension is deactivated
export function deactivate() {}
