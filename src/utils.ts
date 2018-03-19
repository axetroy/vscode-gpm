const spawn = require("cross-spawn");
/**
 * 以spawn的方式运行shell命令
 * @param {string} command
 * @param {string[]} argv
 * @param {{}} options
 * @returns {Promise<any>}
 */
export async function spawnShell(
  command: string,
  argv: string[] = [],
  options = {}
): Promise<any> {
  const stream = spawn(command, argv, {
    ...{ env: process.env, cwd: process.cwd(), stdio: "inherit" },
    ...options
  });
  return await new Promise((resolve, reject) => {
    stream.on("data", function(data: Buffer) {
      console.log(data + "");
    });
    stream.on("error", function(data: Buffer) {
      console.error(data);
    });
    stream.on("close", (code: number, signal: string) => {
      code === 0
        ? resolve()
        : reject(new Error(`Error Code: ${code}, Exist Signal: ${signal}`));
    });
  });
}

/**
 * 运行简单的shell命令
 * @param {string} cmd
 * @param {{}} options
 * @returns {Promise<void>}
 */
export async function runShell(cmd: string, options = {}): Promise<void> {
  const cmds: string[] = cmd.split(/\&\&/);
  while (cmds.length) {
    let cmd: string = <string>cmds.shift();
    const cmdArray: string[] = cmd.split(/\&/).map(v => v.trim());
    while (cmdArray.length) {
      let __cmd = <string>cmdArray.shift();
      const subCmd: string[] = __cmd
        .split(/\s+/)
        .map(v => v.trim())
        .filter(v => !!v);
      let command = (<string>subCmd.shift()).trim();
      let argv: string[] = subCmd || [];
      let full_command = command + " " + argv.join(" ");
      await spawnShell(command, <never>argv, options);
    }
  }
}

/**
 * 判断是否是link
 * @param path
 * @returns {Promise<boolean>}
 */
export async function isLink(path: string): Promise<boolean> {
  try {
    await fs.readlink(path);
    return true;
  } catch (err) {
    return false;
  }
}
