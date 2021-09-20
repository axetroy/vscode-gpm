declare module "process-exists" {
  type fn = (pid: number) => Promise<boolean>;
  const processExists: fn;
  export = processExists;
}
