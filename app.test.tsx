// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent } from "@testing-library/react";
import { loadPluginApp, renderSlot } from "@get-bb/plugin-sdk/testing/app";

const app = await loadPluginApp(() => import("./app"));

afterEach(cleanup);

function renderOpener() {
  return renderSlot(
    app.fileOpeners[0]!,
    {
      path: "src/app.ts",
      source: {
        kind: "workspace",
        threadId: "th_1",
        environmentId: "env-1",
        projectId: "p1",
      },
      experimental_lineRange: { startLineNumber: 7, endLineNumber: 7 },
      Original: () => <div>bb preview</div>,
    },
    { rpc: { open_file: () => ({ opened: true }) } },
  );
}

describe("Emacs file opener", () => {
  it("does not send the file to Emacs when its tab mounts or is restored", async () => {
    const slot = renderOpener();

    await slot.findByText("bb preview");

    expect(slot.inspection.rpcCalls).toEqual([]);
  });

  it("sends the file at its target line when the button is clicked", async () => {
    const slot = renderOpener();

    fireEvent.click(await slot.findByRole("button", { name: "Open in Emacs" }));

    await slot.findByText("Opened in Emacs.");
    expect(slot.inspection.rpcCalls).toMatchObject([
      {
        method: "open_file",
        input: { path: "src/app.ts", line: 7, source: { environmentId: "env-1" } },
      },
    ]);
  });
});
