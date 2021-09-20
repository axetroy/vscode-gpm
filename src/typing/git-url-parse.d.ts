interface GitStructure {
  protocols: Protocol[];
  port: number | null;
  resource: string;
  user: string;
  pathname: string;
  hash: string;
  search: string;
  href: string;
  token: string;
  protocol: Protocol;
  toString: () => string;
  source: string;
  name: string;
  owner: string;

  // optional
  organization?: string;
  ref?: string;
  filepathtype?: string;
  filepath?: string;
  full_name?: string;
  git_suffix?: boolean;

  stringify: stringify;
}

type stringify = (obj: GitStructure, type?: Protocol) => string;

type Protocol = "https" | "ssh";

type GitUrlParse = (input: string) => GitStructure;

declare module "git-url-parse" {
  const gitUrlParse: GitUrlParse;

  export = gitUrlParse;
}
