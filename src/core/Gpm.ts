import * as Walker from "@axetroy/walk";
import * as fs from "fs-extra";
import * as path from "path";
import { Inject, Service } from "typedi";
import * as vscode from "vscode";
import { Localize } from "../common/Localize";
import { Shell } from "../common/Shell";
import { Terminal } from "../common/Terminal";
import {
  FileType,
  Hook,
  IFile,
  IOwner,
  IRepository,
  ISource,
  OpenAction,
  ProjectPostAddAction,
  PruneAction,
  SearchAction,
  SearchBehavior
} from "../type";
import { Config } from "./Config";
import { Git } from "./Git";
import { Hooker } from "./Hook";
import { Resource } from "./Resource";
import { ProjectTreeProvider } from "./TreeView";

@Service()
export class Gpm {
  // current opening terminals
  @Inject() public config!: Config;
  @Inject() public i18n!: Localize;
  @Inject() public explorer!: ProjectTreeProvider;
  @Inject() public resource!: Resource;
  @Inject() public git!: Git;
  @Inject() public shell!: Shell;
  @Inject() public hook!: Hooker;
  @Inject() public terminal!: Terminal;
  /**
   * Add project
   * @returns
   * @memberof Gpm
   */
  public async add() {
    const gitProjectAddress = await vscode.window.showInputBox({
      placeHolder: this.i18n.localize(
        "tip.placeholder.addressExample",
        "例如 xxx"
      ),
      prompt: this.i18n.localize(
        "tip.placeholder.enterAddress",
        "请输入git地址"
      ),
      ignoreFocusOut: true
    });

    if (!gitProjectAddress) {
      return;
    }

    const PREFIX = "$(location)";

    const rootPaths = this.config.rootPath.map(
      rootpath => `${PREFIX}  ${rootpath}`
    );

    if (!rootPaths.length) {
      vscode.window.showErrorMessage(
        this.i18n.localize("err.requireRootPath", "请至少设置一个 rootPath")
      );
      return;
    }

    // select a root path
    let baseDir =
      rootPaths.length > 1
        ? await vscode.window.showQuickPick(rootPaths, {
            placeHolder: this.i18n.localize(
              "tip.placeholder.selectRootPath",
              "选择一个根目录"
            ),
            ignoreFocusOut: true
          })
        : rootPaths.shift();

    if (!baseDir) {
      return;
    }

    baseDir = baseDir.replace(PREFIX, "").trim();

    const res = await this.git.clone(gitProjectAddress, baseDir);

    this.refresh();

    if (!res) {
      return;
    }

    try {
      // run the hooks
      // whatever hook success or fail
      // it still going on
      await this.hook.run(res.path, Hook.Postadd);
    } catch (err) {
      console.error(err);
    }

    const open = this.i18n.localize(ProjectPostAddAction.Open);

    const action: string | void = await vscode.window.showInformationMessage(
      this.i18n.localize("tip.message.cloned", "克隆成功", [
        res.owner,
        res.name
      ]),
      open,
      this.i18n.localize(ProjectPostAddAction.Cancel)
    );

    switch (action as ProjectPostAddAction) {
      case open:
        await this.open({
          source: res.source,
          owner: res.owner,
          path: res.path,
          repository: res.name,
          type: FileType.Repository,
          rootPath: ""
        });
        break;
      default:
      // do nothing
    }
  }
  /**
   * Prune project, remove all node_modules folder
   * @returns
   * @memberof Gpm
   */
  public async prune() {
    const Continue = this.i18n.localize(PruneAction.Continue);
    const action = await vscode.window.showWarningMessage(
      this.i18n.localize("tip.message.pruneWarning", "移除警告"),
      Continue,
      this.i18n.localize(PruneAction.Cancel)
    );

    switch (action as PruneAction) {
      case Continue:
        break;
      default:
        return;
    }

    const done: Array<Promise<any>> = [];

    let files = 0;
    let directory = 0;
    let removeDirCount = 0;

    vscode.window.showInformationMessage(
      this.i18n.localize("tip.message.pruneWait")
    );

    for (const rootPath of this.config.rootPath) {
      const walker = new Walker(rootPath);

      walker.on("file", (filepath: string) => {
        files++;
      });

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

      await walker.walk();
    }

    await Promise.all(done);

    vscode.window.showInformationMessage(
      this.i18n.localize("tip.message.pruneReport", "报告", [
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
      await this.hook.run(repository.path, Hook.Preremove);
    } catch (err) {
      console.error(err);
    }

    // remove project
    await fs.remove(repository.path);

    // run the hooks after remove project
    // whatever hook success or fail
    // it still going on
    try {
      await this.hook.run(path.dirname(repository.path), Hook.Postremove);
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
        const repositoryEntity = this.resource.createRepository(
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
        const owner = this.resource.createOwner(source, ownerName);
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
      await this.git.clean();
      await vscode.window.showInformationMessage(
        this.i18n.localize("tip.message.clearReport", "清理完毕")
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

    const currentWindow = this.i18n.localize(OpenAction.CurrentWindow);
    const newWindow = this.i18n.localize(OpenAction.NewWindow);

    const action = await vscode.window.showInformationMessage(
      this.i18n.localize("tip.message.how2open", "选择打开方式", [
        repositorySymbol
      ]),
      newWindow,
      currentWindow,
      this.i18n.localize(OpenAction.Cancel)
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
    const itemList = this.shell.processes.map(v => {
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
      placeHolder: this.i18n.localize(
        "tip.placeholder.selectProcessAndKill",
        "选择一个进程然后kill掉"
      ),
      ignoreFocusOut: true
    });

    if (!processSelected) {
      return;
    }

    return this.shell.interrupt(processSelected.pid);
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
        placeHolder: this.i18n.localize(
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
    await this.terminal.open(file.path);
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

    const behavior = this.config.searchBehavior;

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

        const open = this.i18n.localize(SearchAction.Open);
        const remove = this.i18n.localize(SearchAction.Remove);

        const doAction = await vscode.window.showInformationMessage(
          this.i18n.localize("tip.message.doWhat", "你想干嘛?", [
            repositorySymbol
          ]),
          open,
          remove,
          this.i18n.localize(SearchAction.Cancel)
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
}
