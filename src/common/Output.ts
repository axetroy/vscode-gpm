import { Service } from "typedi";
import * as vscode from "vscode";

const output = vscode.window.createOutputChannel("GPM");

@Service()
export class Output implements vscode.OutputChannel {
  get name() {
    return output.name;
  }
  public show() {
    output.show();
  }
  public hide() {
    output.hide();
  }
  public append(data: string) {
    output.append(data);
  }
  public write(data?: string) {
    if (data !== undefined) {
      output.append(data);
    }
  }
  public appendLine(data: string) {
    output.appendLine(data);
  }
  public writeln(data?: string) {
    if (data !== undefined) {
      output.appendLine(data);
    }
  }
  public clear() {
    output.clear();
  }
  public dispose() {
    output.dispose();
  }
}
