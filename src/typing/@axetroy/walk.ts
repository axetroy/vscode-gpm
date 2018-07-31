declare module "@axetroy/walk" {
  import { Stats } from "fs";

  type fileCallback = (filepath: string, stat: Stats) => void;
  type errorCallback = (error: Error) => void;
  type doneCallback = () => void;

  interface IWalker {
    new (rootPath: string): Walker;
  }

  class Walker {
    public on(event: "file" | "directory", cb: fileCallback): Walker;
    public on(event: "error", cb: errorCallback): Walker;
    public on(event: "done", cb: doneCallback): Walker;
    public walk(): Promise<void>;
  }

  const walker: IWalker;

  export = walker;
}
