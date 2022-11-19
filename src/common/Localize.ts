import { init as initI18n, localize as $t } from "vscode-nls-i18n";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function localize(key: string, _comment = "", args: unknown[] = []): string {
  return $t(key, ...(args as string[]));
}

function init(extensionPath: string): void {
  initI18n(extensionPath);
}

const i18n = {
  init,
  localize,
};

export default i18n;
