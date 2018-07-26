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
import { isLink, Statusbar } from "./utils";
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
  Hook,
  InitAction,
  OpenAction,
  SearchAction,
  PruneAction,
  ProjectExistAction,
  ProjectPostAddAction,
  Command,
  SearchBehavior
} from "./type";
import localize from "./localize";

interface IProcess {
  id: string;
  cwd: string;
  cmd: string;
  process: ChildProcess;
}

export class Gpm {
  public readonly PresetFile: string = ".gpmrc";
  // current opening terminals
  private readonly terminals: { [path: string]: vscode.Terminal } = {};
  // current running command stream
  private processes: IProcess[] = [];
  // cache path
  public readonly CachePath: string =
    this.context.storagePath || path.join(os.tmpdir(), ".gpm", "temp");

  // project explorer
  public readonly explorer: ProjectTreeProvider = new ProjectTreeProvider(
    this.context
  );
  constructor(private readonly context: vscode.ExtensionContext) {}
  /**
   * Init gpm, check the gpm root path exist or not
   * @memberof Gpm
   */
  public async init() {
    for (const rootPath of config.rootPath) {
      if (!(await fs.pathExists(rootPath))) {
        const create = localize(InitAction.Create);
        const action = await vscode.window.showInformationMessage(
          localize("err.notFoundRootPath", "未发现根目录", [rootPath]),
          create,
          localize(InitAction.Cancel)
        );
        switch (action as InitAction) {
          case create:
            await fs.ensureDir(rootPath);
            break;
          default:
        }
      }
    }
    this.explorer.traverse();
  }
  private async getValidProjectName(
    repositoryPath: string
  ): Promise<string | void> {
    if (await fs.pathExists(repositoryPath)) {
      const overwrite = localize(ProjectExistAction.Overwrite);
      const rename = localize(ProjectExistAction.Rename);
      const actionName = await vscode.window.showWarningMessage(
        localize("tip.message.projectExist", "项目已存在"),
        overwrite,
        rename,
        localize(ProjectExistAction.Cancel)
      );

      switch (actionName as ProjectExistAction) {
        case overwrite:
          return repositoryPath;
        case rename:
          const newName = await vscode.window.showInputBox({
            prompt: localize(
              "tip.placeholder.requireNewRepo",
              "请输入新的项目名字"
            ),
            ignoreFocusOut: true
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
      vscode.window.showErrorMessage(
        localize("err.gitNotInstall", "请确保Git已经安装")
      );
      return;
    }

    const gitProjectAddress = await vscode.window.showInputBox({
      placeHolder: localize("tip.placeholder.addressExample", "例如 xxx"),
      prompt: localize("tip.placeholder.enterAddress", "请输入git地址"),
      ignoreFocusOut: true
    });

    if (!gitProjectAddress) {
      return;
    }

    const gitInfo = gitUrlParse(gitProjectAddress);

    // invalid git address
    if (!gitInfo || !gitInfo.owner || !gitInfo.name) {
      return vscode.window.showErrorMessage(
        localize("err.invalidGitAddress", "无效的 Git 地址")
      );
    }

    const randomTemp: string = path.join(this.CachePath, uniqueString());

    const tempDir: string = path.join(randomTemp, gitInfo.name);

    const PREFIX = "$(location)";

    // select a root path
    const baseDir = await vscode.window.showQuickPick(
      config.rootPath.map(rootpath => `${PREFIX}  ${rootpath}`),
      {
        placeHolder: localize(
          "tip.placeholder.selectRootPath",
          "选择一个根目录"
        ),
        ignoreFocusOut: true
      }
    );

    if (!baseDir) {
      return;
    }

    const sourceDir: string = path.join(
      baseDir.replace(PREFIX, "").trim(),
      gitInfo.source
    );
    const ownerDir: string = path.join(sourceDir, gitInfo.owner);

    const repositoryPath: string | void = await this.getValidProjectName(
      path.join(ownerDir, gitInfo.name)
    );

    if (!repositoryPath) {
      return;
    }

    await fs.ensureDir(randomTemp);

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

      const open = localize(ProjectPostAddAction.Open);

      const action: string | void = await vscode.window.showInformationMessage(
        localize("tip.message.cloned", "克隆成功", [
          gitInfo.owner,
          gitInfo.name
        ]),
        open,
        localize(ProjectPostAddAction.Cancel)
      );

      switch (action as ProjectPostAddAction) {
        case open:
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
      await fs.remove(randomTemp);
      // refresh explorer
      this.refresh();
      if (err.message === "SIGKILL") {
        // do nothing
      } else {
        vscode.window.showErrorMessage(err.message);
      }
    }
  }
  /**
   * Prune project, remove all node_modules folder
   * @returns
   * @memberof Gpm
   */
  public async prune() {
    const Continue = localize(PruneAction.Continue);
    const action = await vscode.window.showWarningMessage(
      localize("tip.message.pruneWarning", "移除警告"),
      Continue,
      localize(PruneAction.Cancel)
    );

    switch (action as PruneAction) {
      case Continue:
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

    vscode.window.showInformationMessage(localize("tip.message.pruneWait"));

    await walker.walk();

    await Promise.all(done);

    vscode.window.showInformationMessage(
      localize("tip.message.pruneReport", "报告", [
        files,
        directory,
        removeDirCount
      ])
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
      await vscode.window.showInformationMessage(
        localize("tip.message.clearReport", "清理完毕")
      );
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

    const currentWindow = localize(OpenAction.CurrentWindow);
    const newWindow = localize(OpenAction.NewWindow);

    const action = await vscode.window.showInformationMessage(
      localize("tip.message.how2open", "选择打开方式", [repositorySymbol]),
      newWindow,
      currentWindow,
      localize(OpenAction.Cancel)
    );

    switch (action as OpenAction) {
      case currentWindow:
        return this.openInCurrentWindow(repository);
      case newWindow:
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
  private openFolder(filepath: string, ...res: any[]) {
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
    return this.openFolder(file.path);
  }
  /**
   * Open file in new window
   * @param {IFile} file
   * @returns
   * @memberof Gpm
   */
  public async openInNewWindow(file: IFile) {
    return this.openFolder(file.path, true);
  }
  /**
   * interrupt current running command
   * @returns
   * @memberof Gpm
   */
  public async interruptCommand() {
    const itemList = this.processes.map(v => {
      return {
        label: "$(dashboard) " + v.cmd,
        description: v.id,
        pid: v.id,
        ppid: process.pid
      };
    });

    const processSelected = await vscode.window.showQuickPick(itemList, {
      matchOnDescription: false,
      matchOnDetail: false,
      placeHolder: localize(
        "tip.placeholder.selectProcessAndKill",
        "选择一个进程然后kill掉"
      ),
      ignoreFocusOut: true
    });

    if (!processSelected) {
      return;
    }

    const currentProcessIndex = this.processes.findIndex(
      v => v.id === processSelected.pid
    );

    if (currentProcessIndex >= 0) {
      const currentProcess = this.processes[currentProcessIndex];

      if (currentProcess && !currentProcess.process.killed) {
        currentProcess.process.kill("SIGKILL");
        this.processes.splice(currentProcessIndex, 1);
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
        label: `$(repo)  ${r.owner}/${r.repository}`,
        description: r.source,
        path: r.path
        // detail: r.path
      };
    });

    const itemSelected = await vscode.window.showQuickPick(itemList, {
      ...{
        matchOnDescription: false,
        matchOnDetail: false,
        placeHolder: localize(
          "tip.placeholder.selectProject",
          "请选择一个项目"
        ),
        ignoreFocusOut: true
      },
      ...(options || {})
    });

    if (!itemSelected) {
      return;
    }

    return repositories.find(v => v.path === itemSelected.path);
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

        const open = localize(SearchAction.Open);
        const remove = localize(SearchAction.Remove);

        const doAction = await vscode.window.showInformationMessage(
          localize("tip.message.doWhat", "你想干嘛?", [repositorySymbol]),
          open,
          remove,
          localize(SearchAction.Cancel)
        );

        switch (doAction as SearchAction) {
          case open:
            return this.open(repository);
          case remove:
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
    this.explorer.star.clear();
    this.refresh();
  }
  private async runShell(cwd: string, command: string) {
    return new Promise((resolve, reject) => {
      shell.cd(cwd);

      const process = shell.exec(command, {
        async: true
      }) as ChildProcess;

      const bar = new Statusbar(Command.InterruptCommand);

      const processId = process.pid + "";

      this.processes.push({
        id: processId,
        cwd,
        cmd: command,
        process
      });

      const removeProcess = () => {
        const index = this.processes.findIndex(v => v.id === processId);
        if (index > -1) {
          this.processes.splice(index, 1);
        }
      };

      function handler(code: number, signal: string): void {
        removeProcess();
        code !== 0
          ? reject(new Error(signal || `Exit with code ${code}`))
          : resolve();
      }

      process
        .on("error", err => {
          removeProcess();
          reject(err);
        })
        .on("exit", handler)
        .on("close", handler);

      process.stdout.pipe(bar);
      process.stderr.pipe(bar);
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
