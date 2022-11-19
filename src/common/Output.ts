import * as vscode from "vscode";

const output = vscode.window.createOutputChannel("GPM");

export class Output implements vscode.OutputChannel {
  get name(): string {
    return output.name;
  }
  public show(): void {
    output.show();
  }
  public hide(): void {
    output.hide();
  }
  public append(data: string): void {
    output.append(data);
  }
  public write(data?: string): void {
    if (data !== undefined) {
      output.append(data);
    }
  }
  public appendLine(data: string): void {
    output.appendLine(data);
  }
  public writeln(data?: string): void {
    if (data !== undefined) {
      output.appendLine(data);
    }
  }
  public clear(): void {
    output.clear();
  }
  public dispose(): void {
    output.dispose();
  }
}
