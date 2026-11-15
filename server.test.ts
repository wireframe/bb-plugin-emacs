import { describe, expect, it } from "vitest";
import { createFakePluginHost } from "@get-bb/plugin-sdk/testing";
import plugin from "./server";

type HostCall = { method: string; input: unknown; hostId: string };

async function loadPlugin(settings: Record<string, string> = {}) {
  const hostCalls: HostCall[] = [];
  const { bb, harness } = createFakePluginHost({
    pluginId: "emacs",
    settings,
    sdk: {
      environments: {
        get: async () => ({ path: "/work/repo", hostId: "host-env" }),
      },
      threads: {
        get: async () => ({ environmentId: "env-1" }),
        storageLocation: async () => ({
          hostId: "host-storage",
          storageRootPath: "/data/threads/th_1",
        }),
      },
      system: {
        config: async () => ({ primaryHostId: "host-primary" }),
      },
    } as never,
    experimental_callHostRpc: async ({ method, input, hostId }) => {
      hostCalls.push({ method, input, hostId });
      return { opened: true };
    },
  });
  await plugin(bb);
  return { harness, hostCalls };
}

function source(overrides: Record<string, unknown>) {
  return {
    kind: "workspace",
    threadId: null,
    environmentId: "env-1",
    projectId: null,
    ...overrides,
  };
}

describe("open_file", () => {
  it("opens a workspace file at its absolute path on the environment's host", async () => {
    const { harness, hostCalls } = await loadPlugin();

    await harness.behavior.callRpc("open_file", {
      path: "src/app.ts",
      line: 12,
      source: source({}),
    });

    expect(hostCalls).toEqual([
      {
        method: "open",
        hostId: "host-env",
        input: { path: "/work/repo/src/app.ts", line: 12, emacsclient: "emacsclient" },
      },
    ]);
  });

  it("finds the environment through the thread when the source has none", async () => {
    const { harness, hostCalls } = await loadPlugin();

    await harness.behavior.callRpc("open_file", {
      path: "README.md",
      line: null,
      source: source({ environmentId: null, threadId: "th_1" }),
    });

    expect(hostCalls[0]?.input).toMatchObject({ path: "/work/repo/README.md" });
  });

  it("prefers the host the source names explicitly", async () => {
    const { harness, hostCalls } = await loadPlugin();

    await harness.behavior.callRpc("open_file", {
      path: "a.rb",
      line: null,
      source: source({ experimental_hostId: "host-explicit" }),
    });

    expect(hostCalls[0]?.hostId).toBe("host-explicit");
  });

  it("opens a thread-storage file under the thread's storage root", async () => {
    const { harness, hostCalls } = await loadPlugin();

    await harness.behavior.callRpc("open_file", {
      path: "notes/plan.md",
      line: null,
      source: source({ kind: "thread-storage", environmentId: null, threadId: "th_1" }),
    });

    expect(hostCalls[0]).toMatchObject({
      hostId: "host-storage",
      input: { path: "/data/threads/th_1/notes/plan.md" },
    });
  });

  it("opens an absolute host path on the primary host when nothing else names one", async () => {
    const { harness, hostCalls } = await loadPlugin();

    await harness.behavior.callRpc("open_file", {
      path: "/etc/hosts",
      line: null,
      source: source({ kind: "host", environmentId: null }),
    });

    expect(hostCalls[0]).toMatchObject({
      hostId: "host-primary",
      input: { path: "/etc/hosts" },
    });
  });

  it("refuses a relative path that escapes its root", async () => {
    const { harness, hostCalls } = await loadPlugin();

    await expect(
      harness.behavior.callRpc("open_file", {
        path: "../../etc/passwd",
        line: null,
        source: source({}),
      }),
    ).rejects.toThrow(/outside/);
    expect(hostCalls).toEqual([]);
  });

  it("uses the configured emacsclient command", async () => {
    const { harness, hostCalls } = await loadPlugin({
      emacsclientPath: "/opt/homebrew/bin/emacsclient",
    });

    await harness.behavior.callRpc("open_file", {
      path: "a.rb",
      line: null,
      source: source({}),
    });

    expect(hostCalls[0]?.input).toMatchObject({
      emacsclient: "/opt/homebrew/bin/emacsclient",
    });
  });
});
