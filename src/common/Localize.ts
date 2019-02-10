import * as fs from "fs-extra";
import * as path from "path";
import * as vscode from "vscode";
import { Service, Container } from "typedi";

interface IConfig {
  locale?: string;
}

interface ILocalePack {
  [k: string]: string;
}

@Service()
export class Localize {
  private context: vscode.ExtensionContext = Container.get("context");
  private config: IConfig = JSON.parse((process.env as any).VSCODE_NLS_CONFIG);
  private bundle: ILocalePack = this.resolveLanguagePack();
  public localize(key: string, comment: string = "", args: any[] = []): string {
    // 返回翻译后的内容
    const languagePack = this.bundle;
    const message = languagePack[key] || "";
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
  private resolveLanguagePack(): ILocalePack {
    let resolvedLanguage: string = "";
    const file = this.context.asAbsolutePath("./package");
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

    try {
      return require(languageFilePath);
    } catch (err) {
      return {};
    }
  }
}
