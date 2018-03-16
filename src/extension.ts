"use strict";
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { ProjectTreeProvider } from "./projectTree";
import * as fs from "fs";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
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

  // gpm command
  vscode.commands.registerCommand("gpm.addProject", node => {
    vscode.window.showInformationMessage("Successfully called add entry");
    vscode.window
      .showInputBox({
        // value: "git@github.com:Microsoft/vscode.git",
        placeHolder: "Please enter git address. support http/git"
      })
      .then(function(projectGitAddress) {
        // 拉取项目
      });
  });

  let disposable = vscode.commands.registerCommand("extension.sayHello", () => {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    vscode.window.showInformationMessage("Hello World!");
  });

  context.subscriptions.push(disposable);

  //   context.subscriptions.push(add);
}

// this method is called when your extension is deactivated
export function deactivate() {}
