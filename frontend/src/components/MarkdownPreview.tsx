import { createSignal, Show } from "solid-js";
import { marked } from "marked";

interface Props {
  content: string;
  onEdit: (content: string) => void;
}

export function MarkdownPreview(props: Props) {
  const [editing, setEditing] = createSignal(false);
  const [editContent, setEditContent] = createSignal("");

  function startEdit() {
    setEditContent(props.content);
    setEditing(true);
  }

  function save() {
    props.onEdit(editContent());
    setEditing(false);
  }

  const rendered = () => {
    try {
      return marked.parse(props.content) as string;
    } catch {
      return props.content;
    }
  };

  return (
    <div class="relative">
      <Show
        when={editing()}
        fallback={
          <div class="p-4">
            <div class="flex justify-end mb-2">
              <button
                class="text-xs px-2 py-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-50"
                onClick={startEdit}
              >
                Edit
              </button>
            </div>
            <div class="markdown-body" innerHTML={rendered()} />
          </div>
        }
      >
        <div class="flex flex-col h-full">
          <div class="flex justify-end gap-2 p-2 border-b border-gray-100">
            <button
              class="text-xs px-2 py-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-50"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
            <button
              class="text-xs px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
              onClick={save}
            >
              Save
            </button>
          </div>
          <textarea
            class="flex-1 w-full p-4 font-mono text-sm resize-none outline-none min-h-[300px]"
            value={editContent()}
            onInput={(e) => setEditContent(e.currentTarget.value)}
          />
        </div>
      </Show>
    </div>
  );
}
