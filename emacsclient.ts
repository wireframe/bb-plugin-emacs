export interface EmacsTarget {
  path: string;
  line: number | null;
}

/** `-n` returns at once instead of waiting until the buffer is closed. */
export function emacsclientArgs({ path, line }: EmacsTarget): string[] {
  return line === null ? ["-n", path] : ["-n", `+${line}`, path];
}
