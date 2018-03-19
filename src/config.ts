import * as vscode from "vscode";
function getConfiguration(): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration("gpm");
}

function getField(field: string): any {
  return getConfiguration()[field];
}

function getRootPath(): string {
  return getField("rootPath").replace(/^~/, process.env.HOME as string);
}

export { getConfiguration, getField, getRootPath };
