import * as vscode from "vscode";
import * as fs from "fs-extra";
import * as path from "path";
import config from "./config";

import { FileType, IFile, ISource, IOwner, IRepository, IStar } from "./type";
import localize from "./localize";

/**
 * Get icon from a given path
 * @param {vscode.ExtensionContext} context
 * @param {string[]} paths
 * @returns
 */
function getIcon(context: vscode.ExtensionContext, paths: string[]) {
  return {
    dark: context.asAbsolutePath(path.join("resources", "dark", ...paths)),
    light: context.asAbsolutePath(path.join("resources", "light", ...paths))
  };
}

/**
 * Create file
 * @export
 * @param {vscode.ExtensionContext} context
 * @param {string} filepath
 * @returns {IFile}
 */
export function createFile(
  context: vscode.ExtensionContext,
  filepath: string
): IFile {
  return {
    label: path.basename(filepath),
    contextValue: FileType.File,
    collapsibleState: 0,
    command: {
      title: "Open file",
      command: "gpm.open",
      arguments: [filepath]
    },
    iconPath: vscode.ThemeIcon.File,
    // customer property
    type: FileType.File,
    path: filepath
  };
}

/**
 * Create folder
 * @export
 * @param {vscode.ExtensionContext} context
 * @param {string} filepath
 * @returns {IFile}
 */
export function createFolder(
  context: vscode.ExtensionContext,
  filepath: string
): IFile {
  return {
    label: path.basename(filepath),
    contextValue: FileType.Folder,
    collapsibleState: 1,
    command: void 0,
    iconPath: vscode.ThemeIcon.Folder,
    // customer property
    type: FileType.Folder,
    path: filepath
  };
}

/**
 * Create source
 * @export
 * @param {vscode.ExtensionContext} context
 * @param {string} sourceName
 * @returns {ISource}
 */
export function createSource(
  context: vscode.ExtensionContext,
  sourceName: string,
  rootPath: string
): ISource {
  const item: ISource = {
    id: `${rootPath}/${sourceName}`,
    label: sourceName,
    contextValue: FileType.Source,
    collapsibleState: 1,
    command: void 0,
    iconPath: "",
    // customer property
    source: sourceName,
    type: FileType.Source,
    path: path.join(rootPath, sourceName)
  };
  let icon: string = "";
  switch (sourceName) {
    case "github.com":
      icon = "github.svg";
      break;
    case "gitlab.com":
      icon = "gitlab.svg";
      break;
    case "coding.net":
      icon = "coding.svg";
      break;
    case "bitbucket.org":
      icon = "bitbucket.svg";
      break;
    case "apache.org":
      icon = "apache.svg";
      break;
    case "googlesource.com":
      icon = "google.svg";
      break;
    case "go4.org":
    case "golang":
    case "golang.org":
    case "gopkg.in":
      icon = "golang.svg";
      break;
    default:
      icon = "git.svg";
  }
  item.iconPath = getIcon(context, ["source", icon]);

  return item;
}

/**
 * Create owner
 * @export
 * @param {vscode.ExtensionContext} context
 * @param {ISource} source
 * @param {string} ownerName
 * @returns {IOwner}
 */
export function createOwner(
  context: vscode.ExtensionContext,
  source: ISource,
  ownerName: string
): IOwner {
  return {
    id: `${source.id}/${ownerName}`,
    label: ownerName,
    contextValue: FileType.Owner,
    collapsibleState: 1,
    command: void 0,
    iconPath: getIcon(context, ["user.svg"]),
    // customer property
    source: source.source,
    owner: ownerName,
    type: FileType.Owner,
    path: path.join(source.path, ownerName)
  };
}

/**
 * Create repository
 * @export
 * @param {vscode.ExtensionContext} context
 * @param {IOwner} owner
 * @param {string} repositoryName
 * @returns {IRepository}
 */
export function createRepository(
  context: vscode.ExtensionContext,
  owner: IOwner,
  repositoryName: string
): IRepository {
  return {
    id: `${owner.id}/${repositoryName}`,
    label: repositoryName,
    contextValue: FileType.Repository,
    collapsibleState: 1,
    command: void 0,
    iconPath: getIcon(context, ["repository.svg"]),
    // customer property
    source: owner.source,
    owner: owner.owner,
    repository: repositoryName,
    type: FileType.Repository,
    path: path.join(owner.path, repositoryName)
  };
}

/**
 * Create star
 * @export
 * @param {vscode.ExtensionContext} context
 * @returns {IStar}
 */
