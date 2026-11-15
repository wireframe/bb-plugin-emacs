export interface EmacsTarget {
  path: string;
  line: number | null;
}

/**
 * `--reuse-frame` creates a frame when a daemon has none, so the file is
 * always visible; `--no-wait` returns at once instead of blocking until the
 * buffer is closed.
 */
export function emacsclientArgs({ path, line }: EmacsTarget): string[] {
  const position = line === null ? [] : [`+${line}`];
  return ["--reuse-frame", "--no-wait", ...position, path];
}
