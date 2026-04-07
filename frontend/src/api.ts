import { createHubClient, hubInvoke } from "@pinixai/hub-client";

const client = createHubClient({
  baseUrl: window.location.origin,
});

const CLIP = "fs";

async function invoke(command: string, input: Record<string, unknown>): Promise<any> {
  return hubInvoke(client, CLIP, command, input);
}

export interface Entry {
  name: string;
  type: "file" | "directory";
  size: number;
}

export interface StatResult {
  path: string;
  type: "file" | "directory" | "symlink";
  size: number;
  modified: string;
  created: string;
}

export interface CatResult {
  content: string;
  encoding: "utf-8" | "base64";
  size: number;
}

export const ls = (path = "."): Promise<{ entries: Entry[] }> =>
  invoke("ls", { path });

export const cat = (path: string): Promise<CatResult> =>
  invoke("cat", { path });

export const write = (
  path: string,
  content: string,
  encoding: "utf-8" | "base64" = "utf-8",
): Promise<{ path: string; size: number }> =>
  invoke("write", { path, content, encoding });

export const mkdir = (path: string): Promise<{ path: string }> =>
  invoke("mkdir", { path });

export const rm = (path: string): Promise<{ path: string }> =>
  invoke("rm", { path });

export const mv = (
  src: string,
  dst: string,
): Promise<{ src: string; dst: string }> => invoke("mv", { src, dst });

export const cp = (
  src: string,
  dst: string,
): Promise<{ src: string; dst: string }> => invoke("cp", { src, dst });

export const stat = (path: string): Promise<StatResult> =>
  invoke("stat", { path });

export const find = (
  pattern: string,
  path?: string,
): Promise<any> =>
  invoke("find", { pattern, ...(path ? { path } : {}) });
