import * as fs from "fs-extra";
import gitUrlParse from "git-url-parse";
import * as os from "os";
import * as path from "path";
import { Container, Inject, Service } from "typedi";
import uniqueString from "unique-string";
import * as vscode from "vscode";
import { Localize } from "../common/Localize";
import { Output } from "../common/Output";
import { findGit, Git as GitClient, GitError } from "../git/git";
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
  @Inject() private output!: Output;
  // the cache dir that project will be clone.
  private CACHE_PATH: string = this.context.storageUri?.fsPath
    ? this.context.storageUri?.fsPath
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

    const info = await findGit(pathHint, () => {
      /* empty block */
    });

    this.output.writeln(`found git '${info.path}' ${info.version}`);

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

    this.output.writeln(`clone project '${address}'`);
    this.output.writeln(`parse git info '${JSON.stringify(gitInfo, null, 2)}'`);

    // invalid git address
    if (!gitInfo || !gitInfo.owner || !gitInfo.name) {
      vscode.window.showErrorMessage(
        this.i18n.localize("err.invalidGitAddress", "无效的 Git 地址")
      );
      return;
    }

    // clone into temp file
    const randomTemp: string = this.createRandomTempDir();

    this.output.writeln(`temp dir '${randomTemp}'`);

    const dist = await this.getValidProjectName(
      path.join(
        baseDir,
        gitInfo.source,
        // use emoji arrow right: https://emojipedia.org/right-arrow/
        gitInfo.owner.replace(/\//gim, "➡️"),
        gitInfo.name
      )
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
              progress,
            },
            cancelToken
          );
        }
      );

      this.output.writeln(`cloned dir '${projectDir}'`);

      // move the dist
      await fs.ensureDir(dist);

      // if it's a link, then unlink first
      if (await isLink(dist)) {
        this.output.writeln(`unlink dir '${dist}'`);
        await fs.unlink(dist);
      }

      this.output.writeln(`start move '${projectDir}' to '${dist}'`);

      await fs.move(projectDir, dist, { overwrite: true });

      return {
        source: gitInfo.source,
        owner: gitInfo.owner,
        name: gitInfo.name,
        path: dist,
      };
    } catch (err) {
      if (err instanceof GitError) {
        this.output.writeln(err.error?.message);
        this.output.writeln(err.error?.stack);
        this.output.writeln(`Git command: ${err.gitCommand}`);
        this.output.writeln(`Git Arguments: ${err.gitArgs}`);
        this.output.writeln(err.stderr);
        this.output.writeln(`git error code: ${err.gitErrorCode}`);
        this.output.writeln(`exit code: ${err.exitCode}`);
      } else {
        this.output.writeln(err.stack || err.message || err + "");
      }
      this.output.show();
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
