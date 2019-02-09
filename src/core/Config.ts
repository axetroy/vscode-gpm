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
  get configuration() {
    return vscode.workspace.getConfiguration(this.extensionField);
  }
  /**
   * Get root path
   * @readonly
   * @memberof Config
   */
  get rootPath(): string[] {
    // 由于历史原因，读出来的可能是字符串而不是数组
    const rootPath = this.select(this.fields.ROOT_PATH).get() as
      | string
      | string[];

    const rootPathArray: string[] = Array.isArray(rootPath)
      ? rootPath
      : rootPath.split(",").map(v => v.trim());
    return rootPathArray.map((v: string) =>
      path.normalize(
        v
          .trim()
          .replace(/^~/, process.env.HOME as string)
          .replace("$HOME", os.homedir())
          .replace(
            /\$\w+/,
            (word: string) => process.env[word.replace(/^\$/, "")] as string
          )
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
  public select(field: string) {
    // return this.configuration.get(field);
    return {
      get: () => {
        return this.configuration.get(field);
      },
      update: (
        value: any,
        configurationTarget?: vscode.ConfigurationTarget | boolean
      ) => {
        return this.configuration.update(field, value, configurationTarget);
      }
    };
  }
}