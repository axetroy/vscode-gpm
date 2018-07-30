export function flatten<T>(array: T[][]): T[] {
  return array.reduce((a: T[], b: T[]) => a.concat(b), []);
}
