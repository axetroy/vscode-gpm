import * as vscode from "vscode";
import * as path from "path";

export type SearchBehavior =
  | "openInNewWindow"
  | "openInCurrentWindow"
  | "remove"
  | "star"
  | "unstar"
  | "ask";

export function getConfiguration(): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration("gpm");
}

export function getField(field: string): any {
  return getConfiguration()[field];
}

export function getSearchBehavior(): SearchBehavior {
  return getField("searchBehavior");
}

export function getRootPath(): string {
  return path.normalize(
    getField("rootPath")
      .replace(/^~/, process.env.HOME as string)
      .replace(/\$\w+/, (word: string) => process.env[word.replace(/^\$/, "")])
  );
}

export function getIsAutoRunHook(): boolean {
  return !!getField("isAutoRunHook");
}
