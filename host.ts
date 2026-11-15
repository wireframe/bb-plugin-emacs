import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { experimental_defineHostEntry } from "@get-bb/plugin-sdk/host";
import { hostContract } from "./contract.js";
import { emacsclientArgs } from "./emacsclient.js";

const run = promisify(execFile);

export default experimental_defineHostEntry({
  contract: hostContract,
  handlers: {
    open: async ({ path, line, emacsclient }, context) => {
      await run(emacsclient, emacsclientArgs({ path, line }), {
        signal: context.signal,
        timeout: 10_000,
      });
      return { opened: true as const };
    },
  },
});
