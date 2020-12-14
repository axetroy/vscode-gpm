import { Service } from "typedi";
import * as vscode from "vscode";

const output = vscode.window.createOutputChannel("GPM");

@Service()
export class Output {
  public show() {
    output.show();
  }
  public write(data?: string) {
    if (data !== undefined) {
      output.append(data);
    }
  }
  public writeln(data?: string) {
    if (data !== undefined) {
      output.appendLine(data);
    }
  }
  public dispose() {
    output.dispose();
  }
}
