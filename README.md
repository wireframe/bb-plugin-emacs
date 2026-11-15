# bb-plugin-emacs

A [bb](https://getbb.app) plugin that opens files in your running Emacs. A file
tab in bb gets an **Open in Emacs** button that sends the file to Emacs through
`emacsclient`. bb's own preview stays in the tab.

## Requirements

- bb 0.48 or later.
- Emacs on the same machine as the files. For a local bb install, that is
  your computer.
- `emacsclient` on your `PATH`, or its absolute path set in the plugin
  settings (see [Settings](#settings)).
- A running Emacs server. Add this to your init file (for Doom Emacs,
  `~/.config/doom/config.el`):

  ```elisp
  (require 'server)
  (unless (server-running-p)
    (server-start))
  ```

  A daemon (`emacs --daemon` or `brew services start emacs-plus`) also works.
  The plugin opens a new frame when the daemon has none.

To check the server, run `emacsclient -e '(emacs-pid)'`. It prints a process
ID when the server is running.

## Install

1. Install the plugin from GitHub:

   ```sh
   bb plugin install https://github.com/wireframe/bb-plugin-emacs
   ```

   bb clones the repository and builds the plugin. Confirm the prompt, or add
   `--yes` to skip it.

2. Confirm that the plugin runs:

   ```sh
   bb plugin list
   ```

   The list shows `emacs@<version>  running`.

3. Reload the bb window (Cmd+R) so it loads the plugin's file tab.

4. Open a file in bb, for example by clicking a file link in a thread. The
   file tab shows an **Open in Emacs** button. Click it to open the file in
   Emacs at the line bb targets.

### Choose which files use the plugin

The plugin becomes the default opener for the extensions it supports. To keep
bb's preview for an extension, change it in **Settings → File openers**. To use
the plugin for one file, right-click a file link and choose
**Open with → Emacs**.

### Update or remove

```sh
bb plugin update emacs   # get the latest version from GitHub
bb plugin remove emacs   # uninstall
```

## Settings

| Key               | Default       | Purpose                                                             |
| ----------------- | ------------- | ------------------------------------------------------------------- |
| `emacsclientPath` | `emacsclient` | Name or absolute path, for example `/opt/homebrew/bin/emacsclient`. |

```sh
bb plugin config emacs set emacsclientPath /opt/homebrew/bin/emacsclient
bb plugin reload emacs
```

## Troubleshooting

- **The tab shows an error from emacsclient.** The Emacs server is not
  running, or bb cannot find `emacsclient`. Start the server (see
  [Requirements](#requirements)) or set `emacsclientPath`.
- **Cmd+O in bb does nothing.** Cmd+O is bb's built-in "Open workspace in"
  command, not this plugin. For Emacs it runs `open -a Emacs`. That shows
  nothing when Emacs runs as a daemon with no window. Run Emacs as a normal
  app with `(server-start)`, or keep one Emacs window open.
- **Emacs is not in bb's "Open in" list.** bb finds `Emacs.app` in
  `/Applications`, `~/Applications`, or through Spotlight. Homebrew's
  emacs-plus installs it elsewhere. Link it:
  `ln -s /opt/homebrew/opt/emacs-plus@30/Emacs.app /Applications/Emacs.app`.

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
3. `host.ts` runs on that host and calls
   `emacsclient --reuse-frame --no-wait [+LINE] PATH`.

## Development

```sh
git clone https://github.com/wireframe/bb-plugin-emacs
cd bb-plugin-emacs
npm install
bb plugin install .   # install from this directory
bb plugin dev         # rebuild and reload on save
```

```sh
npm test            # vitest
npm run typecheck   # tsc
npm run build       # bb plugin build
```

## Known limits

- bb needs an explicit extension list (`EXTENSIONS` in `app.tsx`). Files with
  other extensions use bb's preview.
- A project file that is not in a thread environment fails with a clear error.
