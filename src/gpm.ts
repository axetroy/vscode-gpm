import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs-extra";
const gitUrlParse = require("git-url-parse");
const uniqueString = require("unique-string");
const which = require("which");
const Walker = require("@axetroy/walk");
import { runShell, isLink } from "./utils";
import { getRootPath } from "./config";

export class Gpm {
  constructor(public context: vscode.ExtensionContext) {}
  public async add() {
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
      placeHolder: "e.g. https://github.com/eggjs/egg.git",
      prompt: "Enter git project https/ssh address."
    });

    if (!gitProjectAddress) {
      return;
    }

    const gitInfo = gitUrlParse(gitProjectAddress);

    // invalid git address
    if (!gitInfo || !gitInfo.owner || !gitInfo.name) {
      await vscode.window.showErrorMessage("Invalid git address.");
      return;
    }

    const randomTemp: string = path.join(
      process.env.HOME as string,
      ".gpm",
      "temp",
      uniqueString()
    );

    const tempDir: string = path.join(randomTemp, gitInfo.name);

    const baseDir: string = getRootPath();
    const sourceDir: string = path.join(baseDir, gitInfo.source);
    const ownerDir: string = path.join(sourceDir, gitInfo.owner);
    const repoDir: string = path.join(ownerDir, gitInfo.name);

    if (await fs.pathExists(repoDir)) {
      const actionName = await vscode.window.showWarningMessage(
        "Do you want to overwrite the exist project?",
        "Overwrite",
        "Cancel"
      );

      if (actionName !== "Overwrite") {
        return;
      }
    }

    await fs.ensureDir(randomTemp);

    vscode.window.showInformationMessage("cloning...");

    // vscode.window.createOutputChannel()
    await runShell(`git clone ${gitProjectAddress}`, {
      cwd: randomTemp
      // stdio: "inherit"
    });

    await fs.ensureDir(baseDir);
    await fs.ensureDir(sourceDir);
    await fs.ensureDir(ownerDir);

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
  public async prune() {
    const action = await vscode.window.showWarningMessage(
      "prune will remove all node_modules folder, will you continue?",
      "Continue",
      "Cancel"
    );

    if (action !== "Continue") {
      return;
    }

    const walker = new Walker(getRootPath());

    let files = 0;
    let directory = 0;

    walker.on("file", (filepath: string) => {
      files++;
    });

    const done: Array<Promise<any>> = [];
    let removeDirCount = 0;

    walker.on("directory", (filepath: string) => {
      directory++;
      const name = path.basename(filepath);
      if (name === "node_modules") {
        done.push(
          fs
            .remove(filepath)
            .then(() => removeDirCount++)
            .catch(err => Promise.resolve())
        );
      }
    });

    vscode.window.showInformationMessage("pruning... wait for a moment");

    await walker.walk();

    await Promise.all(done);

    vscode.window.showInformationMessage(
      `Find ${files} file， ${directory} directories, delete ${removeDirCount} node_modules`
    );
    this.refresh();
  }
  public refresh() {
    // empty refresh
    // it will overwrite in other place
  }
}
