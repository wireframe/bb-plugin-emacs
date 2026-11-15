import { describe, expect, it } from "vitest";
import { emacsclientArgs } from "./emacsclient";

describe("emacsclientArgs", () => {
  it("opens the file without waiting for the buffer to close", () => {
    expect(emacsclientArgs({ path: "/repo/a.rb", line: null })).toEqual([
      "-n",
      "/repo/a.rb",
    ]);
  });

  it("jumps to the requested line", () => {
    expect(emacsclientArgs({ path: "/repo/a.rb", line: 42 })).toEqual([
      "-n",
      "+42",
      "/repo/a.rb",
    ]);
  });
});
