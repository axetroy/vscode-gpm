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
      (this.field("rootPath").get() as string)
        .replace(/^~/, process.env.HOME as string)
        .replace("$HOME", os.homedir())
        .replace(
          /\$\w+/,
          (word: string) => process.env[word.replace(/^\$/, "")] as string
        )
    );
  }
  get isAutoRunHook(): boolean {
    return !!this.field("isAutoRunHook").get();
  }
  get searchBehavior(): SearchBehavior {
    return this.field("searchBehavior").get() as SearchBehavior;
  }
  /**
   * get/update the field
   * @param {string} field
   * @returns {*}
   * @memberof Config
   */
  public field(field: string) {
    // return this.configuration.get(field);
    return {
      get: () => {
        return this.configuration.get(field);
      },
      update: (value: any) => {
        return this.configuration.update(field, value);
      }
    };
  }
}

export default new Config();
