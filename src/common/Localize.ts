import * as vscode from "vscode";
import { Service, Container } from "typedi";
import { init, localize } from "vscode-nls-i18n";

@Service()
export class Localize {
  constructor() {
    const context: vscode.ExtensionContext = Container.get("context");
    init(context.extensionPath);
  }

  public localize(key: string, comment: string = "", args: any[] = []): string {
    return localize(key, ...args);
  }
}
