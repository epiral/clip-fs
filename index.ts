#!/usr/bin/env bun
import { Clip, command, handler, z } from "@pinixai/core";
import * as path from "node:path";
import {
  existsSync,
  realpathSync,
  mkdirSync,
  statSync,
  readdirSync,
  copyFileSync,
  cpSync,
  renameSync,
  rmSync,
  unlinkSync,
} from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";

const entrySchema = z.object({
  name: z.string().describe("File or directory name"),
  type: z.enum(["file", "directory"]).describe("Entry type"),
  size: z.number().describe("Size in bytes"),
}).describe("Directory entry");

class FsClip extends Clip {
  name = "fs";
  domain = "Sandboxed filesystem operations for AI agents";
  patterns = [
    "ls → cat (browse then read)",
    "write → cat (write then verify)",
    "mkdir → write → ls (create dir, write file, list)",
    "find → cat (search then read)",
    "cp → ls (copy then verify)",
    "mv → ls (move then verify)",
  ];

  entities = {
    Entry: entrySchema,
  };

  readonly root: string;

  constructor() {
    super();
    this.root = path.resolve(
      process.env["PINIX_WORKSPACE"] || path.join(homedir(), ".pinix", "workspace"),
    );
    mkdirSync(this.root, { recursive: true });
  }

  /** Resolve a relative path to an absolute path within the workspace. */
  private resolve(p: string): string {
    if (path.isAbsolute(p)) throw new Error("Absolute paths not allowed");
    const resolved = path.resolve(this.root, p);
    if (!resolved.startsWith(this.root + path.sep) && resolved !== this.root) {
      throw new Error("Path escapes workspace");
    }
    if (existsSync(resolved)) {
      const real = realpathSync(resolved);
      if (!real.startsWith(this.root + path.sep) && real !== this.root) {
        throw new Error("Symlink escapes workspace");
      }
    }
    return resolved;
  }

  @command("Read file content (text as utf-8, binary as base64)")
  cat = handler(
    z.object({
      path: z.string().describe("Relative path to file"),
    }),
    z.object({
      content: z.string().describe("File content"),
      encoding: z.enum(["utf-8", "base64"]).describe("Content encoding"),
      size: z.number().describe("File size in bytes"),
    }),
    async ({ path: p }) => {
      const resolved = this.resolve(p);
      const buf = await readFile(resolved);
      const isText = !buf.some(
        (b) => b === 0 || (b < 0x20 && b !== 0x09 && b !== 0x0a && b !== 0x0d),
      );
      return {
        content: isText ? buf.toString("utf-8") : buf.toString("base64"),
        encoding: isText ? ("utf-8" as const) : ("base64" as const),
        size: buf.length,
      };
    },
  );

  @command("Write content to a file (creates parent directories)")
  write = handler(
    z.object({
      path: z.string().describe("Relative path to file"),
      content: z.string().describe("File content"),
      encoding: z.enum(["utf-8", "base64"]).default("utf-8").describe("Content encoding"),
    }),
    z.object({
      path: z.string().describe("Written file path"),
      size: z.number().describe("File size in bytes"),
    }),
    async ({ path: p, content, encoding }) => {
      const resolved = this.resolve(p);
      mkdirSync(path.dirname(resolved), { recursive: true });
      const buf =
        encoding === "base64"
          ? Buffer.from(content, "base64")
          : Buffer.from(content, "utf-8");
      await writeFile(resolved, buf);
      return { path: p, size: buf.length };
    },
  );

  @command("List directory contents")
  ls = handler(
    z.object({
      path: z.string().default(".").describe("Relative directory path"),
      glob: z.string().optional().describe("Glob pattern to filter entries"),
    }),
    z.object({
      entries: z.array(entrySchema).describe("Directory entries"),
    }),
    async ({ path: p, glob: globPattern }) => {
      const resolved = this.resolve(p);
      const names = readdirSync(resolved);
      let entries: Array<{ name: string; type: "file" | "directory"; size: number }> = [];
      for (const name of names) {
        const full = path.join(resolved, name);
        try {
          const st = statSync(full);
          entries.push({
            name,
            type: st.isDirectory() ? "directory" : "file",
            size: st.size,
          });
        } catch {
          // skip inaccessible entries
        }
      }
      if (globPattern) {
        const re = globToRegex(globPattern);
        entries = entries.filter((e) => re.test(e.name));
      }
      return { entries };
    },
  );

