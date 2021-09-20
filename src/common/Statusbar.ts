import { Writable } from "stream";
import { window, StatusBarAlignment, StatusBarItem } from "vscode";
import { Command } from "../type";

export class Statusbar extends Writable {
  private statusbar: StatusBarItem;
  constructor(private command: Command, alignment: StatusBarAlignment = StatusBarAlignment.Right, priority = 100) {
    super();
    this.statusbar = window.createStatusBarItem(alignment, priority);
    this.on("finish", this.hide.bind(this));
    this.on("error", this.hide.bind(this));
    this.on("close", this.hide.bind(this));
  }
  private show(message: string) {
    this.statusbar.text = message;
    this.statusbar.command = this.command;
    this.statusbar.show();
  }
  private hide() {
    this.statusbar.text = "";
    this.statusbar.command = "";
    this.statusbar.hide();
    this.statusbar.dispose();
  }
  public _write(chunk: string | Buffer, encoding: string, cb: () => void): void {
    this.show(chunk + "");
    cb();
  }
}
