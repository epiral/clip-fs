import { createSignal, For, Show } from "solid-js";
import type { Entry } from "../api";
import { fileIcon, formatSize, InlineRename } from "./FileItem";

interface Props {
  entries: Entry[];
  selected: Set<string>;
  onOpen: (entry: Entry) => void;
  onToggleSelect: (name: string) => void;
  onRename: (oldName: string, newName: string) => void;
}

export function FileGrid(props: Props) {
  const [renamingName, setRenamingName] = createSignal<string | null>(null);

  return (
    <div class="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2 p-4">
      <For each={props.entries}>
        {(entry) => (
          <div
            class={`flex flex-col items-center gap-1 p-3 rounded-lg cursor-pointer hover:bg-blue-50/50 relative group ${
              props.selected.has(entry.name) ? "bg-blue-50 ring-1 ring-blue-200" : ""
            }`}
            onClick={() => props.onOpen(entry)}
          >
            {/* Checkbox */}
            <input
              type="checkbox"
              class="absolute top-1.5 left-1.5 w-3.5 h-3.5 rounded accent-blue-600 opacity-0 group-hover:opacity-100 checked:opacity-100"
              checked={props.selected.has(entry.name)}
              onChange={(e) => {
                e.stopPropagation();
                props.onToggleSelect(entry.name);
              }}
              onClick={(e) => e.stopPropagation()}
            />

            <span class="text-3xl leading-none">{fileIcon(entry)}</span>

            <Show
              when={renamingName() === entry.name}
              fallback={
                <span
                  class="text-xs text-center truncate w-full"
                  onDblClick={(e) => {
                    e.stopPropagation();
                    setRenamingName(entry.name);
                  }}
                >
                  {entry.name}
                </span>
              }
            >
              <InlineRename
                name={entry.name}
                onRename={(newName) => {
                  props.onRename(entry.name, newName);
                  setRenamingName(null);
                }}
                onCancel={() => setRenamingName(null)}
              />
            </Show>

            <span class="text-[10px] text-gray-400">
              {entry.type === "directory" ? "Folder" : formatSize(entry.size)}
            </span>
          </div>
        )}
      </For>
    </div>
  );
}
