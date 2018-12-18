import * as path from "path";
import { Container, Service } from "typedi";
import * as vscode from "vscode";
import {
  Command,
  FileType,
  IFile,
  IOwner,
  IRepository,
  ISource,
  IStar,
  ISegmentation
} from "../type";

@Service()
export class Resource {
  private context: vscode.ExtensionContext = Container.get("context");
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
      tooltip: filepath,
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
      tooltip: `${rootPath}/${sourceName}`,
      // customer property
      source: sourceName,
      type: FileType.Source,
      path: path.join(rootPath, sourceName),
      rootPath
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
      tooltip: `${source.source}/${ownerName}`,
      // customer property
      source: source.source,
      owner: ownerName,
      type: FileType.Owner,
      path: path.join(source.path, ownerName),
      rootPath: source.rootPath
    };
  }
  public createRepository(owner: IOwner, repositoryName: string, isFlattenOwner: boolean = false): IRepository {
    return {
      id: `${owner.id}/${repositoryName}`,
      label: isFlattenOwner ? owner.owner + '/' + repositoryName : repositoryName,
      contextValue: FileType.Repository,
      collapsibleState: 1,
      command: void 0,
      iconPath: this.getIcon("repository.svg"),
      tooltip: `${owner.source}/${owner.owner}/${repositoryName}`,
      // customer property
      source: owner.source,
      owner: owner.owner,
      repository: repositoryName,
      type: FileType.Repository,
      path: path.join(owner.path, repositoryName),
      rootPath: owner.rootPath
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
  public isSegmentation(o: any): o is ISegmentation {
    return o && o.type === FileType.Segmentation;
  }
}
