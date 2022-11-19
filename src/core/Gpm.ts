import * as fs from "fs-extra";
import * as path from "path";
import * as vscode from "vscode";
import i18n from "../common/Localize";
import { Output } from "../common/Output";
import { Terminal } from "../common/Terminal";
import {
  FileType,
  IFile,
  IOwner,
  IRepository,
  ISource,
  OpenAction,
  ProjectPostAddAction,
  PruneAction,
  SearchAction,
  SearchBehavior,
} from "../type";
import Pruner from "../util/pruner";
import { Config } from "./Config";
import { Git } from "./Git";
import { Resource } from "./Resource";
import { ProjectTreeProvider } from "./TreeView";

export class Gpm {
  constructor(
    private config: Config,
    private explorer: ProjectTreeProvider,
    private resource: Resource,
    private git: Git,
    private terminal: Terminal,
    private output: Output
  ) {}

  /**
   * clone project
   * @returns
   * @memberof Gpm
   */
  public async clone(): Promise<void> {
    const gitProjectAddress = await vscode.window.showInputBox({
      placeHolder: i18n.localize("tip.placeholder.addressExample", "例如 xxx"),
      prompt: i18n.localize("tip.placeholder.enterAddress", "请输入git地址"),
      ignoreFocusOut: true,
    });

    if (!gitProjectAddress) {
      return;
    }

    const PREFIX = "$(location)";

    const rootPaths = this.config.rootPath.map((r) => `${PREFIX}  ${r}`);

    if (!rootPaths.length) {
      vscode.window.showErrorMessage(
        i18n.localize("err.requireRootPath", "请至少设置一个 rootPath")
      );
      return;
    }

    // select a root path
    let baseDir =
      rootPaths.length > 1
        ? await vscode.window.showQuickPick(rootPaths, {
            placeHolder: i18n.localize(
              "tip.placeholder.selectRootPath",
              "选择一个根目录"
            ),
            ignoreFocusOut: true,
          })
        : rootPaths.shift();

    if (!baseDir) {
      return;
    }

    baseDir = baseDir.replace(PREFIX, "").trim();

    const res = await this.git.clone(gitProjectAddress, baseDir);

    this.refresh();

    if (!res) {
      this.output.writeln(`clone '${gitProjectAddress}' fail`);
      return;
    }

    this.output.writeln(`clone '${gitProjectAddress}' success`);

    const open = i18n.localize(ProjectPostAddAction.Open);
    const cancel = i18n.localize(ProjectPostAddAction.Cancel);

    const action: string | void = await vscode.window.showInformationMessage(
      i18n.localize("tip.message.cloned", "克隆成功", [res.owner, res.name]),
      open,
      cancel
    );

    switch (action as ProjectPostAddAction) {
      case open:
        await this.open({
          source: res.source,
          owner: res.owner,
          path: res.path,
          repository: res.name,
          type: FileType.Repository,
          rootPath: "",
        });
        break;
      case cancel:
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
  public async prune(): Promise<void> {
    const Continue = i18n.localize(PruneAction.Continue);
    const action = await vscode.window.showWarningMessage(
      i18n.localize("tip.message.pruneWarning", "移除警告"),
      Continue,
      i18n.localize(PruneAction.Cancel)
    );

    switch (action as PruneAction) {
      case Continue:
        break;
      default:
        return;
    }

    vscode.window.showInformationMessage(
      i18n.localize("tip.message.pruneWait")
    );

    const statusbar = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );

    statusbar.text = "[GPM]: searching...";
    statusbar.show();

    let num = 0;

    const prunePaths: string[] = [];

    for (const rootPath of this.config.rootPath) {
      const pruner = new Pruner(rootPath);
      pruner.on("found", (filepath: string) => {
        num++;
        prunePaths.push(filepath);
        statusbar.text = `[Found]: ${path.relative(rootPath, filepath)}`;
        statusbar.tooltip = `Found ${filepath} and remove it later.`;
      });
      await pruner.find();
    }

    for (const filepath of prunePaths) {
      statusbar.text = `[Delete]: ${filepath}`;
      statusbar.tooltip = `Deleting ${filepath}...`;
      await fs.remove(filepath);
    }

    statusbar.hide();
    statusbar.dispose();

    vscode.window.showInformationMessage(
      i18n.localize("tip.message.pruneReport", "报告", [num])
    );
    this.refresh();
  }
  /**
   * Remove project
   * @param {IRepository} repository
   * @memberof Gpm
   */
  public async remove(repository: IRepository): Promise<void> {
    // remove project
    await fs.remove(repository.path);

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
  public async removeOwner(owner: IOwner): Promise<void> {
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
  public async removeSource(source: ISource): Promise<void> {
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
  public async cleanCache(): Promise<void> {
    try {
      await this.git.clean();
      await vscode.window.showInformationMessage(
        i18n.localize("tip.message.clearReport", "清理完毕")
      );
    } catch (err) {
      if (err instanceof Error) {
        await vscode.window.showErrorMessage(err.message);
      }
    }
  }
  /**
   * Open Project
   * @param {IRepository} repository
   * @returns
   * @memberof Gpm
   */
  public async open(repository: IRepository): Promise<void> {
    const repositorySymbol = `@${repository.owner}/${repository.repository}`;

    const currentWindow = i18n.localize(OpenAction.CurrentWindow);
    const newWindow = i18n.localize(OpenAction.NewWindow);
    const workspace = i18n.localize(OpenAction.Workspace);

    const action = await vscode.window.showInformationMessage(
      i18n.localize("tip.message.how2open", "选择打开方式", [repositorySymbol]),
      workspace,
      newWindow,
      currentWindow,
      i18n.localize(OpenAction.Cancel)
    );

    switch (action as OpenAction) {
      case workspace:
        return this.openInWorkspace(repository);
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
  private async openFolder(filepath: string, ...res: unknown[]): Promise<void> {
    await vscode.commands.executeCommand(
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
  public async openInCurrentWindow(file: IFile): Promise<void> {
    return this.openFolder(file.path);
  }
  /**
   * Open file in new window
   * @param {IFile} file
   * @returns
   * @memberof Gpm
   */
  public async openInNewWindow(file: IFile): Promise<void> {
    return this.openFolder(file.path, true);
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

    const itemList = repositories.map((r) => {
      return {
        label: `$(repo)  ${r.owner}/${r.repository}`,
        description: r.source,
        path: r.path,
        // detail: r.path
      };
    });

    const itemSelected = await vscode.window.showQuickPick(itemList, {
      ...{
        matchOnDescription: false,
        matchOnDetail: false,
        placeHolder: i18n.localize(
          "tip.placeholder.selectProject",
          "请选择一个项目"
        ),
        ignoreFocusOut: true,
      },
      ...(options || {}),
    });

    if (!itemSelected) {
      return;
    }

    return repositories.find((v) => v.path === itemSelected.path);
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
  public refresh(): void {
    return this.explorer.refresh();
  }
  /**
   * Search project
   * @returns
   * @memberof Gpm
   */
  public async search(): Promise<unknown> {
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
      case SearchBehavior.AddToWorkspace:
        return this.openInWorkspace(repository);
      case SearchBehavior.Ask: {
        const repositorySymbol = `@${repository.owner}/${repository.repository}`;

        const open = i18n.localize(SearchAction.Open);
        const remove = i18n.localize(SearchAction.Remove);

        const doAction = await vscode.window.showInformationMessage(
          i18n.localize("tip.message.doWhat", "你想干嘛?", [repositorySymbol]),
          open,
          remove,
          i18n.localize(SearchAction.Cancel)
        );

        switch (doAction as SearchAction) {
          case open:
            return this.open(repository);
          case remove:
            return this.remove(repository);
          default:
            return;
        }
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
   * open project in workspace
   * @param repository
   */
  public openInWorkspace(repository: IRepository): void {
    const name = `${repository.source}/${repository.owner}/${repository.repository}`;
    const uri = vscode.Uri.file(repository.path);

    const workspace = vscode.workspace.getWorkspaceFolder(uri);

    if (workspace) {
      // TODO: if workspace exist. open it.
      // waiting for vscode api
    } else {
      vscode.workspace.updateWorkspaceFolders(
        vscode.workspace.workspaceFolders
          ? vscode.workspace.workspaceFolders.length
          : 0,
        null,
        { uri, name }
      );
    }
  }
  /**
   * Get the star list
   * @returns
   * @memberof Gpm
   */
  public starList(): IRepository[] {
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
