declare module "process-exists" {
  type fn = (pid: number) => Promise<boolean>;
  var processExists: fn;
  export = processExists;
}