export function createStar(context: vscode.ExtensionContext): IStar {
  const storageKey: string = "@stars";
  const staredSuffix = "@stared";

  const starList: IRepository[] = context.globalState.get(storageKey) || [];

  function findIndex(repository: IRepository): number {
    return starList.findIndex(r => {
      return repository.path === r.path;
    });
  }

  function update(value: IRepository[] = starList) {
    context.globalState.update(storageKey, value);
  }

  return {
    label: localize("ext.view.star", "你的收藏"),
    contextValue: FileType.Star,
    collapsibleState: 2,
    iconPath: getIcon(context, ["star.svg"]),
    tooltip: localize("ext.view.stared", "你的收藏的项目"),
    // customer property
    type: FileType.Star,
    path: "", // empty path
    list() {
      return starList;
    },
    find(repository: IRepository): IRepository | void {
      const index = findIndex(repository);
      if (index >= 0) {
        return starList[index];
      }
    },
    async star(repository: IRepository) {
      if (findIndex(repository) < 0) {
        const newRepository = { ...repository };
        newRepository.id = repository.id + staredSuffix;
        newRepository.contextValue = FileType.RepositoryStared;
        starList.push(newRepository);
        update();
      }
    },
    async unstar(repository: IRepository) {
      const index = findIndex(repository);
      if (index >= 0) {
        repository.contextValue = FileType.Repository;
        starList.splice(index, 1);
        update();
      }
    },
    clear() {
      for (const repository of starList) {
        repository.contextValue = FileType.Repository;
      }
      starList.splice(0, starList.length);
      update();
    }
  };
}

function isVisiblePath(name: string): boolean {
  return !/^\./.test(name);
}

function flatten(array: any[]) {
  return array.reduce((a: any[], b: any[]) => a.concat(b), []);
}

const type = {
  isSource: (o: any): o is ISource => o && o.type === FileType.Source,
  isOwner: (o: any): o is IOwner => o && o.type === FileType.Owner,
  isRepository: (o: any): o is IRepository =>
    o && o.type === FileType.Repository,
  isStar: (o: any): o is IStar => o && o.type === FileType.Star
};

export class ProjectTreeProvider implements vscode.TreeDataProvider<IFile> {
  private privateOnDidChangeTreeData: vscode.EventEmitter<
    IFile | undefined
  > = new vscode.EventEmitter<IFile | undefined>();
  public readonly onDidChangeTreeData: vscode.Event<IFile | undefined> = this
    .privateOnDidChangeTreeData.event;

  public star = createStar(this.context);
  constructor(public context: vscode.ExtensionContext) {}

  public traverse(): Promise<IRepository[]> {
    return this.getChildren()
      .then(sources => {
        return Promise.all(sources.map(source => this.getChildren(source)));
      })
      .then(list => {
        const owners: IOwner[] = flatten(list);
        return Promise.all(owners.map(owner => this.getChildren(owner)));
      })
      .then(list => {
        const repositories: IRepository[] = (flatten(list) as IFile[]).filter(
          type.isRepository
        );
        return Promise.resolve(repositories);
      });
  }

  public refresh(): void {
    this.privateOnDidChangeTreeData.fire();
  }

  public getTreeItem(element: IFile): vscode.TreeItem {
    return element;
  }

  public async getChildren(element?: IFile): Promise<IFile[]> {
    if (!element) {
      return this.getSources();
    }

    if (type.isStar(element)) {
      return element.list();
    }

    if (type.isSource(element)) {
      return this.getOwner(element);
    }

    if (type.isOwner(element)) {
      return this.getRepository(element);
    }

    return this.getExplorer(element);
  }
  private async getSources() {
    const children: IFile[] = [];

    // concat with star
    if (this.star.list().length) {
      children.push(this.star);
    }

    for (const GPM_ROOT_PATH of config.rootPath) {
      const files: string[] = (await fs.readdir(GPM_ROOT_PATH)).filter(
        isVisiblePath
      );

      for (const file of files) {
        const statInfo = await fs.stat(path.join(GPM_ROOT_PATH, file));

        if (statInfo.isFile()) {
          continue;
        }

        children.push(createSource(this.context, file, GPM_ROOT_PATH));
      }
    }

    return children;
  }
  private async getOwner(element: ISource): Promise<IOwner[]> {
    const children: IOwner[] = [];

    const files: string[] = (await fs.readdir(element.path)).filter(
      isVisiblePath
    );

    for (const file of files) {
      const statInfo = await fs.stat(path.join(element.path, file));

      if (statInfo.isFile()) {
        continue;
      }

      children.push(createOwner(this.context, element, file));
    }
    return children;
  }
  private async getRepository(element: IOwner): Promise<IRepository[]> {
    const children: IRepository[] = [];

    const files: string[] = (await fs.readdir(element.path)).filter(
      isVisiblePath
    );

    for (const file of files) {
      const statInfo = await fs.stat(path.join(element.path, file));

      if (statInfo.isFile()) {
        continue;
      }

      const repository = createRepository(this.context, element, file);

      const staredRepository = this.star.find(repository);

      if (staredRepository) {
        repository.contextValue = FileType.RepositoryStared;
      }

      children.push(repository);
    }
    return children;
  }

  private async getExplorer(element: IFile): Promise<IFile[]> {
    const children: IFile[] = [];
    const fileList: string[] = [];
    const dirList: string[] = [];

    const files: string[] = await fs.readdir(element.path);

    for (const file of files) {
      const stat = await fs.stat(path.join((element as IFile).path, file));
      if (stat.isDirectory()) {
        dirList.push(file);
      } else {
        fileList.push(file);
      }
    }

    dirList
      .map(dir => createFolder(this.context, path.join(element.path, dir)))
      .concat(
        fileList.map(filename =>
          createFile(this.context, path.join((element as IFile).path, filename))
        )
      )
      .forEach(ele => children.push(ele));

    return children;
  }
}
