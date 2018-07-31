import * as shell from "shelljs";
import { Statusbar } from "./Statusbar";
import { ChildProcess } from "child_process";
import { Command } from "../type";
import { Service } from "typedi";

@Service()
export class Shell {
  private processes: any[] = [];
  public async run(cwd: string, command: string): Promise<any> {
    return new Promise((resolve, reject) => {
      shell.cd(cwd);

      const process = shell.exec(command, {
        async: true
      }) as ChildProcess;

      const statusbar = new Statusbar(Command.InterruptCommand);

      const processId = process.pid + "";

      this.processes.push({
        id: processId,
        cwd,
        cmd: command,
        process
      });

      const removeProcess = () => {
        const index = this.processes.findIndex(v => v.id === processId);
        if (index > -1) {
          this.processes.splice(index, 1);
        }
      };

      function handler(code: number, signal: string): void {
        removeProcess();
        code !== 0
          ? reject(new Error(signal || `Exit with code ${code}`))
          : resolve();
      }

      process
        .on("error", err => {
          removeProcess();
          reject(err);
        })
        .on("exit", handler)
        .on("close", handler);

      process.stdout.pipe(statusbar);
      process.stderr.pipe(statusbar);
    });
  }
}
