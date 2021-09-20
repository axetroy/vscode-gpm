import * as os from "os";
import * as path from "path";
import { Service } from "typedi";
import * as vscode from "vscode";
import { SearchBehavior } from "../type";

@Service()
export class Config {
  private extensionField = "gpm";
  public fields = {
    ROOT_PATH: "rootPath",
    IS_AUTO_RUN_HOOK: "isAutoRunHook",
    SEARCH_BEHAVIOR: "searchBehavior",
    IS_FLATTEN_PROJECTS: "flattenProjects",
  };
  /**
   * Get configuration of this extension
   * @readonly
   * @memberof Config
   */
  get configuration(): vscode.WorkspaceConfiguration {
    return vscode.workspace.getConfiguration(this.extensionField);
  }
  /**
   * Get root path
   * @readonly
   * @memberof Config
   */
  get rootPath(): string[] {
    const rootPath = this.select(this.fields.ROOT_PATH).get() as string[];

    return rootPath.map((v: string) =>
      path.normalize(
        v
          .trim()
          .replace(/^~/, os.homedir())
          .replace("$HOME", os.homedir())
          .replace(/\$\w+/, (word: string) => process.env[word.replace(/^\$/, "")] as string)
          .replace(/\//g, path.sep)
      )
    );
  }
  get isAutoRunHook(): boolean {
    return !!this.select(this.fields.IS_AUTO_RUN_HOOK).get();
  }
  get searchBehavior(): SearchBehavior {
    return this.select(this.fields.SEARCH_BEHAVIOR).get() as SearchBehavior;
  }
  get isFlattenProjects(): boolean {
    return !!this.select(this.fields.IS_FLATTEN_PROJECTS).get();
  }
  /**
   * select a field
   * @param {string} field
   * @returns
   * @memberof Config
   */
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public select(field: string) {
    return {
      get: () => {
        return this.configuration.get(field);
      },
      update: (value: unknown, configurationTarget: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global) => {
        return this.configuration.update(field, value, configurationTarget);
      },
    };
  }
}
