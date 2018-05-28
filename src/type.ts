import * as vscode from "vscode";

export enum FileType {
  File = "file",
  Folder = "folder",
  Star = "star",
  Source = "source",
  Owner = "owner",
  Repository = "repository"
}

export interface IFile extends vscode.TreeItem {
  type: FileType;
  path: string;
}

export interface IStar extends IFile {
  type: FileType;
  find(repository: IRepository): IRepository | void;
  star(repository: IRepository): Promise<any>;
  unstar(repository: IRepository): Promise<any>;
  list(): IRepository[];
  clear(): void;
}

export interface ISource extends IFile {
  source: string;
}

export interface IOwner extends ISource {
  owner: string;
}

export interface IRepository extends IOwner {
  repository: string;
}

export interface IPreset {
  hooks?: {
    add?: string;
    postadd?: string;
    preremove?: string;
    postremove?: string;
  };
}

export enum InitAction {
  Create = "Create",
  Cancel = "Cancel"
}

export enum ProjectExistAction {
  Overwrite = "Overwrite",
  Rename = "Rename",
  Cancel = "Cancel"
}

export enum ProjectPostAddAction {
  Open = "Open",
  Cancel = "Cancel"
}

export enum PruneAction {
  Continue = "Continue",
  Cancel = "Cancel"
}

export enum Hook {
  Add = "add",
  Postadd = "postadd",
  Preremove = "preremove",
  Postremove = "postremove"
}

export enum SearchAction {
  Open = "Open",
  Remove = "Remove",
  Cancel = "Cancel"
}

export enum OpenAction {
  CurrentWindow = "Current Window",
  NewWindow = "New Window",
  Cancel = "Cancel"
}

export enum ConfirmAction {
  Yes = "Yes",
  No = "No"
}

export enum SearchBehavior {
  OpenInNewWindow = "openInNewWindow",
  OpenInCurrentWindow = "openInCurrentWindow",
  Remove = "remove",
  Star = "star",
  Unstar = "unstar",
  Ask = "ask"
}

export enum Command {
  OpenFile = "gpm.open",
  OpenInCurrentWindow = "gpm.openInCurrentWindow",
  OpenInNewWindow = "gpm.openInNewWindow",
  Refresh = "gpm.refresh",
  ClearCache = "gpm.clearCache",
  Prune = "gpm.prune",
  AddProject = "gpm.add",
  RemoveProject = "gpm.remove",
  RemoveOwner = "gpm.removeOwner",
  RemoveSource = "gpm.removeSource",
  Star = "gpm.star",
  Unstar = "gpm.unstar",
  ClearStars = "gpm.clearStars",
  StarCurrentProject = "gpm.starCurrent",
  InterruptCommand = "gpm.interruptCommand",
  Search = "gpm.search",
  OpenInTerminal = "gpm.openInTerminal",
  // create
  CreateRepository = "gpm.createRepository",
  CreateOwner = "gpm.createOwner",
  // list project
  ListProject2OpenInCurrentWindow = "gpm.list2open",
  ListProject2OpenInNewWindow = "gpm.list2openNew",
  ListProject2Remove = "gpm.list2remove",
  ListProject2Star = "gpm.list2star",
  ListProject2UnStar = "gpm.list2unstar",
  ListProject2OpenInTerminal = "gpm.list2openInTerminal"
}
