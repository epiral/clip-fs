import { createSignal, createEffect, Show, onCleanup } from "solid-js";
import { Header } from "./components/Header";
import { Breadcrumb } from "./components/Breadcrumb";
import { FileList } from "./components/FileList";
import { FileGrid } from "./components/FileGrid";
import { Toolbar } from "./components/Toolbar";
import { Preview } from "./components/Preview";
import { CreateDialog } from "./components/CreateDialog";
import { UploadZone } from "./components/UploadZone";
import * as api from "./api";
import type { Entry } from "./api";

export type ViewMode = "list" | "grid";
export type SortKey = "name" | "size" | "type";
export type SortDir = "asc" | "desc";

export default function App() {
  const [currentPath, setCurrentPath] = createSignal("");
  const [entries, setEntries] = createSignal<Entry[]>([]);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [viewMode, setViewMode] = createSignal<ViewMode>(
    (localStorage.getItem("fs-view-mode") as ViewMode) || "list",
  );
  const [selectedFile, setSelectedFile] = createSignal<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = createSignal<
    "file" | "folder" | null
  >(null);
  const [showUpload, setShowUpload] = createSignal(false);
  const [sortKey, setSortKey] = createSignal<SortKey>("name");
  const [sortDir, setSortDir] = createSignal<SortDir>("asc");
  const [selectedEntries, setSelectedEntries] = createSignal<Set<string>>(
    new Set(),
  );

  // Persist view mode
  createEffect(() => {
    localStorage.setItem("fs-view-mode", viewMode());
  });

  // Load directory
  async function loadDir(dirPath?: string) {
    const p = dirPath ?? currentPath();
    setLoading(true);
    setError(null);
    setSelectedEntries(new Set());
    try {
      const result = await api.ls(p || ".");
      setEntries(result.entries);
      if (dirPath !== undefined) {
        setCurrentPath(dirPath);
        setSelectedFile(null);
      }
    } catch (e: any) {
      setError(e.message || "Failed to load directory");
    } finally {
      setLoading(false);
    }
  }

  // Initial load
  createEffect(() => {
    loadDir("");
  });

  function navigateTo(path: string) {
    loadDir(path);
  }

  function openEntry(entry: Entry) {
    if (entry.type === "directory") {
      const newPath = currentPath()
        ? `${currentPath()}/${entry.name}`
        : entry.name;
      navigateTo(newPath);
    } else {
      const filePath = currentPath()
        ? `${currentPath()}/${entry.name}`
        : entry.name;
      setSelectedFile(filePath);
    }
  }

  function toggleSelect(name: string) {
    const s = new Set(selectedEntries());
    if (s.has(name)) s.delete(name);
    else s.add(name);
    setSelectedEntries(s);
  }

  async function handleDelete() {
    const selected = selectedEntries();
    if (selected.size === 0) return;
    const names = Array.from(selected);
    if (
      !confirm(`Delete ${names.length} item(s)?\n${names.join(", ")}`)
    )
      return;
    try {
      for (const name of names) {
        const fullPath = currentPath()
          ? `${currentPath()}/${name}`
          : name;
        await api.rm(fullPath);
      }
      await loadDir();
    } catch (e: any) {
      setError(e.message || "Delete failed");
    }
  }

  async function handleRename(oldName: string, newName: string) {
    if (oldName === newName) return;
    try {
      const src = currentPath() ? `${currentPath()}/${oldName}` : oldName;
      const dst = currentPath() ? `${currentPath()}/${newName}` : newName;
      await api.mv(src, dst);
      await loadDir();
    } catch (e: any) {
      setError(e.message || "Rename failed");
    }
  }

  async function handleCreate(name: string, type: "file" | "folder") {
    try {
      const fullPath = currentPath() ? `${currentPath()}/${name}` : name;
      if (type === "folder") {
        await api.mkdir(fullPath);
      } else {
        await api.write(fullPath, "");
      }
      setShowCreateDialog(null);
      await loadDir();
    } catch (e: any) {
      setError(e.message || "Create failed");
    }
  }

  async function handleUpload(fileName: string, content: string, encoding: "utf-8" | "base64") {
    try {
      const fullPath = currentPath()
        ? `${currentPath()}/${fileName}`
        : fileName;
      await api.write(fullPath, content, encoding);
      await loadDir();
    } catch (e: any) {
      setError(e.message || "Upload failed");
    }
  }

  function sortedEntries(): Entry[] {
    const sorted = [...entries()];
    // Directories first, then sort within each group
    sorted.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "directory" ? -1 : 1;
      }
      const key = sortKey();
      const dir = sortDir() === "asc" ? 1 : -1;
      if (key === "name") return a.name.localeCompare(b.name) * dir;
      if (key === "size") return (a.size - b.size) * dir;
      if (key === "type") return a.type.localeCompare(b.type) * dir;
      return 0;
    });
    return sorted;
  }

  function handleSort(key: SortKey) {
    if (sortKey() === key) {
      setSortDir(sortDir() === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  // Keyboard shortcuts
  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      if (selectedFile()) setSelectedFile(null);
      else if (showCreateDialog()) setShowCreateDialog(null);
      else if (showUpload()) setShowUpload(false);
    }
  }
  createEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    onCleanup(() => window.removeEventListener("keydown", onKeyDown));
  });

  return (
    <div class="h-screen flex flex-col bg-gray-50 text-gray-900 text-sm">
      <Header
        viewMode={viewMode()}
        onViewModeChange={setViewMode}
        onUpload={() => setShowUpload(true)}
      />
      <Breadcrumb path={currentPath()} onNavigate={navigateTo} />

      <Show when={error()}>
        <div class="mx-4 mt-2 px-3 py-2 bg-red-50 text-red-700 rounded-md text-xs flex items-center justify-between">
          <span>{error()}</span>
          <button
            class="ml-2 text-red-500 hover:text-red-700"
            onClick={() => setError(null)}
          >
            x
          </button>
        </div>
      </Show>

      <div class="flex-1 overflow-auto relative">
        <Show when={loading()}>
          <div class="absolute inset-0 flex items-center justify-center bg-white/60 z-10">
            <div class="text-gray-400">Loading...</div>
          </div>
        </Show>

        <Show
          when={viewMode() === "list"}
          fallback={
            <FileGrid
              entries={sortedEntries()}
              selected={selectedEntries()}
              onOpen={openEntry}
              onToggleSelect={toggleSelect}
              onRename={handleRename}
            />
          }
        >
          <FileList
            entries={sortedEntries()}
            selected={selectedEntries()}
            sortKey={sortKey()}
            sortDir={sortDir()}
            onSort={handleSort}
            onOpen={openEntry}
            onToggleSelect={toggleSelect}
            onRename={handleRename}
          />
        </Show>

        <Show when={entries().length === 0 && !loading()}>
          <div class="flex flex-col items-center justify-center py-16 text-gray-400">
            <div class="text-3xl mb-2">Empty</div>
            <div>No files in this directory</div>
          </div>
        </Show>
      </div>

      <Toolbar
        selectedCount={selectedEntries().size}
        onNewFile={() => setShowCreateDialog("file")}
        onNewFolder={() => setShowCreateDialog("folder")}
        onDelete={handleDelete}
      />

      <Show when={selectedFile()}>
        <Preview
          path={selectedFile()!}
          onClose={() => setSelectedFile(null)}
          onSaved={() => loadDir()}
        />
      </Show>

      <Show when={showCreateDialog()}>
        <CreateDialog
          type={showCreateDialog()!}
          onConfirm={handleCreate}
          onCancel={() => setShowCreateDialog(null)}
        />
      </Show>

      <Show when={showUpload()}>
        <UploadZone
          onUpload={handleUpload}
          onClose={() => setShowUpload(false)}
        />
      </Show>
    </div>
  );
}