  @command("Copy file or directory")
  cp = handler(
    z.object({
      src: z.string().describe("Source relative path"),
      dst: z.string().describe("Destination relative path"),
    }),
    z.object({
      src: z.string().describe("Source path"),
      dst: z.string().describe("Destination path"),
    }),
    async ({ src, dst }) => {
      const resolvedSrc = this.resolve(src);
      const resolvedDst = this.resolve(dst);
      mkdirSync(path.dirname(resolvedDst), { recursive: true });
      const st = statSync(resolvedSrc);
      if (st.isDirectory()) {
        cpSync(resolvedSrc, resolvedDst, { recursive: true });
      } else {
        copyFileSync(resolvedSrc, resolvedDst);
      }
      return { src, dst };
    },
  );

  @command("Move or rename file or directory")
  mv = handler(
    z.object({
      src: z.string().describe("Source relative path"),
      dst: z.string().describe("Destination relative path"),
    }),
    z.object({
      src: z.string().describe("Source path"),
      dst: z.string().describe("Destination path"),
    }),
    async ({ src, dst }) => {
      const resolvedSrc = this.resolve(src);
      const resolvedDst = this.resolve(dst);
      mkdirSync(path.dirname(resolvedDst), { recursive: true });
      renameSync(resolvedSrc, resolvedDst);
      return { src, dst };
    },
  );

  @command("Delete file or directory")
  rm = handler(
    z.object({
      path: z.string().describe("Relative path to delete"),
    }),
    z.object({
      path: z.string().describe("Deleted path"),
    }),
    async ({ path: p }) => {
      const resolved = this.resolve(p);
      const st = statSync(resolved);
      if (st.isDirectory()) {
        rmSync(resolved, { recursive: true });
      } else {
        unlinkSync(resolved);
      }
      return { path: p };
    },
  );

  @command("Create directory (recursive)")
  mkdir = handler(
    z.object({
      path: z.string().describe("Relative directory path"),
    }),
    z.object({
      path: z.string().describe("Created directory path"),
    }),
    async ({ path: p }) => {
      const resolved = this.resolve(p);
      mkdirSync(resolved, { recursive: true });
      return { path: p };
    },
  );

  @command("Get file or directory metadata")
  stat = handler(
    z.object({
      path: z.string().describe("Relative path"),
    }),
    z.object({
      path: z.string().describe("File path"),
      type: z.enum(["file", "directory", "symlink"]).describe("Entry type"),
      size: z.number().describe("Size in bytes"),
      modified: z.string().describe("Last modified time (ISO 8601)"),
      created: z.string().describe("Creation time (ISO 8601)"),
    }),
    async ({ path: p }) => {
      const resolved = this.resolve(p);
      const st = statSync(resolved, { throwIfNoEntry: true })!;
      const lstat = statSync(resolved, { throwIfNoEntry: true })!;
      let type: "file" | "directory" | "symlink";
      // Check lstat first for symlinks
      try {
        const { lstatSync } = await import("node:fs");
        const ls = lstatSync(resolved);
        if (ls.isSymbolicLink()) {
          type = "symlink";
        } else if (st.isDirectory()) {
          type = "directory";
        } else {
          type = "file";
        }
      } catch {
        type = st.isDirectory() ? "directory" : "file";
      }
      return {
        path: p,
        type,
        size: st.size,
        modified: st.mtime.toISOString(),
        created: st.birthtime.toISOString(),
      };
    },
  );

  @command("Search for files by glob pattern")
  find = handler(
    z.object({
      path: z.string().default(".").describe("Relative directory to search in"),
      pattern: z.string().describe("Glob pattern to match file names"),
    }),
    z.object({
      matches: z.array(z.string()).describe("Matching relative paths"),
    }),
    async ({ path: p, pattern }) => {
      const resolved = this.resolve(p);
      const re = globToRegex(pattern);
      const matches: string[] = [];
      const walk = (dir: string) => {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          const rel = path.relative(this.root, full);
          if (re.test(entry.name)) {
            matches.push(rel);
          }
          if (entry.isDirectory()) {
            walk(full);
          }
        }
      };
      walk(resolved);
      return { matches };
    },
  );
}

/** Convert a simple glob pattern to a RegExp. Supports * and ? wildcards. */
function globToRegex(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  const re = escaped.replace(/\*\*/g, "##GLOBSTAR##")
    .replace(/\*/g, "[^/]*")
    .replace(/\?/g, "[^/]")
    .replace(/##GLOBSTAR##/g, ".*");
  return new RegExp(`^${re}$`);
}

if (import.meta.main) {
  await new FsClip().start();
}
