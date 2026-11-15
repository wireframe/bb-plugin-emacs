import { defineRpcContract } from "@get-bb/plugin-sdk";
import { z } from "zod";

const lineSchema = z.number().int().positive().nullable();

/** Server → host: run emacsclient on the machine that holds the file. */
export const hostContract = defineRpcContract({
  open: {
    input: z
      .object({
        path: z.string().startsWith("/"),
        line: lineSchema,
        emacsclient: z.string().min(1),
      })
      .strict(),
    output: z.object({ opened: z.literal(true) }).strict(),
  },
});

/** Mirrors the SDK's PluginFileOpenerSource. */
export const fileSourceSchema = z.object({
  kind: z.enum(["workspace", "host", "thread-storage"]),
  threadId: z.string().nullable(),
  environmentId: z.string().nullable(),
  projectId: z.string().nullable(),
  experimental_hostId: z.string().optional(),
});
export type FileSource = z.infer<typeof fileSourceSchema>;

/** App → server: open the file a bb file tab points at. */
export const rpcContract = defineRpcContract({
  open_file: {
    input: z.object({
      path: z.string().min(1),
      line: lineSchema,
      source: fileSourceSchema,
    }),
    output: z.object({ opened: z.literal(true) }),
  },
});
