import { describe, expect, it } from "vitest";
import { emacsclientArgs } from "./emacsclient";

describe("emacsclientArgs", () => {
  it("shows the file in a frame without waiting for the buffer to close", () => {
    expect(emacsclientArgs({ path: "/repo/a.rb", line: null })).toEqual([
      "--reuse-frame",
      "--no-wait",
      "/repo/a.rb",
    ]);
  });

  it("jumps to the requested line", () => {
    expect(emacsclientArgs({ path: "/repo/a.rb", line: 42 })).toEqual([
      "--reuse-frame",
      "--no-wait",
      "+42",
      "/repo/a.rb",
    ]);
  });
});
