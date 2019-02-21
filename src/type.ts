import * as vscode from "vscode";

export enum FileType {
  Segmentation = "segmentation",
  File = "file",
  Folder = "folder",
  Star = "star",
  Source = "source",
  Owner = "owner",
  Repository = "repository",
  RepositoryStared = "repository.stared"
}

export interface IFile extends vscode.TreeItem {
  type: FileType;
  path: string;
}

export interface ISource extends IFile {
  rootPath: string;
  source: string;
}

export interface ISegmentation extends ISource {
  segmentation: true;
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
  rootPath: string;
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
  Create = "action.create",
  Cancel = "action.cancel"
}

export enum ProjectExistAction {
  Overwrite = "action.overwrite",
  Rename = "action.rename",
  Cancel = "action.cancel"
}

export enum ProjectPostAddAction {
  Open = "action.open",
  Cancel = "action.cancel"
}

export enum PruneAction {
  Continue = "action.continue",
  Cancel = "action.cancel"
}

export enum SearchAction {
  Open = "action.open",
  Remove = "action.remove",
  Cancel = "action.cancel"
}

export enum OpenAction {
  CurrentWindow = "action.currentWindow",
  NewWindow = "action.newWindow",
  Cancel = "action.cancel"
}

export enum ConfirmAction {
  Yes = "action.yes",
  No = "action.no"
}

export enum SearchBehavior {
  OpenInNewWindow = "openInNewWindow",
  OpenInCurrentWindow = "openInCurrentWindow",
  Remove = "action.remove",
  Star = "star",
  Unstar = "unstar",
  AddToWorkspace = "addToWorkSpace",
  Ask = "ask"
}

export enum Command {
  OpenFile = "gpm.open",
  OpenInCurrentWindow = "gpm.openInCurrentWindow",
  OpenInNewWindow = "gpm.openInNewWindow",
  Refresh = "gpm.refresh",
  ClearCache = "gpm.clearCache",
  Prune = "gpm.prune",
  CloneProject = "gpm.clone",
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
  CopyPath = "gpm.copyPath",
  OpenInWorkspace = "gpm.openInWorkspace",
  // create
  CreateRepository = "gpm.createRepository",
  CreateOwner = "gpm.createOwner",
  // list project
  ListProject2OpenInCurrentWindow = "gpm.list2open",
  ListProject2OpenInNewWindow = "gpm.list2openNew",
  ListProject2Remove = "gpm.list2remove",
  ListProject2Star = "gpm.list2star",
  ListProject2UnStar = "gpm.list2unstar",
  ListProject2OpenInTerminal = "gpm.list2openInTerminal",
  ListProject2OpenInWorkspace = "gpm.list2OpenInWorkspace"
}
