import * as fs from "fs-extra";
import * as path from "path";
import { Inject, Service } from "typedi";
import { Shell } from "../common/Shell";
import { Hook, IPreset } from "../type";
import { Config } from "./Config";

@Service()
export class Hooker {
  public readonly PresetFile: string = ".gpmrc";
  @Inject() private config!: Config;
  @Inject() private shell!: Shell;
  /**
   * Run hook in the path if it exist
   * @param cwd
   * @param hookName
   */
  public async run(cwd: string, hookName: Hook) {
    // if user disable auto run hook
    if (!this.config.isAutoRunHook) {
      return;
    }

    const gpmrcPath = path.join(cwd, this.PresetFile);
    // run the hooks
    if (await fs.pathExists(gpmrcPath)) {
      // if .gpmrc file exist
      const preset: IPreset = await fs.readJson(gpmrcPath);
      if (preset.hooks) {
        const cmd = preset.hooks[hookName] || preset.hooks.postadd;
        if (cmd) {
          await this.shell.run(cwd, cmd);
        }
      }
    }
  }
}
