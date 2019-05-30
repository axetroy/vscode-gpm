import { ChildProcess } from "child_process";
import execa from "execa";
import { Service } from "typedi";
import { Command } from "../type";
import { Statusbar } from "./Statusbar";

interface IProcess {
  id: string;
  cwd: string;
  cmd: string;
  process: ChildProcess;
}

@Service()
export class Shell {
  // current running processes
  public processes: IProcess[] = [];
  /**
   * Run shell command
   * @param cwd
   * @param command
   */
  public async run(cwd: string, command: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const args = command.split(" ");

      const executable = args.shift() as string;

      const process = execa(executable, args, { cwd });

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

      if (process.stdout) {
        process.stdout.pipe(statusbar);
      }

      if (process.stderr) {
        process.stderr.pipe(statusbar);
      }
    });
  }
  /**
   * Interrupt the process
   * @param pid
   */
  public async interrupt(pid: string) {
    const index = this.processes.findIndex(v => v.id === pid);

    if (index >= 0) {
      const process = this.processes[index];
      process.process.kill("SIGKILL");
      this.processes.splice(index, 1);
    }
  }
}
