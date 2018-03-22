import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs-extra";
import { ChildProcess } from "child_process";
import * as shell from "shelljs";
const gitUrlParse = require("git-url-parse");
const uniqueString = require("unique-string");
const Walker = require("@axetroy/walk");
import { isLink } from "./utils";
import { getRootPath, getIsAutoRunHook } from "./config";
import { IRepo, ProjectTreeProvider } from "./projectTree";

type ProjectExistAction = "Overwrite" | "Rename" | "Cancel";
type ProjectPostAddAction = "Open" | "Cancel";
type PruneAction = "Continue" | "Cancel";
type Hook = "add" | "postadd" | "preremove" | "postremove";

interface IRc {
  hooks?: {
    add?: string;
    postadd?: string;
    preremove?: string;
    postremove?: string;
  };
}

export class Gpm {
  private currentStream: ChildProcess | void = void 0;
  public statusBar: vscode.StatusBarItem | void = void 0;
  // cache path
  public cachePath: string = this.context.storagePath ||
    path.join(process.env.HOME as string, ".gpm", "temp");
  constructor(public context: vscode.ExtensionContext) {}
  private async getValidProjectName(repoPath: string): Promise<string | void> {
    if (await fs.pathExists(repoPath)) {
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

    const randomTemp: string = path.join(this.cachePath, uniqueString());

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

    try {
      await this.runShell(
        randomTemp,
        `git clone ${gitProjectAddress as string} --progress -v`
      );

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

      // refresh explorer
      this.refresh();

      try {
        // run the hooks
        // whatever hook success or fail
        // it still going on
        await this.runHook(repoDir, "postadd");
      } catch (err) {
        console.error(err);
      }

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
    } catch (err) {
      // refresh explorer
      this.refresh();
      throw err;
    }
  }
  public async prune() {
    const action = await vscode.window.showWarningMessage(
      "prune will remove all node_modules folder, will you continue?",
      "Continue",
      "Cancel"
    );

    switch (action as PruneAction) {
      case "Continue":
        break;
      default:
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
  public async remove(repo: IRepo, gpmExplorer: ProjectTreeProvider) {
    const action = await vscode.window.showInformationMessage(
      "[Irrevocable] Are you sure to remove project?",
      "Yes",
      "No"
    );

    if (action !== "Yes") {
      return;
    }

    try {
      // run the hooks before remove project
      // whatever hook success or fail
      // it still going on
      try {
        await this.runHook(repo.path, "preremove");
      } catch (err) {
        console.error(err);
      }

      // remove project
      await fs.remove(repo.path);

      // run the hooks after remove project
      // whatever hook success or fail
      // it still going on
      try {
        await this.runHook(path.dirname(repo.path), "postremove");
      } catch (err) {
        console.error(err);
      }

      // unstar prject
      gpmExplorer.star.unstar(repo);

      const ownerPath: string = path.dirname(repo.path);
      const sourcePath: string = path.dirname(path.dirname(repo.path));

      const projectList = await fs.readdir(ownerPath);

      // if project is empty, remove owner folder
      if (!projectList || !projectList.length) {
        await fs.remove(ownerPath);
      }

      const ownerList = await fs.readdir(sourcePath);

      // if owner is empty, remove source folder
      if (!ownerList || !ownerList.length) {
        await fs.remove(sourcePath);
      }

      vscode.window.showInformationMessage(
        `@${repo.owner}/${repo.repo} have been removed.`
      );
      gpmExplorer.refresh(); // refresh
    } catch (err) {
      vscode.window.showErrorMessage(err.message);
    }
  }
  public async cleanCache() {
    try {
      await fs.remove(this.cachePath);
      await vscode.window.showInformationMessage("Cache have been cleaned.");
    } catch (err) {
      await vscode.window.showErrorMessage(err.message);
    }
  }
  public async interruptCommand() {
    if (this.currentStream) {
      const confirm = await vscode.window.showWarningMessage(
        "Do you want to interrupt command?",
        "Yes",
        "No"
      );
      switch (confirm) {
        case "Yes":
          this.currentStream.kill();
          this.currentStream = void 0;
          if (this.statusBar) {
            this.statusBar.text = "";
            this.statusBar.command = "";
            this.statusBar.hide();
          }
          break;
        default:
          return;
      }
    }
  }
  private resetStatusBar() {
    const statusBar = this.statusBar;
    if (statusBar) {
      statusBar.text = "";
      statusBar.command = void 0;
      statusBar.hide();
      this.currentStream = void 0;
    }
  }
  public refresh() {
    // empty refresh
    // it will overwrite in other place
  }
  private async runShell(cwd: string, command: string) {
    const gpmEntity = this;
    const statusBar = this.statusBar as vscode.StatusBarItem;
    return new Promise((resolve, reject) => {
      shell.cd(cwd);

      const stream = shell.exec(command, {
        async: true
      }) as ChildProcess;

      this.currentStream = stream;

      function log(message: string | Buffer | Error) {
        statusBar.text = message + "";
        statusBar.command = "gpm.interruptCommand"; // set command for cancel clone
        statusBar.show();

        // if stream have been kill, then reset status bar
        if (stream.killed) {
          gpmEntity.resetStatusBar();
        }
      }

      stream
        .on("error", data => {
          log(data);
          this.resetStatusBar();
        })
        .on("close", (code: number, signal: string) => {
          this.resetStatusBar();
          if (code !== 0) {
            reject(signal);
          } else {
            resolve();
          }
        });

      // not support pipe to process
      stream.stdout
        .setEncoding("utf8")
        .on("data", data => log(data))
        .on("error", data => log(data));
      // not support pipe to process
      stream.stderr
        .setEncoding("utf8")
        .on("data", data => log(data))
        .on("error", data => log(data));
    });
  }
  public async runHook(cwd: string, hookName: Hook) {
    // if user disable auto run hook
    if (!getIsAutoRunHook()) {
      return;
    }

    const gpmrcPath = path.join(cwd, ".gpmrc");
    // run the hooks
    if (await fs.pathExists(gpmrcPath)) {
      // if .gpmrc file exist
      const rc: IRc = await fs.readJson(gpmrcPath);
      if (rc.hooks) {
        const cmd = rc.hooks[hookName] || rc.hooks.postadd;
        if (cmd) {
          vscode.window.showInformationMessage("Running hook: " + cmd);
          await this.runShell(cwd, cmd);
        }
      }
    }
  }
}
