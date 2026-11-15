import { useState } from "react";
import {
  definePluginApp,
  useRpc,
  type PluginFileOpenerProps,
} from "@get-bb/plugin-sdk/app";
import type { rpcContract } from "./contract";
import { Button } from "@/components/ui/button";

/** Extensions this opener claims; bb needs an explicit list. */
const EXTENSIONS = [
  "rb", "erb", "rake", "ru", "gemspec",
  "ts", "tsx", "js", "jsx", "mjs", "cjs", "json",
  "py", "go", "rs", "java", "kt", "swift", "c", "h", "cpp", "hpp",
  "el", "org", "md", "txt",
  "yml", "yaml", "toml", "ini", "env",
  "sh", "zsh", "bash", "fish",
  "sql", "graphql", "html", "css", "scss",
  "lock",
];

type SendState =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent" }
  | { kind: "failed"; message: string };

/**
 * Sends only on an explicit click. bb remounts file tabs when it restores a
 * thread's panel, and an opener cannot tell that from a fresh open, so
 * sending on mount opens Emacs every time a thread is selected.
 */
function useSendToEmacs(props: PluginFileOpenerProps) {
  const rpc = useRpc<typeof rpcContract>();
  const [state, setState] = useState<SendState>({ kind: "idle" });
  const { path, source, experimental_lineRange: lineRange } = props;
  const send = () => {
    setState({ kind: "sending" });
    rpc
      .call("open_file", {
        path,
        source,
        line: lineRange?.startLineNumber ?? null,
      })
      .then(
        () => setState({ kind: "sent" }),
        (cause: unknown) =>
          setState({ kind: "failed", message: String(cause) }),
      );
  };
  return { state, send };
}

function statusText(state: SendState): string {
  if (state.kind === "idle") return "";
  if (state.kind === "sending") return "Sending to Emacs…";
  if (state.kind === "sent") return "Opened in Emacs.";
  return `Emacs did not open the file: ${state.message}`;
}

function EmacsOpener(props: PluginFileOpenerProps) {
  const { state, send } = useSendToEmacs(props);
  const { Original } = props;
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b border-border px-3 py-1.5 text-xs">
        <span
          role={state.kind === "failed" ? "alert" : "status"}
          className={
            state.kind === "failed" ? "text-destructive" : "text-muted-foreground"
          }
        >
          {statusText(state)}
        </span>
        <Button variant="ghost" size="sm" className="ml-auto" onClick={send}>
          Open in Emacs
        </Button>
      </div>
      <div className="min-h-0 flex-1">
        <Original />
      </div>
    </div>
  );
}

export default definePluginApp((app) => {
  app.slots.fileOpener({
    id: "emacs",
    title: "Emacs",
    extensions: EXTENSIONS,
    component: EmacsOpener,
  });
});
