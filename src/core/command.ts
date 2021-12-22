import * as vscode from "vscode";

const registryCommands: vscode.Disposable[] = [];
let context: vscode.ExtensionContext | null = null;

export function initContext(ctx: vscode.ExtensionContext): void {
  context = ctx;
  while (registryCommands.length) {
    ctx.subscriptions.push(registryCommands.shift() as vscode.Disposable);
  }
}

/**
 * decorator for registry command
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function command(command: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (_target: unknown, _key: string, descriptor: TypedPropertyDescriptor<(...args: any[]) => any>): void {
    if (typeof descriptor.value !== "function") {
      throw new Error("not supported");
    }

    const fn = descriptor.value;
    descriptor.value = async function (...args) {
      try {
        return fn.apply(this, args);
      } catch (err) {
        console.error(err);
        throw err;
      }
    };

    if (context) {
      context.subscriptions.push(vscode.commands.registerCommand(command, descriptor.value));
    } else {
      registryCommands.push(vscode.commands.registerCommand(command, descriptor.value));
    }
  };
}
