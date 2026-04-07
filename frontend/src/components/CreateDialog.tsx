import { createSignal } from "solid-js";

interface Props {
  type: "file" | "folder";
  onConfirm: (name: string, type: "file" | "folder") => void;
  onCancel: () => void;
}

export function CreateDialog(props: Props) {
  const [name, setName] = createSignal("");
  let inputRef!: HTMLInputElement;

  function submit(e: Event) {
    e.preventDefault();
    const n = name().trim();
    if (!n) return;
    props.onConfirm(n, props.type);
  }

  return (
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) props.onCancel();
      }}
    >
      <form
        class="bg-white rounded-xl shadow-xl w-80 p-4"
        onSubmit={submit}
      >
        <h3 class="text-sm font-medium mb-3">
          New {props.type === "folder" ? "Folder" : "File"}
        </h3>
        <input
          ref={inputRef}
          class="w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-400"
          placeholder={
            props.type === "folder" ? "folder-name" : "filename.txt"
          }
          value={name()}
          onInput={(e) => setName(e.currentTarget.value)}
          autofocus
        />
        <div class="flex justify-end gap-2 mt-4">
          <button
            type="button"
            class="px-3 py-1.5 text-xs rounded-md border border-gray-200 hover:bg-gray-50"
            onClick={props.onCancel}
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-3 py-1.5 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700"
            disabled={!name().trim()}
          >
            Create
          </button>
        </div>
      </form>
    </div>
  );
}
