import * as vscode from "vscode";
import i18n from "../common/Localize";
import { FileType, IRepository, IStar } from "../type";
import { Resource } from "./Resource";

const storageKey = "@stars";
const staredSuffix = "@stared";

export class Star implements IStar {
  private starList: IRepository[] = this.context.globalState.get(storageKey) || [];
  public label: string = i18n.localize("ext.view.star", "你的收藏");
  public contextValue = FileType.Star;
  public collapsibleState = 2;
  public iconPath = this.resource.getIcon("star.svg");
  public tooltip: string = i18n.localize("ext.view.stared", "你的收藏的项目");
  // customer property
  public type = FileType.Star;
  public path = ""; // empty path

  constructor(private context: vscode.ExtensionContext, private resource: Resource) {}

  private findIndex(repository: IRepository): number {
    return this.starList.findIndex((r) => repository.path === r.path);
  }
  private async update(value: IRepository[] = this.starList) {
    return this.context.globalState.update(storageKey, value);
  }
  public list(): IRepository[] {
    return this.starList;
  }
  public find(repository: IRepository): IRepository | void {
    const index = this.findIndex(repository);
    if (index >= 0) {
      return this.starList[index];
    }
  }
  public async star(repository: IRepository): Promise<void> {
    if (this.findIndex(repository) < 0) {
      const newRepository = { ...repository };
      newRepository.id = repository.id + staredSuffix;
      newRepository.contextValue = FileType.RepositoryStared;
      this.starList.push(newRepository);
      await this.update();
    }
  }
  public async unstar(repository: IRepository): Promise<void> {
    const index = this.findIndex(repository);
    if (index >= 0) {
      repository.contextValue = FileType.Repository;
      this.starList.splice(index, 1);
      await this.update();
    }
  }
  public async clear(): Promise<void> {
    for (const repository of this.starList) {
      repository.contextValue = FileType.Repository;
    }
    this.starList.splice(0, this.starList.length);
    await this.update();
  }
}
