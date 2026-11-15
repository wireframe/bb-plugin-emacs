import type { BbPluginApi } from "@get-bb/plugin-sdk";
import { hostContract, rpcContract } from "./contract.js";
import { resolveFile } from "./resolve-file.js";

/**
 * Sends files opened in bb to a running Emacs server. The app's file opener
 * calls `open_file`; the server finds the file's absolute path and host, and
 * that host runs emacsclient.
 */
export default async function plugin(bb: BbPluginApi) {
  const settings = bb.settings.define({
    emacsclientPath: {
      type: "string",
      label: "emacsclient command",
      description:
        "Name or absolute path of emacsclient on the machine that holds the files.",
      default: "emacsclient",
    },
  });
  const { emacsclientPath } = await settings.get();
  const host = bb.hosts.experimental_client({ contract: hostContract });

  bb.rpc.register(rpcContract, {
    open_file: async ({ path, line, source }) => {
      const file = await resolveFile(bb.sdk, path, source);
      return host.call(
        "open",
        { path: file.path, line, emacsclient: emacsclientPath },
        { hostId: file.hostId },
      );
    },
  });
}
