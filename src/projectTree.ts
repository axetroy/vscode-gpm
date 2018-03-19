import * as vscode from "vscode";
import * as fs from "fs-extra";
import * as path from "path";
import { getRootPath } from "./config";

export class ProjectTreeProvider implements vscode.TreeDataProvider<File> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    File | undefined
  > = new vscode.EventEmitter<File | undefined>();
  readonly onDidChangeTreeData: vscode.Event<File | undefined> = this
    ._onDidChangeTreeData.event;

  constructor(public context: vscode.ExtensionContext) {
    this.onDidChangeTreeData(function(event) {});
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: File): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: File): Promise<File[]> {
    let children: File[] = [];
    const GPM_PATH = getRootPath();

    const elementFilePath: string = !element ? GPM_PATH : element.filepath;
    const files: string[] = await fs.readdir(elementFilePath);
    // root
    if (!element) {
      for (let file of files) {
        if (/^\./.test(file)) {
          continue;
        }
        const statInfo = await fs.stat(path.join(GPM_PATH, file));

        if (statInfo.isFile()) {
          continue;
        }
        children.push(new Source(this.context, file));
      }
    } else if (element instanceof Source) {
      for (let file of files) {
        if (/^\./.test(file)) {
          continue;
        }
        const statInfo = await fs.stat(path.join(element.filepath, file));

        if (statInfo.isFile()) {
          continue;
        }

        children.push(new Owner(this.context, element.filename, file));
      }
    } else if (element instanceof Owner) {
      for (let file of files) {
        if (/^\./.test(file)) {
          continue;
        }
        const statInfo = await fs.stat(path.join(element.filepath, file));

        if (statInfo.isFile()) {
          continue;
        }

        children.push(
          new Repo(
            this.context,
            path.basename(element.dir),
            element.filename,
            file
          )
        );
      }
    } else {
      const _files: string[] = [];
      const _dirs: string[] = [];

      for (let file of files) {
        const stat = await fs.stat(path.join(element.filepath, file));
        if (stat.isDirectory()) {
          _dirs.push(file);
        } else {
          _files.push(file);
        }
      }

      children = _dirs
        .map(dir => {
          return new File(
            this.context,
            dir,
            element.filepath,
            1,
            void 0,
            vscode.ThemeIcon.Folder
          );
        })
        .concat(
          _files.map(filename => {
            return new File(
              this.context,
              filename,
              element.filepath,
              0,
              {
                title: "打开",
                command: "gpm.open",
                arguments: [path.join(element.filepath, filename)]
              },
              vscode.ThemeIcon.File
            );
          })
        );
    }
    return children;
  }
}

class File extends vscode.TreeItem {
  public filepath: string;
  constructor(
    public context: vscode.ExtensionContext,
    public filename: string,
    public dir: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command,
    public iconPath?:
      | string
      | vscode.Uri
      | { light: string | vscode.Uri; dark: string | vscode.Uri }
      | vscode.ThemeIcon
  ) {
    super(filename, collapsibleState);
    this.filepath = path.join(dir, filename);
  }
  getIcon(icon: string) {
    return {
      dark: this.context.asAbsolutePath(path.join("resources", "dark", icon)),
      light: this.context.asAbsolutePath(path.join("resources", "light", icon))
    };
  }
}

class Source extends File {
  constructor(
    public context: vscode.ExtensionContext,
    public sourceName: string,
    public readonly command?: vscode.Command
  ) {
    super(context, sourceName, getRootPath(), 1, command);
    switch (sourceName) {
      case "github.com":
        this.iconPath = this.getIcon("github.svg");
        break;
      case "gitlab.com":
        this.iconPath = this.getIcon("gitlab.svg");
        break;
      case "coding.net":
        this.iconPath = this.getIcon("coding.svg");
        break;
      case "bitbucket.org":
        this.iconPath = this.getIcon("bitbucket.svg");
        break;
      case "apache.org":
        this.iconPath = this.getIcon("apache.svg");
        break;
      case "googlesource.com":
        this.iconPath = this.getIcon("google.svg");
        break;
      default:
        this.iconPath = this.getIcon("git.svg");
    }
    this.contextValue = "source";
  }
}

class Owner extends File {
  constructor(
    public context: vscode.ExtensionContext,
    public sourceName: string,
    public ownerName: string,
    public readonly command?: vscode.Command
  ) {
    super(context, ownerName, path.join(getRootPath(), sourceName), 1, command);
    this.iconPath = this.getIcon("user.svg");
    this.contextValue = "owner";
  }
}

class Repo extends File {
  constructor(
    public context: vscode.ExtensionContext,
    public sourceName: string,
    public ownerName: string,
    public repoName: string,
    public readonly command?: vscode.Command
  ) {
    super(
      context,
      repoName,
      path.join(getRootPath(), sourceName, ownerName),
      1,
      command
    );
    this.iconPath = this.getIcon("repo.svg");
    this.contextValue = "project";
  }
}
