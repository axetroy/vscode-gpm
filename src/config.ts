import * as vscode from "vscode";
import * as path from "path";
import * as os from "os";

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
  return getConfiguration().get(field);
}

export function updateField(field: string, value: any) {
  return getConfiguration().update(field, value, 1);
}

export function getSearchBehavior(): SearchBehavior {
  return getField("searchBehavior");
}

export function getRootPath(): string {
  return path.normalize(
    (getField("rootPath") as string)
      .replace(/^~/, process.env.HOME as string)
      .replace("$HOME", os.homedir())
      .replace(
        /\$\w+/,
        (word: string) => process.env[word.replace(/^\$/, "")] as string
      )
  );
}

export function getIsAutoRunHook(): boolean {
  return !!getField("isAutoRunHook");
}
