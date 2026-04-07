import { createSignal, For, Show } from "solid-js";
import type { Entry } from "../api";
import type { SortKey, SortDir } from "../App";
import { fileIcon, formatSize, InlineRename } from "./FileItem";

interface Props {
  entries: Entry[];
  selected: Set<string>;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  onOpen: (entry: Entry) => void;
  onToggleSelect: (name: string) => void;
  onRename: (oldName: string, newName: string) => void;
}

function SortIndicator(props: { active: boolean; dir: SortDir }) {
  if (!props.active) return null;
  return (
    <span class="ml-0.5 text-gray-400">
      {props.dir === "asc" ? "\u2191" : "\u2193"}
    </span>
  );
}

export function FileList(props: Props) {
  const [renamingName, setRenamingName] = createSignal<string | null>(null);

  return (
    <table class="w-full">
      <thead>
        <tr class="text-xs text-gray-500 border-b border-gray-100">
          <th class="w-8 px-2 py-2"></th>
          <th
            class="text-left px-2 py-2 cursor-pointer hover:text-gray-700 select-none"
            onClick={() => props.onSort("name")}
          >
            Name
            <SortIndicator
              active={props.sortKey === "name"}
              dir={props.sortDir}
            />
          </th>
          <th
            class="text-right px-4 py-2 w-24 cursor-pointer hover:text-gray-700 select-none"
            onClick={() => props.onSort("size")}
          >
            Size
            <SortIndicator
              active={props.sortKey === "size"}
              dir={props.sortDir}
            />
          </th>
        </tr>
      </thead>
      <tbody>
        <For each={props.entries}>
          {(entry) => (
            <tr
              class={`border-b border-gray-50 hover:bg-blue-50/50 cursor-pointer ${
                props.selected.has(entry.name) ? "bg-blue-50" : ""
              }`}
              onDblClick={() => props.onOpen(entry)}
            >
              <td class="px-2 py-1.5 text-center">
                <input
                  type="checkbox"
                  class="w-3.5 h-3.5 rounded accent-blue-600"
                  checked={props.selected.has(entry.name)}
                  onChange={() => props.onToggleSelect(entry.name)}
                  onClick={(e) => e.stopPropagation()}
                />
              </td>
              <td class="px-2 py-1.5">
                <div class="flex items-center gap-2">
                  <span class="text-base leading-none">{fileIcon(entry)}</span>
                  <Show
                    when={renamingName() === entry.name}
                    fallback={
                      <span
                        class={`truncate ${
                          entry.type === "directory" ? "font-medium" : ""
                        }`}
                        onClick={() => props.onOpen(entry)}
                        onDblClick={(e) => {
                          e.stopPropagation();
                          setRenamingName(entry.name);
                        }}
                      >
                        {entry.name}
                        {entry.type === "directory" ? "/" : ""}
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
                </div>
              </td>
              <td class="text-right px-4 py-1.5 text-gray-400 text-xs tabular-nums">
                {entry.type === "directory" ? "--" : formatSize(entry.size)}
              </td>
            </tr>
          )}
        </For>
      </tbody>
    </table>
  );
}
