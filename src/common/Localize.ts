import * as vscode from "vscode";
import { Service, Container } from "typedi";
import { init, localize } from "vscode-nls-i18n";

@Service()
export class Localize {
  constructor() {
    const context: vscode.ExtensionContext = Container.get("context");
    init(context.extensionPath);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public localize(key: string, _comment = "", args: unknown[] = []): string {
    return localize(key, ...args as string[]);
  }
}
