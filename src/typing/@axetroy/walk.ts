declare module "@axetroy/walk" {
  type Event = "file" | "directory" | "error";

  type callback = (filepath: string) => void;

  interface IWalker {
    new (rootPath: string): Walker;
  }

  class Walker {
    public on(event: Event, cb: callback): Walker;
    public walk(): Promise<void>;
  }

  const walker: IWalker;

  export = walker;
}
