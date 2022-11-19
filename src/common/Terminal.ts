import * as path from "path";
import processExists from "process-exists";
import * as vscode from "vscode";

export class Terminal {
  private readonly terminals: { [path: string]: vscode.Terminal } = {};
  private readonly context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  /**
   * Open terminal
   * @param filepath
   */
  public async open(filepath: string): Promise<void> {
    let terminal: vscode.Terminal;

    if (this.terminals[filepath]) {
      terminal = this.terminals[filepath];
      const exists = await processExists((await terminal.processId) || 0);
      if (!exists) {
        // if the terminal have exit or it have been close.
        this.terminals[filepath] = undefined;
        // reopen again
        return this.open(filepath);
      }
    } else {
      terminal = vscode.window.createTerminal({
        name: `[GPM]: ${path.basename(filepath)}`,
        cwd: filepath,
        env: process.env,
      });

      this.context.subscriptions.push(terminal);
      this.terminals[filepath] = terminal;
    }

    if (terminal) {
      terminal.show();
    }
  }
}
