import * as vscode from "vscode";
import * as fs from "fs-extra";
import * as path from "path";
import { getRootPath } from "./config";

function getIcon(context: vscode.ExtensionContext, paths: string[]) {
  return {
    dark: context.asAbsolutePath(path.join("resources", "dark", ...paths)),
    light: context.asAbsolutePath(path.join("resources", "light", ...paths))
  };
}

function getSourceIcon(context: vscode.ExtensionContext, name: string) {
  return getIcon(context, ["source", name]);
}

export type FileType =
  | "file"
  | "folder"
  | "star"
  | "source"
  | "owner"
  | "repository";

export interface IFile extends vscode.TreeItem {
  type: FileType;
  path: string;
}

export interface IStar extends IFile {
  type: FileType;
  find(repository: IRepository): IRepository | void;
  star(repository: IRepository): Promise<any>;
  unstar(repository: IRepository): Promise<any>;
  list(): IRepository[];
  clear(): void;
}

export interface ISource extends IFile {
  source: string;
}

export interface IOwner extends ISource {
  owner: string;
}

export interface IRepository extends IOwner {
  repository: string;
}

function createFile(context: vscode.ExtensionContext, filepath: string): IFile {
  return {
    label: path.basename(filepath),
    contextValue: "file",
    collapsibleState: 0,
    command: {
      title: "Open file",
      command: "gpm.open",
      arguments: [filepath]
    },
    iconPath: vscode.ThemeIcon.File,
    // customer property
    type: "file",
    path: filepath
  };
}

function createFolder(
  context: vscode.ExtensionContext,
  filepath: string
): IFile {
  return {
    label: path.basename(filepath),
    contextValue: "folder",
    collapsibleState: 1,
    command: void 0,
    iconPath: vscode.ThemeIcon.Folder,
    // customer property
    type: "folder",
    path: filepath
  };
}

function createSource(
  context: vscode.ExtensionContext,
  sourceName: string
): ISource {
  const rootPath: string = getRootPath();
  const item: ISource = {
    label: sourceName,
    contextValue: "source",
    collapsibleState: 1,
    command: void 0,
    iconPath: "",
    // customer property
    source: sourceName,
    type: "source",
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
    default:
      icon = "git.svg";
  }
  item.iconPath = getSourceIcon(context, icon);

  return item;
}

function createOwner(
  context: vscode.ExtensionContext,
  source: ISource,
  ownerName: string
): IOwner {
  return {
    label: ownerName,
    contextValue: "owner",
    collapsibleState: 1,
    command: void 0,
    iconPath: getIcon(context, ["user.svg"]),
    // customer property
    source: source.source,
    owner: ownerName,
    type: "owner",
    path: path.join(source.path, ownerName)
  };
}

function createRepo(
  context: vscode.ExtensionContext,
  owner: IOwner,
  repoName: string
): IRepository {
  return {
    label: repoName,
    contextValue: "repository",
    collapsibleState: 1,
    command: void 0,
    iconPath: getIcon(context, ["repository.svg"]),
    // customer property
    source: owner.source,
    owner: owner.owner,
    repository: repoName,
    type: "repository",
    path: path.join(owner.path, repoName)
  };
}

function createStar(context: vscode.ExtensionContext): IStar {
  const storageKey: string = "@stars";
  const starList: IRepository[] = context.globalState.get(storageKey) || [];

  function findIndex(repository: IRepository): number {
    return starList.findIndex(r => {
      return (
        r.source === repository.source &&
        r.owner === repository.owner &&
        r.repository === repository.repository
      );
    });
  }

  return {
    label: "Your stars",
    contextValue: "star",
    collapsibleState: 2,
    iconPath: getIcon(context, ["star.svg"]),
    tooltip: "The project you stared",
    // customer property
    type: "star",
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
        repository.contextValue = "repository.stared";
        starList.push(repository);
        context.globalState.update(storageKey, starList);
      }
    },
    async unstar(repository: IRepository) {
      const index = findIndex(repository);
      if (index >= 0) {
        repository.contextValue = "repository";
        starList.splice(index, 1);
        context.globalState.update(storageKey, starList);
      }
    },
    clear() {
      for (const repository of starList) {
        repository.contextValue = "repository";
      }
      starList.splice(0, starList.length);
      context.globalState.update(storageKey, starList);
    }
  };
}

const type = {
  isSource: (o: any): o is ISource => o && o.type === "source",
  isOwner: (o: any): o is IOwner => o && o.type === "owner",
  isRepository: (o: any): o is IRepository => o && o.type === "repository",
  isStar: (o: any): o is IStar => o && o.type === "star"
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
    function flatten(array: any[]) {
      return array.reduce((a: any[], b: any[]) => {
        return a.concat(b);
      }, []);
    }

    return this.getChildren()
      .then(sources => {
        const promiseList: Array<Promise<IFile[]>> = [];
        for (const source of sources) {
          promiseList.push(this.getChildren(source));
        }
        return Promise.all(promiseList);
      })
      .then(list => {
        const owners: IOwner[] = flatten(list);
        const promiseList: Array<Promise<IFile[]>> = [];
        for (const owner of owners) {
          promiseList.push(this.getChildren(owner));
        }
        return Promise.all(promiseList);
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
    if (type.isStar(element)) {
      return element.list();
    }

    const children: IFile[] = [];
    const GPM_PATH: string = getRootPath();

    const elementFilePath: string = !element ? GPM_PATH : element.path;

    const files: string[] = await fs.readdir(elementFilePath);

    if (!element) {
      if (this.star.list().length) {
        children.push(this.star);
      }

      for (const file of files) {
        if (/^\./.test(file)) {
          continue;
        }
        const statInfo = await fs.stat(path.join(GPM_PATH, file));

        if (statInfo.isFile()) {
          continue;
        }

        const owners = await fs.readdir(path.join(GPM_PATH, file));

        // skip empty repository
        if (!owners || !owners.length) {
          continue;
        }

        children.push(createSource(this.context, file));
      }
      return children;
    }

    if (type.isSource(element)) {
      for (const file of files) {
        if (/^\./.test(file)) {
          continue;
        }
        const statInfo = await fs.stat(path.join(element.path, file));

        if (statInfo.isFile()) {
          continue;
        }

        const repositories = await fs.readdir(path.join(element.path, file));

        // skip empty repository
        if (!repositories || !repositories.length) {
          continue;
        }

        children.push(createOwner(this.context, element, file));
      }
      return children;
    }

    if (type.isOwner(element)) {
      for (const file of files) {
        if (/^\./.test(file)) {
          continue;
        }
        const statInfo = await fs.stat(path.join(element.path, file));

        if (statInfo.isFile()) {
          continue;
        }

        const repository = createRepo(this.context, element, file);

        const staredRepo = this.star.find(repository);

        children.push(staredRepo ? staredRepo : repository);
      }
      return children;
    }

    const fileList: string[] = [];
    const dirList: string[] = [];

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
