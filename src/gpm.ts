import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs-extra";
const gitUrlParse = require("git-url-parse");
const uniqueString = require("unique-string");
const which = require("which");
import { runShell, isLink } from "./utils";

export class Gpm {
  constructor(public context: vscode.ExtensionContext) {}
  async add() {
    // make sure git instsalled
    try {
      const r = which.sync("git");
      if (!r) {
        throw null;
      }
    } catch (err) {
      vscode.window.showErrorMessage("Make sure you have install git.");
      return;
    }

    const gitProjectAddress = await vscode.window.showInputBox({
      placeHolder: "Enter git project address. support https and ssh"
    });

    if (!gitProjectAddress) return;

    const gitInfo = gitUrlParse(gitProjectAddress);

    // invalid git address
    if (!gitInfo || !gitInfo.owner || !gitInfo.name) {
      await vscode.window.showErrorMessage("Invalid git address.");
      return;
    }

    // check project is exist or not
    const config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration(
      "gpm"
    );

    const randomTemp: string = path.join(
      <string>process.env.HOME,
      ".gpm",
      "temp",
      uniqueString()
    );

    const tempDir: string = path.join(randomTemp, gitInfo.name);

    const baseDir: string = path
      .join(config.rootPath)
      .replace(/^~/, <string>process.env.HOME);
    const sourceDir: string = path.join(baseDir, gitInfo.source);
    const ownerDir: string = path.join(sourceDir, gitInfo.owner);
    const repoDir: string = path.join(ownerDir, gitInfo.name);

    if (await fs.pathExists(repoDir)) {
      const action = await vscode.window.showWarningMessage(
        "Do you want to overwrite the exist project?",
        "Overwrite",
        "Cancel"
      );

      if (action === "Cancel") {
        return;
      }
    }

    await fs.ensureDir(baseDir);
    await fs.ensureDir(sourceDir);
    await fs.ensureDir(ownerDir);
    await fs.ensureDir(randomTemp);

    vscode.window.showInformationMessage("cloning...");

    // vscode.window.createOutputChannel()
    await runShell(`git clone ${gitProjectAddress}`, {
      cwd: randomTemp
      // stdio: "inherit"
    });

    // if it's a link, then unlink first
    if (await isLink(repoDir)) {
      await fs.unlink(repoDir);
    }
    await fs.remove(repoDir);
    await fs.move(tempDir, repoDir);
    await fs.remove(randomTemp);

    // run hooks
    const action: string | void = await vscode.window.showInformationMessage(
      `@${gitInfo.owner}/${gitInfo.name} have been cloned.`,
      "Open it",
      "Cancel"
    );

    if (action && action === "Open it") {
      const openPath = vscode.Uri.file(repoDir);
      await vscode.commands.executeCommand("vscode.openFolder", openPath);
    }

    // refresh explorer
    this.refresh();
  }
  prune() {}
  remove() {}
  refresh() {}
}
