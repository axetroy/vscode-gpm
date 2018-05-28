"use strict";
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs-extra";
import { Gpm } from "./gpm";
import { createRepository, createOwner, createSource } from "./projectTree";
import config from "./config";
import {
  ConfirmAction,
  IFile,
  ISource,
  IOwner,
  IRepository,
  Command
} from "./type";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(
  context: vscode.ExtensionContext
): Promise<void> {
  const gpm = new Gpm(context);

  await gpm.init();

  // open file
  context.subscriptions.push(
    vscode.commands.registerCommand(
      Command.OpenFile,
      async (filepath: string): Promise<void> => {
        try {
          const statInfo = await fs.stat(filepath);
          if (statInfo.isFile()) {
            const openPath = vscode.Uri.file(filepath);
            vscode.workspace
              .openTextDocument(openPath)
              .then(doc => vscode.window.showTextDocument(doc));
          }
        } catch (err) {
          vscode.window.showErrorMessage(err.message);
        }
      }
    )
  );

  // open project in current window
  context.subscriptions.push(
    vscode.commands.registerCommand(
      Command.OpenInCurrentWindow,
      (file: IFile) => gpm.openInCurrentWindow(file)
    )
  );

  // list project to open in current window
  context.subscriptions.push(
    vscode.commands.registerCommand(
      Command.ListProject2OpenInCurrentWindow,
      async () => {
        const repository = await gpm.selectRepository(void 0, {
          placeHolder: "Select a Project to Open in Current Window."
        });

        if (repository) {
          return gpm.openInCurrentWindow(repository);
        }
      }
    )
  );

  // open project in new window
  context.subscriptions.push(
    vscode.commands.registerCommand(Command.OpenInNewWindow, (file: IFile) =>
      gpm.openInNewWindow(file)
    )
  );

  // list project to open in new window
  context.subscriptions.push(
    vscode.commands.registerCommand(
      Command.ListProject2OpenInNewWindow,
      async () => {
        const repository = await gpm.selectRepository(void 0, {
          placeHolder: "Select a Project to Open in New Window."
        });

        if (repository) {
          return gpm.openInNewWindow(repository);
        }
      }
    )
  );

  // refresh project
  context.subscriptions.push(
    vscode.commands.registerCommand(Command.Refresh, gpm.refresh.bind(gpm))
  );

  // clear cache
  context.subscriptions.push(
    vscode.commands.registerCommand(
      Command.ClearCache,
      gpm.cleanCache.bind(gpm)
    )
  );

  // prune project
  context.subscriptions.push(
    vscode.commands.registerCommand(Command.Prune, gpm.prune.bind(gpm))
  );

  // add project
  context.subscriptions.push(
    vscode.commands.registerCommand(Command.AddProject, gpm.add.bind(gpm))
  );

  // remove project
  context.subscriptions.push(
    vscode.commands.registerCommand(
      Command.RemoveProject,
      async (repository: IRepository) => {
        const action = await vscode.window.showInformationMessage(
          `[Irrevocable] Are you sure to remove project @${repository.owner}/${
            repository.repository
          }?`,
          ConfirmAction.Yes,
          ConfirmAction.No
        );

        switch (action as ConfirmAction) {
          case ConfirmAction.Yes:
            await gpm.remove(repository);
            break;
        }
      }
    )
  );

  // remove owner
  context.subscriptions.push(
    vscode.commands.registerCommand(
      Command.RemoveOwner,
      async (owner: IOwner) => {
        const action = await vscode.window.showInformationMessage(
          `[Irrevocable] Are you sure to remove all project of @${
            owner.owner
          }?`,
          ConfirmAction.Yes,
          ConfirmAction.No
        );

        switch (action as ConfirmAction) {
          case ConfirmAction.Yes:
            await gpm.removeOwner(owner);
            break;
        }
      }
    )
  );

  // remove source
  context.subscriptions.push(
    vscode.commands.registerCommand(
      Command.RemoveSource,
      async (source: ISource) => {
        const action = await vscode.window.showInformationMessage(
          `[Irrevocable] Are you sure to remove all project of ${
            source.source
          }?`,
          ConfirmAction.Yes,
          ConfirmAction.No
        );

        switch (action as ConfirmAction) {
          case ConfirmAction.Yes:
            await gpm.removeSource(source);
            break;
        }
      }
    )
  );

  // list project to remove
  context.subscriptions.push(
    vscode.commands.registerCommand(Command.ListProject2Remove, async () => {
      const repository = await gpm.selectRepository(void 0, {
        placeHolder: "Select a Project to Remove."
      });
      if (repository) {
        return gpm.remove(repository);
      }
    })
  );

  // star project
  context.subscriptions.push(
    vscode.commands.registerCommand(Command.Star, gpm.star.bind(gpm))
  );

  // star current project
  context.subscriptions.push(
    vscode.commands.registerCommand(
      Command.StarCurrentProject,
      async (repository: IRepository): Promise<void> => {
        const rootPath = vscode.workspace.rootPath;
        if (!rootPath) {
          return;
        }
        const gpmRoot = path.join(rootPath, "..", "..", "..");
        if (gpmRoot === config.rootPath) {
          const repositoryName = path.basename(rootPath);
          const ownerName = path.basename(path.join(rootPath, ".."));
          const sourceName = path.basename(path.join(rootPath, "..", ".."));

          const source = createSource(context, sourceName);
          const owner = createOwner(context, source, ownerName);
          const repositoryEntity = createRepository(
            context,
            owner,
            repositoryName
          );

          await gpm.star(repositoryEntity);
        } else {
          vscode.window.showWarningMessage(`Invalid project: '${rootPath}'`);
        }
      }
    )
  );

  // list project to star
  context.subscriptions.push(
    vscode.commands.registerCommand(Command.ListProject2Star, async () => {
      const repository = await gpm.selectRepository(void 0, {
        placeHolder: "Select a Project to Star."
      });

      if (repository) {
        return gpm.star(repository);
      }
    })
  );

  // unstar project
  context.subscriptions.push(
    vscode.commands.registerCommand(Command.Unstar, gpm.unstar.bind(gpm))
  );

  // list project to unstar
  context.subscriptions.push(
    vscode.commands.registerCommand(Command.ListProject2UnStar, async () => {
      const repository = await gpm.selectRepository(gpm.starList(), {
        placeHolder: "Select a Project to Unstar."
      });

      if (repository) {
        return gpm.unstar(repository);
      }
    })
  );

  // clear star
  context.subscriptions.push(
    vscode.commands.registerCommand(
      Command.ClearStars,
      gpm.clearStars.bind(gpm)
    )
  );

  // interrupt running command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      Command.InterruptCommand,
      gpm.interruptCommand.bind(gpm)
    )
  );

  // search project
  context.subscriptions.push(
    vscode.commands.registerCommand(Command.Search, gpm.search.bind(gpm))
  );

  // open project in terminal
  context.subscriptions.push(
    vscode.commands.registerCommand(
      Command.OpenInTerminal,
      gpm.openTerminal.bind(gpm)
    )
  );

  // list to open project in terminal
  context.subscriptions.push(
    vscode.commands.registerCommand(
      Command.ListProject2OpenInTerminal,
      async () => {
        const repository = await gpm.selectRepository(void 0, {
          placeHolder: "Select a Project to Open in Terminal."
        });

        if (!repository) {
          return;
        }

        return gpm.openTerminal(repository);
      }
    )
  );

  // create repository
  context.subscriptions.push(
    vscode.commands.registerCommand(
      Command.CreateRepository,
      async (owner: IOwner) => {
        const repositoryName = await vscode.window.showInputBox({
          placeHolder: "Enter a name of project."
        });

        if (!repositoryName) {
          return;
        }

        const repositoryPath = path.join(owner.path, repositoryName);

        const exist: boolean = await fs.pathExists(repositoryPath);

        if (exist) {
          return;
        }

        await fs.ensureDir(repositoryPath);

        return gpm.refresh();
      }
    )
  );

  // create owner
  context.subscriptions.push(
    vscode.commands.registerCommand(
      Command.CreateOwner,
      async (source: ISource) => {
        const ownerName = await vscode.window.showInputBox({
          placeHolder: "Enter a name of owner."
        });

        if (!ownerName) {
          return;
        }

        const ownerPath = path.join(source.path, ownerName);

        const exist: boolean = await fs.pathExists(ownerPath);

        if (exist) {
          return;
        }

        await fs.ensureDir(ownerPath);

        return gpm.refresh();
      }
    )
  );

  // watch config change and refresh
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration("gpm.rootPath")) {
        gpm.refresh();
      }
    })
  );

  // tree view
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("GPMExplorer", gpm.explorer)
  );

  // set .gpmrc file to json
  const fileConfig = vscode.workspace.getConfiguration("files");
  const associations: any = fileConfig.get("associations") || {};

  if (!associations[gpm.PresetFile]) {
    // update
    fileConfig.update(
      "associations",
      {
        ...associations,
        ...{
          [gpm.PresetFile]: "json"
        }
      },
      vscode.ConfigurationTarget.Global
    );
  }
}

// this method is called when your extension is deactivated
export async function deactivate(
  context: vscode.ExtensionContext
): Promise<void> {
  // when disable extension
  // clear cache
  const gpm = new Gpm(context);
  try {
    await fs.remove(gpm.CachePath);
  } catch (err) {
    console.error(err);
  }
}
