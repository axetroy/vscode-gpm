import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs-extra";
import * as os from "os";
import { ChildProcess } from "child_process";
import * as shell from "shelljs";
const gitUrlParse = require("git-url-parse");
const uniqueString = require("unique-string");
const Walker = require("@axetroy/walk");
const processExists = require("process-exists");
import { isLink } from "./utils";
import config from "./config";
import {
  ProjectTreeProvider,
  createRepository,
  createOwner
} from "./projectTree";
import {
  FileType,
  IFile,
  ISource,
  IOwner,
  IRepository,
  IPreset,
  ConfirmAction,
  InitAction,
  Hook,
  OpenAction,
  SearchAction,
  PruneAction,
  ProjectExistAction,
  ProjectPostAddAction,
  Command,
  SearchBehavior
} from "./type";

export class Gpm {
  public readonly PresetFile: string = ".gpmrc";
  // current opening terminals
  private readonly terminals: { [path: string]: vscode.Terminal } = {};
  // current running command stream
  private currentStream: ChildProcess | void = void 0;
  // cache path
  public readonly CachePath: string = this.context.storagePath ||
  path.join(os.tmpdir(), ".gpm", "temp");

  // project explorer
  public readonly explorer: ProjectTreeProvider = new ProjectTreeProvider(
    this.context
  );
  // status bar
  private readonly statusBar: vscode.StatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  constructor(private readonly context: vscode.ExtensionContext) {}
  /**
   * Init gpm, check the gpm root path exist or not
   * @memberof Gpm
   */
  public async init() {
    const rootPath = config.rootPath;
    if (!(await fs.pathExists(rootPath))) {
      const action = await vscode.window.showInformationMessage(
        `GPM root folder '${rootPath}' not found.`,
        InitAction.Create,
        InitAction.Cancel
      );
      switch (action as InitAction) {
        case InitAction.Create:
          await fs.ensureDir(rootPath);
          break;
        default:
      }
    }

    this.explorer.traverse();
  }
  private async getValidProjectName(
    repositoryPath: string
  ): Promise<string | void> {
    if (await fs.pathExists(repositoryPath)) {
      const actionName = await vscode.window.showWarningMessage(
        "Project already exists.",
        ProjectExistAction.Overwrite,
        ProjectExistAction.Rename,
        ProjectExistAction.Cancel
      );

      switch (actionName as ProjectExistAction) {
        case ProjectExistAction.Overwrite:
          return repositoryPath;
        case ProjectExistAction.Rename:
          const newName = await vscode.window.showInputBox({
            prompt: "Enter a new name of project."
          });

          if (!newName) {
            return;
          }

          return this.getValidProjectName(
            path.join(path.dirname(repositoryPath), newName)
          );
        default:
          return;
      }
    } else {
      return repositoryPath;
    }
  }
  /**
   * Add project
   * @returns
   * @memberof Gpm
   */
  public async add() {
    // make sure git instsalled
    try {
      const r = shell.which("git");
      if (!r) {
        throw null;
      }
    } catch (err) {
      vscode.window.showErrorMessage("Make sure git have been installed.");
      return;
    }

    const gitProjectAddress = await vscode.window.showInputBox({
      placeHolder: "e.g. https://github.com/eggjs/egg.git",
      prompt: "Enter public git project https/ssh address."
    });

    if (!gitProjectAddress) {
      return;
    }

    const gitInfo = gitUrlParse(gitProjectAddress);

    // invalid git address
    if (!gitInfo || !gitInfo.owner || !gitInfo.name) {
      return vscode.window.showErrorMessage("Invalid git address.");
    }

    const randomTemp: string = path.join(this.CachePath, uniqueString());

    const tempDir: string = path.join(randomTemp, gitInfo.name);

    const baseDir: string = config.rootPath;
    const sourceDir: string = path.join(baseDir, gitInfo.source);
    const ownerDir: string = path.join(sourceDir, gitInfo.owner);

    const repositoryPath: string | void = await this.getValidProjectName(
      path.join(ownerDir, gitInfo.name)
    );

    if (!repositoryPath) {
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
      if (await isLink(repositoryPath)) {
        await fs.unlink(repositoryPath);
      }
      await fs.remove(repositoryPath);
      await fs.move(tempDir, repositoryPath);
      await fs.remove(randomTemp);

      // refresh explorer
      this.refresh();

      try {
        // run the hooks
        // whatever hook success or fail
        // it still going on
        await this.runHook(repositoryPath, Hook.Postadd);
      } catch (err) {
        console.error(err);
      }

      const action: string | void = await vscode.window.showInformationMessage(
        `@${gitInfo.owner}/${gitInfo.name} have been cloned.`,
        ProjectPostAddAction.Open,
        ProjectPostAddAction.Cancel
      );

      switch (action as ProjectPostAddAction) {
        case ProjectPostAddAction.Open:
          await this.open({
            source: gitInfo.source,
            owner: gitInfo.owner,
            path: repositoryPath,
            repository: gitInfo.name,
            type: FileType.Repository
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
  /**
   * Prune project, remove all node_modules folder
   * @returns
   * @memberof Gpm
   */
  public async prune() {
    const action = await vscode.window.showWarningMessage(
      "prune will remove all node_modules folder, will you continue?",
      PruneAction.Continue,
      PruneAction.Cancel
    );

    switch (action as PruneAction) {
      case PruneAction.Continue:
        break;
      default:
        return;
    }

    const walker = new Walker(config.rootPath);

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
  /**
   * Remove project
   * @param {IRepository} repository
   * @memberof Gpm
   */
  public async remove(repository: IRepository) {
    // run the hooks before remove project
    // whatever hook success or fail
    // it still going on
    try {
      await this.runHook(repository.path, Hook.Preremove);
    } catch (err) {
      console.error(err);
    }

    // remove project
    await fs.remove(repository.path);

    // run the hooks after remove project
    // whatever hook success or fail
    // it still going on
    try {
      await this.runHook(path.dirname(repository.path), Hook.Postremove);
    } catch (err) {
      console.error(err);
    }

    // unstar project
    this.unstar(repository);

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

    this.refresh();
  }
  /**
   * Remove Owner folder
   * @param {IOwner} owner
   * @returns
   * @memberof Gpm
   */
  public async removeOwner(owner: IOwner) {
    const repositories: string[] = await fs.readdir(owner.path);

    for (const repository of repositories) {
      const stat = await fs.stat(path.join(owner.path, repository));
      if (stat.isDirectory()) {
        const repositoryEntity = createRepository(
          this.context,
          owner,
          repository
        );
        await this.remove(repositoryEntity);
      }
    }

    await fs.remove(owner.path);
    return this.refresh();
  }
  /**
   * Remove Source Folder
   * @param {ISource} source
   * @returns
   * @memberof Gpm
   */
  public async removeSource(source: ISource) {
    const owners: string[] = await fs.readdir(source.path);

    for (const ownerName of owners) {
      const stat = await fs.stat(path.join(source.path, ownerName));
      if (stat.isDirectory()) {
        const owner = createOwner(this.context, source, ownerName);
        await this.removeOwner(owner);
      }
    }

    await fs.remove(source.path);
    return this.refresh();
  }
  /**
   * Clear cache
   * @memberof Gpm
   */
  public async cleanCache() {
    try {
      await fs.remove(this.CachePath);
      await vscode.window.showInformationMessage("Cache have been cleaned.");
    } catch (err) {
      await vscode.window.showErrorMessage(err.message);
    }
  }
  /**
   * Open Project
   * @param {IRepository} repository
   * @returns
   * @memberof Gpm
   */
  public async open(repository: IRepository) {
    const repositorySymbol: string = `@${repository.owner}/${
      repository.repository
    }`;

    const action = await vscode.window.showInformationMessage(
      `How to open ${repositorySymbol}?`,
      OpenAction.CurrentWindow,
      OpenAction.NewWindow,
      OpenAction.Cancel
    );

    switch (action as OpenAction) {
      case OpenAction.CurrentWindow:
        return this.openInCurrentWindow(repository);
      case OpenAction.NewWindow:
        return this.openInNewWindow(repository);
      default:
        return;
    }
  }
  /**
   * Open file
   * @private
   * @param {string} filepath
   * @param {...any[]} res
   * @returns
   * @memberof Gpm
   */
  private openFile(filepath: string, ...res: any[]) {
    return vscode.commands.executeCommand(
      "vscode.openFolder",
      vscode.Uri.file(filepath),
      ...res
    );
  }
  /**
   * Open file in current window
   * @param {IFile} file
   * @returns
   * @memberof Gpm
   */
  public async openInCurrentWindow(file: IFile) {
    return this.openFile(file.path);
  }
  /**
   * Open file in new window
   * @param {IFile} file
   * @returns
   * @memberof Gpm
   */
  public async openInNewWindow(file: IFile) {
    return this.openFile(file.path, true);
  }
  /**
   * interrupt current running command
   * @returns
   * @memberof Gpm
   */
  public async interruptCommand() {
    if (this.currentStream) {
      const confirm = await vscode.window.showWarningMessage(
        "Do you want to interrupt command?",
        ConfirmAction.Yes,
        ConfirmAction.No
      );

      switch (confirm as ConfirmAction) {
        case ConfirmAction.Yes:
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
  /**
   * Select a repository from repositories
   * @param {IRepository[]} [repositories]
   * @param {vscode.QuickPickOptions} [options]
   * @returns {(Promise<IRepository | void>)}
   * @memberof Gpm
   */
  public async selectRepository(
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
  /**
   * Open file/folder in terminal
   * @param {IFile} file
   * @memberof Gpm
   */
  public async openTerminal(file: IFile): Promise<void> {
    let terminal: vscode.Terminal;

    let name: string;

    switch (file.type) {
      case FileType.Repository:
        name = (file as IRepository).repository;
        break;
      case FileType.Owner:
        name = (file as IOwner).owner;
        break;
      case FileType.Source:
        name = (file as ISource).source;
        break;
      default:
        name = "undefined";
    }

    if (!this.terminals[file.path]) {
      terminal = vscode.window.createTerminal({
        name: "[GPM]: " + name,
        cwd: file.path,
        env: process.env as any
      });

      this.context.subscriptions.push(terminal);
      this.terminals[file.path] = terminal;
    } else {
      terminal = this.terminals[file.path];
      const exists = await processExists(await terminal.processId);
      if (!exists) {
        // if the terminal have exit or it have been close.
        delete this.terminals[file.path];
        // reopen again
        return this.openTerminal(file);
      }
    }

    terminal.show();
  }
  /**
   * Reset status bar
   * @private
   * @memberof Gpm
   */
  private resetStatusBar() {
    const statusBar = this.statusBar;
    if (statusBar) {
      statusBar.text = "";
      statusBar.command = void 0;
      statusBar.hide();
      this.currentStream = void 0;
    }
  }
  /**
   * Refresh project
   * @returns
   * @memberof Gpm
   */
  public refresh() {
    return this.explorer.refresh();
  }
  /**
   * Search project
   * @returns
   * @memberof Gpm
   */
  public async search() {
    const repository = await this.selectRepository();

    if (!repository) {
      return;
    }

    const behavior = config.searchBehavior;

    switch (behavior) {
      case SearchBehavior.OpenInNewWindow:
        return this.openInNewWindow(repository);
      case SearchBehavior.OpenInCurrentWindow:
        return this.openInCurrentWindow(repository);
      case SearchBehavior.Remove:
        return this.remove(repository);
      case SearchBehavior.Star:
        return this.star(repository);
      case SearchBehavior.Unstar:
        return this.unstar(repository);
      case SearchBehavior.Ask:
        const repositorySymbol: string = `@${repository.owner}/${
          repository.repository
        }`;

        const doAction = await vscode.window.showInformationMessage(
          `What do you want to do about ${repositorySymbol}?`,
          SearchAction.Open,
          SearchAction.Remove,
          SearchAction.Cancel
        );

        switch (doAction as SearchAction) {
          case SearchAction.Open:
            return this.open(repository);
          case SearchAction.Remove:
            return this.remove(repository);
          default:
            return;
        }
      default:
      // do nothing
    }
  }
  /**
   * Star project
   * @param {IRepository} repository
   * @memberof Gpm
   */
  public async star(repository: IRepository): Promise<void> {
    await this.explorer.star.star(repository);
    this.refresh();
  }
  /**
   * Unstar project
   * @param {IRepository} repository
   * @memberof Gpm
   */
  public async unstar(repository: IRepository): Promise<void> {
    await this.explorer.star.unstar(repository);
    this.refresh();
  }
  /**
   * Get the star list
   * @returns
   * @memberof Gpm
   */
  public starList() {
    return this.explorer.star.list();
  }
  /**
   * Clear all stars
   * @returns
   * @memberof Gpm
   */
  public clearStars(): void {
    return this.explorer.star.clear();
  }
  private async runShell(cwd: string, command: string) {
    const statusBar = this.statusBar as vscode.StatusBarItem;
    return new Promise((resolve, reject) => {
      shell.cd(cwd);

      const stream = shell.exec(command, {
        async: true
      }) as ChildProcess;

      this.currentStream = stream;

      const encoding = "utf8";

      const log = (message: string | Buffer | Error) => {
        statusBar.text = message + "";
        statusBar.command = Command.InterruptCommand; // set command for cancel clone
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
        .setEncoding(encoding)
        .on("data", data => log(data))
        .on("error", data => log(data));
      // not support pipe to process
      stream.stderr
        .setEncoding(encoding)
        .on("data", data => log(data))
        .on("error", data => log(data));
    });
  }
  /**
   * Run hook in the path if it exist
   * @param {string} cwd
   * @param {Hook} hookName
   * @returns
   * @memberof Gpm
   */
  public async runHook(cwd: string, hookName: Hook) {
    // if user disable auto run hook
    if (!config.isAutoRunHook) {
      return;
    }

    const gpmrcPath = path.join(cwd, this.PresetFile);
    // run the hooks
    if (await fs.pathExists(gpmrcPath)) {
      // if .gpmrc file exist
      const preset: IPreset = await fs.readJson(gpmrcPath);
      if (preset.hooks) {
        const cmd = preset.hooks[hookName] || preset.hooks.postadd;
        if (cmd) {
          await this.runShell(cwd, cmd);
        }
      }
    }
  }
}
