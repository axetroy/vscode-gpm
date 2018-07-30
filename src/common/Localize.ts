import * as fs from "fs-extra";
import * as path from "path";
import { Service } from "typedi";

interface IConfig {
  locale?: string;
}

@Service()
export class Localize {
  private bundle = this.resolveLanguagePack();
  constructor(
    private config: IConfig = JSON.parse((process.env as any).VSCODE_NLS_CONFIG)
  ) {}
  public localize(key: string, comment: string = "", args: any[] = []) {
    // 返回翻译后的内容
    const languagePack = this.bundle;
    const message = languagePack[key];
    return this.format(message, args);
  }
  private format(message: string, args: any[] = []): string {
    let result: string;
    if (args.length === 0) {
      result = message;
    } else {
      result = message.replace(/\{(\d+)\}/g, (match, rest: any[]) => {
        const index = rest[0];
        return typeof args[index] !== "undefined" ? args[index] : match;
      });
    }
    return result;
  }
  // 获取语言包
  private resolveLanguagePack(): { [k: string]: string } {
    let resolvedLanguage: string = "";
    const file = path.join(__dirname, "..", "package");
    const options = this.config;

    if (!options.locale) {
      resolvedLanguage = ".nls.json";
    } else {
      let locale: string | null = options.locale;
      while (locale) {
        const candidate = ".nls." + locale + ".json";
        if (fs.existsSync(file + candidate)) {
          resolvedLanguage = candidate;
          break;
        } else {
          const index = locale.lastIndexOf("-");
          if (index > 0) {
            locale = locale.substring(0, index);
          } else {
            resolvedLanguage = ".nls.json";
            locale = null;
          }
        }
      }
    }

    const languageFilePath = path.join(file + resolvedLanguage);

    if (!fs.existsSync(languageFilePath)) {
      return {};
    }

    return require(languageFilePath);
  }
}
