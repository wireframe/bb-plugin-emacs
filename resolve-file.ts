import { isAbsolute, join, relative } from "node:path/posix";
import type { BbPluginApi } from "@get-bb/plugin-sdk";
import type { FileSource } from "./contract.js";

type Sdk = BbPluginApi["sdk"];

/** An absolute path on a specific bb host. */
export interface ResolvedFile {
  hostId: string;
  path: string;
}

interface Root {
  hostId: string;
  rootPath: string;
}

/**
 * Turns the path a bb file tab shows (worktree-relative, storage-relative,
 * or host-absolute) into an absolute path on the host that holds it.
 */
export async function resolveFile(
  sdk: Sdk,
  path: string,
  source: FileSource,
): Promise<ResolvedFile> {
  if (source.kind === "host") return resolveHostPath(sdk, path, source);
  const root =
    source.kind === "workspace"
      ? await workspaceRoot(sdk, source)
      : await threadStorageRoot(sdk, source);
  return {
    hostId: source.experimental_hostId ?? root.hostId,
    path: joinInside(root.rootPath, path),
  };
}

async function resolveHostPath(
  sdk: Sdk,
  path: string,
  source: FileSource,
): Promise<ResolvedFile> {
  if (!isAbsolute(path)) throw new Error(`Host path is not absolute: ${path}`);
  return { hostId: await hostForAbsolutePath(sdk, source), path };
}

async function hostForAbsolutePath(sdk: Sdk, source: FileSource): Promise<string> {
  if (source.experimental_hostId !== undefined) return source.experimental_hostId;
  const environmentId = await environmentIdFor(sdk, source);
  if (environmentId !== null) {
    return (await sdk.environments.get({ environmentId })).hostId;
  }
  return primaryHostId(sdk);
}

async function primaryHostId(sdk: Sdk): Promise<string> {
  const { primaryHostId } = await sdk.system.config();
  if (primaryHostId === null) throw new Error("bb has no primary host");
  return primaryHostId;
}

async function workspaceRoot(sdk: Sdk, source: FileSource): Promise<Root> {
  const environmentId = await environmentIdFor(sdk, source);
  if (environmentId === null) {
    throw new Error("This file is not in a thread environment");
  }
  const environment = await sdk.environments.get({ environmentId });
  if (environment.path === null) {
    throw new Error(`Environment ${environmentId} has no path on disk`);
  }
  return { hostId: environment.hostId, rootPath: environment.path };
}

async function threadStorageRoot(sdk: Sdk, source: FileSource): Promise<Root> {
  if (source.threadId === null) throw new Error("Thread storage needs a thread");
  const location = await sdk.threads.storageLocation({ threadId: source.threadId });
  return { hostId: location.hostId, rootPath: location.storageRootPath };
}

async function environmentIdFor(sdk: Sdk, source: FileSource): Promise<string | null> {
  if (source.environmentId !== null) return source.environmentId;
  if (source.threadId === null) return null;
  return (await sdk.threads.get({ threadId: source.threadId })).environmentId;
}

function joinInside(rootPath: string, relativePath: string): string {
  const path = join(rootPath, relativePath);
  const fromRoot = relative(rootPath, path);
  if (fromRoot.startsWith("..") || isAbsolute(fromRoot)) {
    throw new Error(`Path is outside ${rootPath}: ${relativePath}`);
  }
  return path;
}
