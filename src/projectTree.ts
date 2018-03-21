import * as vscode from "vscode";
import * as fs from "fs-extra";
import * as path from "path";
import { getRootPath } from "./config";

function getIcon(context: vscode.ExtensionContext, icon: string) {
  return {
    dark: context.asAbsolutePath(path.join("resources", "dark", icon)),
    light: context.asAbsolutePath(path.join("resources", "light", icon))
  };
}

export type FileType = "file" | "folder" | "star" | "source" | "owner" | "repo";

export interface IFile extends vscode.TreeItem {
  type: FileType;
  path: string;
}

export interface IStar extends IFile {
  type: FileType;
  star(repo: IRepo): Promise<any>;
  unstar(repo: IRepo): Promise<any>;
  list(): IRepo[];
}

export interface ISource extends IFile {
  source: string;
}

export interface IOwner extends ISource {
  owner: string;
}

export interface IRepo extends IOwner {
  repo: string;
}

function createFile(context: vscode.ExtensionContext, filepath: string): IFile {
  return {
    label: path.basename(filepath),
    contextValue: "file",
    collapsibleState: 0,
    command: {
      title: "open",
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
  switch (sourceName) {
    case "github.com":
      item.iconPath = getIcon(context, "github.svg");
      break;
    case "gitlab.com":
      item.iconPath = getIcon(context, "gitlab.svg");
      break;
    case "coding.net":
      item.iconPath = getIcon(context, "coding.svg");
      break;
    case "bitbucket.org":
      item.iconPath = getIcon(context, "bitbucket.svg");
      break;
    case "apache.org":
      item.iconPath = getIcon(context, "apache.svg");
      break;
    case "googlesource.com":
      item.iconPath = getIcon(context, "google.svg");
      break;
    default:
      item.iconPath = getIcon(context, "git.svg");
  }
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
    iconPath: getIcon(context, "user.svg"),
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
): IRepo {
  return {
    label: repoName,
    contextValue: "project",
    collapsibleState: 1,
    command: void 0,
    iconPath: getIcon(context, "repo.svg"),
    // customer property
    source: owner.source,
    owner: owner.owner,
    repo: repoName,
    type: "repo",
    path: path.join(owner.path, repoName)
  };
}

function createStar(context: vscode.ExtensionContext): IStar {
  const storageKey: string = "@star";
  const starList: IRepo[] = context.globalState.get(storageKey) || [];

  return {
    label: "Your star",
    contextValue: "star",
    collapsibleState: 2,
    command: void 0,
    iconPath: getIcon(context, "star.svg"),
    tooltip: "The project you stared",
    // customer property
    type: "star",
    path: "", // empty path
    list() {
      return starList;
    },
    async star(repo: IRepo) {
      const index: number = starList.findIndex(r => {
        return (
          r.source === repo.source &&
          r.owner === repo.owner &&
          r.repo === repo.repo
        );
      });

      if (index < 0) {
        starList.push(repo);
        context.globalState.update(storageKey, starList);
      }
    },
    async unstar(repo: IRepo) {
      const index: number = starList.findIndex(r => {
        return (
          r.source === repo.source &&
          r.owner === repo.owner &&
          r.repo === repo.repo
        );
      });

      if (index >= 0) {
        starList.splice(index, 1);
        context.globalState.update(storageKey, starList);
      }
    }
  };
}

const type = {
  isSource: (o: any): o is ISource => o && o.type === "source",
  isOwner: (o: any): o is IOwner => o && o.type === "owner",
  isStar: (o: any): o is IStar => o && o.type === "star"
};

export class ProjectTreeProvider implements vscode.TreeDataProvider<IFile> {
  // @tslint-ignore: next-line
  private privateOnDidChangeTreeData: vscode.EventEmitter<
    IFile | undefined
  > = new vscode.EventEmitter<IFile | undefined>();
  public readonly onDidChangeTreeData: vscode.Event<IFile | undefined> = this
    .privateOnDidChangeTreeData.event;

  public star = createStar(this.context);
  constructor(public context: vscode.ExtensionContext) {}

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

    let children: IFile[] = [];
    const GPM_PATH: string = getRootPath();

    const elementFilePath: string = !element ? GPM_PATH : element.path;

    const files: string[] = await fs.readdir(elementFilePath);
    // root
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

        // skip empty project
        if (!owners || !owners.length) {
          continue;
        }

        children.push(createSource(this.context, file));
      }
    } else if (type.isSource(element)) {
      for (const file of files) {
        if (/^\./.test(file)) {
          continue;
        }
        const statInfo = await fs.stat(path.join(element.path, file));

        if (statInfo.isFile()) {
          continue;
        }

        const repos = await fs.readdir(path.join(element.path, file));

        // skip empty project
        if (!repos || !repos.length) {
          continue;
        }

        children.push(createOwner(this.context, element, file));
      }
    } else if (type.isOwner(element)) {
      for (const file of files) {
        if (/^\./.test(file)) {
          continue;
        }
        const statInfo = await fs.stat(path.join(element.path, file));

        if (statInfo.isFile()) {
          continue;
        }

        children.push(createRepo(this.context, element, file));
      }
    } else {
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

      children = dirList
        .map(dir => createFolder(this.context, path.join(element.path, dir)))
        .concat(
          fileList.map(filename =>
            createFile(
              this.context,
              path.join((element as IFile).path, filename)
            )
          )
        );
    }
    return children;
  }
}
