import { createSignal } from "solid-js";

interface Props {
  content: string;
  onSave: (content: string) => void;
}

export function TextEditor(props: Props) {
  const [value, setValue] = createSignal(props.content);
  const [dirty, setDirty] = createSignal(false);
  const [saving, setSaving] = createSignal(false);

  function handleInput(e: InputEvent & { currentTarget: HTMLTextAreaElement }) {
    setValue(e.currentTarget.value);
    setDirty(true);
  }

  async function save() {
    setSaving(true);
    try {
      props.onSave(value());
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div class="flex flex-col h-full">
      <div class="flex items-center justify-between px-4 py-2 border-b border-gray-100">
        <span class="text-xs text-gray-400">
          {dirty() ? "Unsaved changes" : ""}
        </span>
        <button
          class="text-xs px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          onClick={save}
          disabled={!dirty() || saving()}
        >
          {saving() ? "Saving..." : "Save"}
        </button>
      </div>
      <textarea
        class="flex-1 w-full p-4 font-mono text-sm resize-none outline-none min-h-[300px] bg-gray-50"
        value={value()}
        onInput={handleInput}
        spellcheck={false}
      />
    </div>
  );
}
