import * as fs from "fs-extra";
import * as os from "os";
import * as path from "path";
import { EventEmitter } from "events";
import promiseMap from "p-map";

const coresLen = os.cpus().length;

function _() {
  //
}

const pruneMap = new Set(["node_modules", "bower_components"]);

class Pruner extends EventEmitter {
  constructor(private rootDir: string) {
    super();
  }
  public async find(directory = this.rootDir): Promise<void | void[]> {
    return fs
      .readdir(directory)
      .then((files: string[]) => {
        const mapper = async (file: string) => {
          const absPath = path.join(directory, file);
          if (pruneMap.has(file)) {
            this.emit("found", absPath);
          } else {
            await fs
              .lstat(absPath)
              .then((stat) => {
                if (stat.isDirectory()) {
                  return this.find(absPath);
                }
              })
              .catch(_);
          }
        };

        return promiseMap(files, mapper, { concurrency: coresLen });
      })
      .catch(_);
  }
}

export default Pruner;
