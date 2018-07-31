import * as path from "path";
import { Container, Service, Inject } from "typedi";
import * as vscode from "vscode";
import { Localize } from "../common/localize";
import {
  Command,
  FileType,
  IFile,
  IOwner,
  IRepository,
  ISource,
  IStar
} from "../type";

@Service()
export class Resource {
  private context: vscode.ExtensionContext = Container.get("context");
  @Inject() private i18n!: Localize;
  public createFile(filepath: string): IFile {
    return {
      label: path.basename(filepath),
      contextValue: FileType.File,
      collapsibleState: 0,
      command: {
        title: "Open file",
        command: Command.OpenFile,
        arguments: [filepath]
      },
      iconPath: vscode.ThemeIcon.File,
      // customer property
      type: FileType.File,
      path: filepath
    };
  }
  public createFolder(filepath: string): IFile {
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
  public createSource(sourceName: string, rootPath: string): ISource {
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
      case "gitee.com":
        icon = "gitee.svg";
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
    item.iconPath = this.getIcon("source", icon);

    return item;
  }
  public createOwner(source: ISource, ownerName: string): IOwner {
    return {
      id: `${source.id}/${ownerName}`,
      label: ownerName,
      contextValue: FileType.Owner,
      collapsibleState: 1,
      command: void 0,
      iconPath: this.getIcon("user.svg"),
      // customer property
      source: source.source,
      owner: ownerName,
      type: FileType.Owner,
      path: path.join(source.path, ownerName)
    };
  }
  public createRepository(owner: IOwner, repositoryName: string): IRepository {
    return {
      id: `${owner.id}/${repositoryName}`,
      label: repositoryName,
      contextValue: FileType.Repository,
      collapsibleState: 1,
      command: void 0,
      iconPath: this.getIcon("repository.svg"),
      // customer property
      source: owner.source,
      owner: owner.owner,
      repository: repositoryName,
      type: FileType.Repository,
      path: path.join(owner.path, repositoryName)
    };
  }
  public createStar(): IStar {
    const context = this.context;
    const i18n = this.i18n;
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
      label: i18n.localize("ext.view.star", "你的收藏"),
      contextValue: FileType.Star,
      collapsibleState: 2,
      iconPath: this.getIcon("star.svg"),
      tooltip: i18n.localize("ext.view.stared", "你的收藏的项目"),
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
  public getIcon(...paths: string[]) {
    const context = this.context;
    return {
      dark: context.asAbsolutePath(path.join("resources", "dark", ...paths)),
      light: context.asAbsolutePath(path.join("resources", "light", ...paths))
    };
  }
  public isSource(o: any): o is ISource {
    return o && o.type === FileType.Source;
  }
  public isOwner(o: any): o is IOwner {
    return o && o.type === FileType.Owner;
  }
  public isRepository(o: any): o is IRepository {
    return o && o.type === FileType.Repository;
  }
  public isStar(o: any): o is IStar {
    return o && o.type === FileType.Star;
  }
}
