import * as fs from "fs-extra";
import * as os from "os";
import * as path from "path";
import { EventEmitter } from "events";
import * as promiseMap from "p-map";

const dir = path.join(os.homedir(), "gpm");

const cores = os.cpus().length;

function _() {
  //
}

class Pruner extends EventEmitter {
  constructor(private rootDir: string = dir) {
    super();
  }
  public async find(directory = this.rootDir) {
    return fs
      .readdir(directory)
      .then((files: string[]) => {
        const mapper = async (file: string) => {
          const absPath = path.join(directory, file);
          this.emit("file", absPath);
          if (file === "node_modules") {
            this.emit("found", absPath);
          } else {
            await fs
              .stat(absPath)
              .then(stat => {
                if (stat.isDirectory()) {
                  return this.find(absPath);
                }
              })
              .catch(_);
          }
        };

        return promiseMap(files, mapper, { concurrency: 20 * cores });
      })
      .catch(_);
  }
}

export default Pruner;
