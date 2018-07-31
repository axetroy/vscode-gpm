declare module "p-map" {
  type iterable = Iterable<any>;

  type Mapper = (argv: any) => Promise<any>;

  interface IOptions {
    concurrency?: number;
  }

  type promiseMap = (
    iterable: iterable,
    mapper: Mapper,
    options?: IOptions
  ) => Promise<any[]>;

  var pMap: promiseMap;
  export = pMap;
}
