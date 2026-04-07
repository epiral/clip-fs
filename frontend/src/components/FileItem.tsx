import { createSignal, Show } from "solid-js";
import type { Entry } from "../api";

/** Get icon for file type based on extension */
export function fileIcon(entry: Entry): string {
  if (entry.type === "directory") return "\u{1F4C1}"; // folder
  const ext = entry.name.split(".").pop()?.toLowerCase() || "";
  const icons: Record<string, string> = {
    md: "\u{1F4DD}",
    txt: "\u{1F4C4}",
    json: "\u{1F4CB}",
    ts: "\u{1F4DC}",
    tsx: "\u{1F4DC}",
    js: "\u{1F4DC}",
    jsx: "\u{1F4DC}",
    go: "\u{1F4DC}",
    py: "\u{1F4DC}",
    rs: "\u{1F4DC}",
    html: "\u{1F310}",
    css: "\u{1F3A8}",
    png: "\u{1F5BC}",
    jpg: "\u{1F5BC}",
    jpeg: "\u{1F5BC}",
    gif: "\u{1F5BC}",
    svg: "\u{1F5BC}",
    webp: "\u{1F5BC}",
    pdf: "\u{1F4D5}",
    zip: "\u{1F4E6}",
    tar: "\u{1F4E6}",
    gz: "\u{1F4E6}",
  };
  return icons[ext] || "\u{1F4C4}"; // default file
}

/** Format file size */
export function formatSize(bytes: number): string {
  if (bytes === 0) return "--";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Inline rename input */
export function InlineRename(props: {
  name: string;
  onRename: (newName: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = createSignal(props.name);
  let inputRef!: HTMLInputElement;

  function commit() {
    const v = value().trim();
    if (v && v !== props.name) {
      props.onRename(v);
    } else {
      props.onCancel();
    }
  }

  return (
    <input
      ref={inputRef}
      class="border border-blue-400 rounded px-1 py-0.5 text-xs w-full max-w-48 outline-none"
      value={value()}
      onInput={(e) => setValue(e.currentTarget.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") props.onCancel();
      }}
      autofocus
    />
  );
}

/** Check if a file is an image based on extension */
export function isImage(name: string): boolean {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  return ["png", "jpg", "jpeg", "gif", "svg", "webp", "bmp", "ico"].includes(ext);
}

/** Check if a file is a text/code file */
export function isText(name: string): boolean {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  return [
    "txt", "md", "json", "ts", "tsx", "js", "jsx", "go", "py", "rs",
    "html", "css", "scss", "yaml", "yml", "toml", "xml", "sh", "bash",
    "zsh", "fish", "env", "gitignore", "dockerignore", "dockerfile",
    "makefile", "csv", "sql", "graphql", "proto", "conf", "ini", "cfg",
    "log", "diff", "patch", "c", "cpp", "h", "hpp", "java", "kt",
    "swift", "rb", "php", "lua", "vim", "el", "lisp", "clj",
  ].includes(ext) || !name.includes(".");
}

export function isMarkdown(name: string): boolean {
  return name.toLowerCase().endsWith(".md");
}
