import * as fs from "fs-extra";
import * as _ from "lodash";
import * as promiseMap from "p-map";
import * as path from "path";
import { Inject, Service } from "typedi";
import * as vscode from "vscode";
import {
  FileType,
  IFile,
  IOwner,
  IRepository,
  ISource,
  ISegmentation
} from "../type";
import { flatten } from "../util/flatten";
import { isVisiblePath } from "../util/is-visiblePath";
import { Config } from "./Config";
import { Resource } from "./Resource";
import { Star } from "./Star";

@Service()
export class ProjectTreeProvider implements vscode.TreeDataProvider<IFile> {
  @Inject() private config!: Config;
  @Inject() private resource!: Resource;
  @Inject() public star!: Star;

  // tree view event
  private privateOnDidChangeTreeData: vscode.EventEmitter<
    IFile | undefined
  > = new vscode.EventEmitter<IFile | undefined>();
  public readonly onDidChangeTreeData: vscode.Event<IFile | undefined> = this
    .privateOnDidChangeTreeData.event;

  public traverse(): Promise<IRepository[]> {
    return (this.getChildren() as Promise<ISource[]>)
      .then(sources => {
        return Promise.all(
          sources.map(source => this.getChildren(source) as Promise<IOwner[]>)
        );
      })
      .then(list => {
        const owners: IOwner[] = flatten(list);
        return Promise.all(
          owners.map(owner => this.getChildren(owner) as Promise<IRepository[]>)
        );
      })
      .then(list => {
        const repositories: IRepository[] = (flatten(list) as IFile[])
          .filter(this.resource.isRepository)
          .sort((a, b) => (a.owner as any) - (b.owner as any));
        return Promise.resolve(repositories);
      });
  }

  public refresh(): void {
    this.privateOnDidChangeTreeData.fire();
  }

  public getTreeItem(element: IFile): vscode.TreeItem {
    return element;
  }

  public async getChildren(element?: IFile): Promise<IFile[]> {
    if (!element) {
      return this.getSources();
    }

    if (this.resource.isStar(element)) {
      return element.list();
    }

    if (this.resource.isSegmentation(element)) {
      return [];
    }

    if (this.resource.isSource(element)) {
      return this.getOwner(element);
    }

    if (this.resource.isOwner(element)) {
      return this.getRepository(element);
    }

    return this.getExplorer(element);
  }
  private async getSources() {
    const children: IFile[] = [];

    // concat with star
    if (this.star.list().length) {
      children.push(this.star);
    }

    const sources: ISource[] = [];

    for (const GPM_ROOT_PATH of this.config.rootPath) {
      const files: string[] = (await fs.readdir(GPM_ROOT_PATH)).filter(
        isVisiblePath
      );

      const mapper = async (file: string) => {
        const statInfo = await fs.stat(path.join(GPM_ROOT_PATH, file));

        if (statInfo.isDirectory()) {
          sources.push(this.resource.createSource(file, GPM_ROOT_PATH));
        }
      };

      await promiseMap(files, mapper, { concurrency: 10 });
    }

    const separation: ISegmentation = {
      label: "————————",
      type: FileType.Segmentation,
      contextValue: FileType.Segmentation,
      collapsibleState: 0,
      path: "",
      rootPath: "",
      source: "",
      segmentation: true
    };

    const array = _(sources)
      .sortBy(v => _.lowerCase(v.source))
      .groupBy(v => v.rootPath)
      .values()
      .value();

    const dist: ISource[][] = [];

    for (let i = 0; i < array.length; i++) {
      dist.push(array[i]);
      if (i % 2 === 0 && i !== array.length - 1) {
        dist.push([separation]);
      }
    }

    return _.concat(children, _.flatten(dist));
  }
  private async getOwner(element: ISource): Promise<IOwner[]> {
    const children: IOwner[] = [];

    const files: string[] = (await fs.readdir(element.path)).filter(
      isVisiblePath
    );

    const mapper = async (file: string) => {
      const statInfo = await fs.stat(path.join(element.path, file));

      if (statInfo.isDirectory()) {
        children.push(this.resource.createOwner(element, file));
      }
    };

    await promiseMap(files, mapper, { concurrency: 10 });

    return _.sortBy(children, v => _.lowerCase(v.owner));
  }
  private async getRepository(element: IOwner): Promise<IRepository[]> {
    const children: IRepository[] = [];

    const files: string[] = (await fs.readdir(element.path)).filter(
      isVisiblePath
    );

    const mapper = async (file: string) => {
      const statInfo = await fs.stat(path.join(element.path, file));

      if (statInfo.isDirectory()) {
        const repository = this.resource.createRepository(element, file);

        const staredRepository = this.star.find(repository);

        if (staredRepository) {
          repository.contextValue = FileType.RepositoryStared;
        }

        children.push(repository);
      }
    };

    await promiseMap(files, mapper, { concurrency: 10 });

    return _.sortBy(children, v => _.lowerCase(v.repository));
  }

  private async getExplorer(element: IFile): Promise<IFile[]> {
    const children: IFile[] = [];
    const fileList: string[] = [];
    const dirList: string[] = [];

    const files: string[] = await fs.readdir(element.path);

    const mapper = async (file: string) => {
      const stat = await fs.stat(path.join((element as IFile).path, file));
      if (stat.isDirectory()) {
        dirList.push(file);
      } else {
        fileList.push(file);
      }
    };

    await promiseMap(files, mapper, { concurrency: 10 });

    dirList
      .map(dir => this.resource.createFolder(path.join(element.path, dir)))
      .concat(
        fileList.map(filename =>
          this.resource.createFile(path.join((element as IFile).path, filename))
        )
      )
      .forEach(ele => children.push(ele));

    return children;
  }
}
