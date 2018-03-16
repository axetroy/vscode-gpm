import * as vscode from "vscode";
import * as fs from "fs-extra";
import * as path from "path";

const GPM_PATH = path.join(<string>process.env.HOME, "gpm");

export class ProjectTreeProvider implements vscode.TreeDataProvider<File> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    File | undefined
  > = new vscode.EventEmitter<File | undefined>();
  readonly onDidChangeTreeData: vscode.Event<File | undefined> = this
    ._onDidChangeTreeData.event;

  constructor() {
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
        children.push(new Source(file));
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

        children.push(new Owner(element.filename, file));
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
          new Repo(path.basename(element.dir), element.filename, file)
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
}

class Source extends File {
  constructor(
    public sourceName: string,
    public readonly command?: vscode.Command
  ) {
    super(sourceName, GPM_PATH, 1, command);
    this.iconPath = vscode.ThemeIcon.Folder;
  }
}

class Owner extends File {
  constructor(
    public sourceName: string,
    public ownerName: string,
    public readonly command?: vscode.Command
  ) {
    super(ownerName, path.join(GPM_PATH, sourceName), 1, command);
    this.iconPath = vscode.ThemeIcon.Folder;
  }
}

class Repo extends File {
  constructor(
    public sourceName: string,
    public ownerName: string,
    public repoName: string,
    public readonly command?: vscode.Command
  ) {
    super(repoName, path.join(GPM_PATH, sourceName, ownerName), 1, command);
    this.iconPath = vscode.ThemeIcon.Folder;
  }
}
