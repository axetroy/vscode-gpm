export function isVisiblePath(name: string): boolean {
  return !/^\./.test(name);
}
