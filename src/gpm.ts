import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs-extra";
import { ChildProcess } from "child_process";
import * as shell from "shelljs";
const gitUrlParse = require("git-url-parse");
const uniqueString = require("unique-string");
const Walker = require("@axetroy/walk");
import { isLink } from "./utils";
import { getRootPath, getIsAutoRunHook, getSearchBehavior } from "./config";
import { IRepository, ProjectTreeProvider } from "./projectTree";

type ProjectExistAction = "Overwrite" | "Rename" | "Cancel";
type ProjectPostAddAction = "Open" | "Cancel";
type PruneAction = "Continue" | "Cancel";
type Hook = "add" | "postadd" | "preremove" | "postremove";
type SearchAction = "Open" | "Remove" | "Cancel";

interface IRc {
  hooks?: {
    add?: string;
    postadd?: string;
    preremove?: string;
    postremove?: string;
  };
}

export class Gpm {
  public terminals: { [path: string]: vscode.Terminal } = {};
  private currentStream: ChildProcess | void = void 0;
  // cache path
  public cachePath: string = this.context.storagePath ||
    path.join(process.env.HOME as string, ".gpm", "temp");
  constructor(
    public context: vscode.ExtensionContext,
    public explorer: ProjectTreeProvider,
    public statusBar: vscode.StatusBarItem
  ) {}
  public async init() {
    const rootPath = getRootPath();
    if (!await fs.pathExists(rootPath)) {
      const action = await vscode.window.showInformationMessage(
        `GPM root folder '${rootPath}' not found.`,
        "Create",
        "Cancel"
      );
      switch (action) {
        case "Create":
          await fs.ensureDir(rootPath);
          break;
        default:
      }
    }

    this.explorer.traverse();
  }
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
      return vscode.window.showErrorMessage("Invalid git address.");
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
          await this.open({
            source: gitInfo.source,
            owner: gitInfo.owner,
            path: repoDir,
            repository: gitInfo.name,
            type: "repository"
          });
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
  public async remove(repository: IRepository) {
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
        await this.runHook(repository.path, "preremove");
      } catch (err) {
        console.error(err);
      }

      // remove project
      await fs.remove(repository.path);

      // run the hooks after remove project
      // whatever hook success or fail
      // it still going on
      try {
        await this.runHook(path.dirname(repository.path), "postremove");
      } catch (err) {
        console.error(err);
      }

      // unstar prject
      this.explorer.star.unstar(repository);

      const ownerPath: string = path.dirname(repository.path);
      const sourcePath: string = path.dirname(path.dirname(repository.path));

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
        `@${repository.owner}/${repository.repository} have been removed.`
      );
      this.refresh();
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
  public async open(repository: IRepository) {
    const repoSymbol: string = `@${repository.owner}/${repository.repository}`;
    type OpenAction = "Current Window" | "New Window" | "Cancel";

    const action = await vscode.window.showInformationMessage(
      `Which way to open ${repoSymbol}?`,
      "Current Window",
      "New Window",
      "Cancel"
    );

    switch (action as OpenAction) {
      case "Current Window":
        return this.openInCurrentWindow(repository);
      case "New Window":
        return this.openInNewWindow(repository);
      default:
        return;
    }
  }
  public async openInCurrentWindow(repository: IRepository) {
    return vscode.commands.executeCommand(
      "vscode.openFolder",
      vscode.Uri.file(repository.path)
    );
  }
  public async openInNewWindow(repository: IRepository) {
    return vscode.commands.executeCommand(
      "vscode.openFolder",
      vscode.Uri.file(repository.path),
      true
    );
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
  public async select(
    repositories?: IRepository[],
    options?: vscode.QuickPickOptions
  ): Promise<IRepository | void> {
    if (!repositories) {
      repositories = await this.explorer.traverse();
    }

    const itemList = repositories.map(r => {
      return {
        label: `@${r.owner}/${r.repository}`,
        description: r.source
        // detail: r.path
      };
    });

    const selectItem = await vscode.window.showQuickPick(itemList, {
      ...{
        matchOnDescription: false,
        matchOnDetail: false,
        placeHolder: "Select a Project..."
      },
      ...(options || {})
    });

    if (!selectItem) {
      return;
    }

    // selectItem
    // label:"@axetroy/duomi-nodejs"
    // description:"coding.net"

    const repository = repositories.find(
      r =>
        `${r.source}@${r.owner}/${r.repository}` ===
        selectItem.description + selectItem.label
    );

    if (!repository) {
      return;
    }

    return repository;
  }
  public openTerminal(repo: IRepository) {
    let terminal: vscode.Terminal;

    if (!this.terminals[repo.path]) {
      terminal = vscode.window.createTerminal({
        name: "[GPM]: " + repo.repository,
        cwd: repo.path,
        env: process.env as any
      });

      this.context.subscriptions.push(terminal);
      this.terminals[repo.path] = terminal;
    } else {
      terminal = this.terminals[repo.path];
    }

    terminal.show();
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
    return this.explorer.refresh();
  }
  public async search() {
    const repository = await this.select();

    if (!repository) {
      return;
    }

    const behavior = getSearchBehavior();

    switch (behavior) {
      case "openInNewWindow":
        return this.openInNewWindow(repository);
      case "openInCurrentWindow":
        return this.openInCurrentWindow(repository);
      case "remove":
        return this.remove(repository);
      case "star":
        return this.explorer.star.star(repository);
      case "unstar":
        return this.explorer.star.unstar(repository);
      default:
        const repoSymbol: string = `@${repository.owner}/${
          repository.repository
        }`;

        const doAction = await vscode.window.showInformationMessage(
          `What do you want to do about ${repoSymbol}?`,
          "Open",
          "Remove",
          "Cancel"
        );

        switch (doAction as SearchAction) {
          case "Open":
            return this.open(repository);
          case "Remove":
            return this.remove(repository);
          default:
            return;
        }
    }
  }
  private async runShell(cwd: string, command: string) {
    const statusBar = this.statusBar as vscode.StatusBarItem;
    return new Promise((resolve, reject) => {
      shell.cd(cwd);

      const stream = shell.exec(command, {
        async: true
      }) as ChildProcess;

      this.currentStream = stream;

      const log = (message: string | Buffer | Error) => {
        statusBar.text = message + "";
        statusBar.command = "gpm.interruptCommand"; // set command for cancel clone
        statusBar.show();

        // if stream have been kill, then reset status bar
        if (stream.killed) {
          this.resetStatusBar();
        }
      };

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
