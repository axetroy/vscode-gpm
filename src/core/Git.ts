import * as fs from "fs-extra";
import gitUrlParse from "git-url-parse";
import * as os from "os";
import * as path from "path";
import { Container, Inject, Service } from "typedi";
import uniqueString from "unique-string";
import * as vscode from "vscode";
import { Localize } from "../common/Localize";
import { Shell } from "../common/Shell";
import { ProjectExistAction } from "../type";
import { isLink } from "../util/is-link";
import { Config } from "./Config";

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
  @Inject() private Shell!: Shell;
  @Inject() private Config!: Config;
  // the cache dir that project will be clone.
  private CACHE_PATH: string =
    this.context.storagePath || path.join(os.tmpdir(), ".gpm", "temp");

  /**
   * check git command has been installed.
   */
  private async isGitAvailable(): Promise<boolean> {
    try {
      await this.Shell.run(process.cwd(), "git version");
      return true;
    } catch (err) {
      vscode.window.showErrorMessage(
        this.i18n.localize("err.gitNotInstall", "请确保Git已经安装")
      );
      return false;
    }
  }
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
            ignoreFocusOut: true
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
    if ((await this.isGitAvailable()) === false) {
      return;
    }

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
      await this.Shell.run(
        randomTemp,
        `git clone ${address} ${this.Config.cloneArgs}`
      );

      // move the dist
      await fs.ensureDir(dist);

      // if it's a link, then unlink first
      if (await isLink(dist)) {
        await fs.unlink(dist);
      }

      await fs.move(path.join(randomTemp, gitInfo.name), dist, {
        overwrite: true
      });

      return {
        source: gitInfo.source,
        owner: gitInfo.owner,
        name: gitInfo.name,
        path: dist
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
