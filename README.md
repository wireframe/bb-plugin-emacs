# bb-plugin-emacs

A prototype bb plugin. A file tab in bb gets an **Open in Emacs** button that
sends the file to your running Emacs through `emacsclient`. bb's own preview
stays in the tab.

## How it works

1. `app.tsx` registers a **file opener** named "Emacs" for common code and
   text extensions. It adds the button above bb's preview. A click calls the
   server's `open_file` RPC, with the target line when bb has one. The tab
   never sends on its own: bb remounts file tabs when you select a thread,
   and an opener cannot tell a remount from a fresh open.
2. `server.ts` and `resolve-file.ts` turn bb's path into an absolute path. A
   workspace path is relative to the worktree, and a thread-storage path is
   relative to the thread's storage directory. The server also finds the host
   that holds the file.
3. `host.ts` runs on that host and calls `emacsclient -n [+LINE] PATH`.

Because the command runs on the file's host, Emacs must run on that same
machine. For a local bb install, that is your Mac.

## Requirements

Emacs must run as a server. Add `(server-start)` to your init file, or run
`emacs --daemon`.

## Install

```sh
cd ~/Projects/bb-plugin-emacs
npm install
bb plugin install .
```

After you install it, the plugin becomes the default opener for its
extensions. To keep bb's preview for an extension, change it in Settings →
Files → File openers. To open one file with Emacs, right-click a file link
and choose "Open with → Emacs".

## Settings

| Key               | Default       | Purpose                                                               |
| ----------------- | ------------- | --------------------------------------------------------------------- |
| `emacsclientPath` | `emacsclient` | Name or absolute path, for example `/opt/homebrew/bin/emacsclient`.   |

```sh
bb plugin config emacs set emacsclientPath /opt/homebrew/bin/emacsclient
bb plugin reload emacs
```

## Development

```sh
npm test            # vitest
npm run typecheck   # tsc
npm run build       # bb plugin build
bb plugin dev       # rebuild and reload on save
```

## Known limits

- bb needs an explicit extension list (`EXTENSIONS` in `app.tsx`). Files with
  other extensions use bb's preview.
- A project file that is not in a thread environment fails with a clear error.
- If `emacsclient` cannot reach a server, the tab shows its error.
