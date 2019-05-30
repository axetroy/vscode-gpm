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

      const ps = execa(executable, args, { cwd });

      const statusbar = new Statusbar(Command.InterruptCommand);

      const processId = ps.pid + "";

      this.processes.push({
        id: processId,
        cwd,
        cmd: command,
        process: ps
      });

      const removeProcess = () => {
        const index = this.processes.findIndex(v => v.id === processId);
        if (index > -1) {
          this.processes.splice(index, 1);
        }
      };

      let message = "";

      function handler(code: number, signal: string): void {
        removeProcess();
        code !== 0
          ? reject(
              message
                ? new Error(message)
                : new Error(signal || `exit with code ${code}`)
            )
          : resolve();
      }

      ps.on("error", err => {
        removeProcess();
        reject(err);
      })
        .on("exit", handler)
        .on("close", handler);

      if (ps.stdout) {
        ps.stdout.pipe(statusbar);
      }

      if (ps.stderr) {
        // Git 的输出全都是输出到 stderr
        ps.stderr.on("data", chunk => {
          message += chunk;
        });

        ps.stderr.pipe(statusbar);
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
