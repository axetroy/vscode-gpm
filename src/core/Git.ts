import * as fs from "fs-extra";
import gitUrlParse from "git-url-parse";
import * as os from "os";
import * as path from "path";
import { Container, Inject, Service } from "typedi";
import uniqueString from "unique-string";
import * as vscode from "vscode";
import { Localize } from "../common/Localize";
import { findGit, Git as GitClient } from "../git/git";
import { ProjectExistAction } from "../type";
import { isLink } from "../util/is-link";

interface IClone {
  source: string;
  owner: string;
  name: string;
  path: string;
}

@Service()
export class Git {
  private readonly context: vscode.ExtensionContext = Container.get("context");
  @Inject() private i18n!: Localize;
  // the cache dir that project will be clone.
  private CACHE_PATH: string = this.context.storageUri
    ? this.context.storageUri.fsPath
    : path.join(os.tmpdir(), ".gpm", "temp");

  /**
   * crate a random temp dir
   */
  private createRandomTempDir(): string {
    return path.join(this.CACHE_PATH, uniqueString());
  }
  /**
   * Get a valid project name
   * @param repositoryPath
   */
  private async getValidProjectName(
    repositoryPath: string
  ): Promise<string | void> {
    if (await fs.pathExists(repositoryPath)) {
      const overwrite = this.i18n.localize(ProjectExistAction.Overwrite);
      const rename = this.i18n.localize(ProjectExistAction.Rename);
      const actionName = await vscode.window.showWarningMessage(
        this.i18n.localize("tip.message.projectExist", "项目已存在"),
        overwrite,
        rename,
        this.i18n.localize(ProjectExistAction.Cancel)
      );

      switch (actionName as ProjectExistAction) {
        case overwrite:
          return repositoryPath;
        case rename:
          const newName = await vscode.window.showInputBox({
            prompt: this.i18n.localize(
              "tip.placeholder.requireNewRepo",
              "请输入新的项目名字"
            ),
            ignoreFocusOut: true,
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
   * clone project to baseDir
   * @param address
   * @param baseDir
   */
  public async clone(address: string, baseDir: string): Promise<IClone | void> {
    const pathHint = vscode.workspace
      .getConfiguration("git")
      .get<string | string[]>("path");

    const info = await findGit(pathHint, () => {});

    const client = new GitClient({
      gitPath: info.path,
      userAgent: `git/${info.version} (${
        (os as any).version?.() ?? os.type()
      } ${os.release()}; ${os.platform()} ${os.arch()}) vscode/${
        vscode.version
      } (${vscode.env.appName})`,
      version: info.version,
      env: process.env,
    });

    const gitInfo = gitUrlParse(address);

    // invalid git address
    if (!gitInfo || !gitInfo.owner || !gitInfo.name) {
      vscode.window.showErrorMessage(
        this.i18n.localize("err.invalidGitAddress", "无效的 Git 地址")
      );
      return;
    }

    // clone into temp file
    const randomTemp: string = this.createRandomTempDir();

    const dist = await this.getValidProjectName(
      path.join(baseDir, gitInfo.source, gitInfo.owner, gitInfo.name)
    );

    if (!dist) {
      return;
    }

    await fs.ensureDir(randomTemp);

    try {
      const projectDir = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: this.i18n.localize("cmd.add.cloning", "克隆中...", [address]),
          cancellable: true,
        },
        (progress, cancelToken) => {
          return client.clone(
            address,
            {
              recursive: true,
              parentPath: randomTemp,
              progress: progress,
            },
            cancelToken
          );
        }
      );

      // move the dist
      await fs.ensureDir(dist);

      // if it's a link, then unlink first
      if (await isLink(dist)) {
        await fs.unlink(dist);
      }

      await fs.move(projectDir, dist, {
        overwrite: true,
      });

      return {
        source: gitInfo.source,
        owner: gitInfo.owner,
        name: gitInfo.name,
        path: dist,
      };
    } catch (err) {
      await fs.remove(randomTemp);
      if (err.message === "SIGKILL") {
        throw new Error(this.i18n.localize("err.processKilled"));
      }
      throw err;
    }
  }
  /**
   * Clear cache
   */
  public async clean() {
    await fs.remove(this.CACHE_PATH);
  }
}
