import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs-extra";
import { ChildProcess } from "child_process";
import * as shell from "shelljs";
const gitUrlParse = require("git-url-parse");
const uniqueString = require("unique-string");
const Walker = require("@axetroy/walk");
import { isLink } from "./utils";
import { getRootPath } from "./config";

type ProjectExistAction = "Overwrite" | "Rename" | "Cancel";
type ProjectPostAddAction = "Open" | "Cancel";

export class Gpm {
  constructor(public context: vscode.ExtensionContext) {}
  private async getValidProjectName(repoPath: string): Promise<string | void> {
    if (await fs.pathExists(repoPath)) {
      // TODO: support clone with another name if it exist
      const actionName = await vscode.window.showWarningMessage(
        "Project already exists.",
        "Overwrite",
        "Rename",
        "Cancel"
      );

      switch (actionName as ProjectExistAction) {
        case "Overwrite":
          return repoPath;
        case "Rename":
          const newName = await vscode.window.showInputBox({
            prompt: "Enter a new name of project."
          });

          if (!newName) {
            return;
          }

          return this.getValidProjectName(
            path.join(path.dirname(repoPath), newName)
          );
        default:
          return;
      }
    } else {
      return repoPath;
    }
  }
  public async add() {
    // make sure git instsalled
    try {
      const r = shell.which("git");
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

    const repoDir = await this.getValidProjectName(
      path.join(ownerDir, gitInfo.name)
    );

    if (!repoDir) {
      return;
    }

    await fs.ensureDir(randomTemp);

    vscode.window.showInformationMessage("cloning...");

    const channel = vscode.window.createOutputChannel("gpm");

    try {
      await new Promise((resolve, reject) => {
        shell.cd(randomTemp);

        const stream = shell.exec(
          `git clone ${gitProjectAddress as string} --progress -v`,
          {
            async: true
          }
        ) as ChildProcess;

        stream
          .on("error", data => channel.append(data + ""))
          .on("close", (code: number, signal: string) => {
            channel.show();
            if (code !== 0) {
              reject(signal);
            } else {
              resolve();
            }
          });

        // not support pipe to process
        stream.stdout
          .setEncoding("utf8")
          .on("data", data => {
            channel.append(data + "");
            channel.show();
          })
          .on("error", data => {
            channel.append(data + "");
            channel.show();
          });
        // not support pipe to process
        stream.stderr
          .setEncoding("utf8")
          .on("data", data => {
            channel.append(data + "");
            channel.show();
          })
          .on("error", data => {
            channel.append(data + "");
            channel.show();
          });
      });
      setTimeout(() => {
        channel.dispose();
      }, 2000);
    } catch (err) {
      setTimeout(() => {
        channel.dispose();
      }, 2000);
      throw err;
    }

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
      "Open",
      "Cancel"
    );

    switch (action as ProjectPostAddAction) {
      case "Open":
        const openPath = vscode.Uri.file(repoDir);
        await vscode.commands.executeCommand("vscode.openFolder", openPath);
        break;
      default:
      // do nothing
    }

    // refresh explorer
    this.refresh();

    // run the hooks
    // TODO: support hooks
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
