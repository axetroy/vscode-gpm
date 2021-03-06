import * as path from "path";
import processExists from "process-exists";
import { Container, Service } from "typedi";
import * as vscode from "vscode";

@Service()
export class Terminal {
  private readonly terminals: { [path: string]: vscode.Terminal } = {};
  private readonly context: vscode.ExtensionContext = Container.get("context");
  /**
   * Open terminal
   * @param filepath
   */
  public async open(filepath: string): Promise<void> {
    let terminal: vscode.Terminal;

    if (!this.terminals[filepath]) {
      terminal = vscode.window.createTerminal({
        name: "[GPM]: " + path.basename(filepath),
        cwd: filepath,
        env: process.env as any
      });

      this.context.subscriptions.push(terminal);
      this.terminals[filepath] = terminal;
    } else {
      terminal = this.terminals[filepath];
      const exists = await processExists(await terminal.processId || 0);
      if (!exists) {
        // if the terminal have exit or it have been close.
        delete this.terminals[filepath];
        // reopen again
        return this.open(filepath);
      }
    }

    if (terminal) {
      terminal.show();
    }
  }
}
