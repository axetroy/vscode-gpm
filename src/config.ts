import * as vscode from "vscode";
import * as path from "path";
import * as os from "os";

export type SearchBehavior =
  | "openInNewWindow"
  | "openInCurrentWindow"
  | "remove"
  | "star"
  | "unstar"
  | "ask";

class Config {
  private extensionField = "gpm";
  public fields = {
    ROOT_PATH: "rootPath",
    CAN_SHOW_EXPLORER: "showExplorer",
    IS_AUTO_RUN_HOOK: "isAutoRunHook",
    SEARCH_BEHAVIOR: "searchBehavior"
  };
  get configuration() {
    return vscode.workspace.getConfiguration(this.extensionField);
  }
  /**
   * Get root path
   * @readonly
   * @memberof Config
   */
  get rootPath(): string {
    return path.normalize(
      (this.select(this.fields.ROOT_PATH).get() as string)
        .replace(/^~/, process.env.HOME as string)
        .replace("$HOME", os.homedir())
        .replace(
          /\$\w+/,
          (word: string) => process.env[word.replace(/^\$/, "")] as string
        )
    );
  }
  get isAutoRunHook(): boolean {
    return !!this.select(this.fields.IS_AUTO_RUN_HOOK).get();
  }
  get canShowExplorer(): boolean {
    return !!this.select(this.fields.CAN_SHOW_EXPLORER).get();
  }
  get searchBehavior(): SearchBehavior {
    return this.select(this.fields.SEARCH_BEHAVIOR).get() as SearchBehavior;
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

export default new Config();
