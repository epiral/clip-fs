import { createSignal, createEffect, Show } from "solid-js";
import * as api from "../api";
import { isMarkdown, isImage, isText } from "./FileItem";
import { MarkdownPreview } from "./MarkdownPreview";
import { ImagePreview } from "./ImagePreview";
import { TextEditor } from "./TextEditor";

interface Props {
  path: string;
  onClose: () => void;
  onSaved: () => void;
}

export function Preview(props: Props) {
  const [content, setContent] = createSignal<string>("");
  const [encoding, setEncoding] = createSignal<"utf-8" | "base64">("utf-8");
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [size, setSize] = createSignal(0);

  const fileName = () => props.path.split("/").pop() || props.path;

  createEffect(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.cat(props.path);
      setContent(result.content);
      setEncoding(result.encoding);
      setSize(result.size);
    } catch (e: any) {
      setError(e.message || "Failed to load file");
    } finally {
      setLoading(false);
    }
  });

  async function handleSave(newContent: string) {
    try {
      await api.write(props.path, newContent);
      setContent(newContent);
      props.onSaved();
    } catch (e: any) {
      setError(e.message || "Failed to save");
    }
  }

  return (
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) props.onClose();
      }}
    >
      <div class="bg-white rounded-xl shadow-xl w-[90vw] max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div class="flex items-center gap-2 min-w-0">
            <span class="font-medium truncate">{fileName()}</span>
            <Show when={!loading()}>
              <span class="text-xs text-gray-400 shrink-0">
                {(size() / 1024).toFixed(1)} KB
              </span>
            </Show>
          </div>
          <button
            class="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-500"
            onClick={props.onClose}
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div class="flex-1 overflow-auto">
          <Show when={loading()}>
            <div class="flex items-center justify-center py-16 text-gray-400">
              Loading...
            </div>
          </Show>

          <Show when={error()}>
            <div class="p-4 text-red-600 text-sm">{error()}</div>
          </Show>

          <Show when={!loading() && !error()}>
            {/* Markdown */}
            <Show when={isMarkdown(fileName()) && encoding() === "utf-8"}>
              <MarkdownPreview content={content()} onEdit={handleSave} />
            </Show>

            {/* Image */}
            <Show when={isImage(fileName()) && encoding() === "base64"}>
              <ImagePreview name={fileName()} base64={content()} />
            </Show>

            {/* Text/Code */}
            <Show
              when={
                !isMarkdown(fileName()) &&
                !isImage(fileName()) &&
                encoding() === "utf-8" &&
                isText(fileName())
              }
            >
              <TextEditor content={content()} onSave={handleSave} />
            </Show>

            {/* Binary / unknown */}
            <Show
              when={
                encoding() === "base64" && !isImage(fileName())
              }
            >
              <div class="flex flex-col items-center justify-center py-16 text-gray-400">
                <div class="text-4xl mb-4">{"\u{1F4C4}"}</div>
                <div class="text-sm">Binary file ({(size() / 1024).toFixed(1)} KB)</div>
                <div class="text-xs mt-1">Preview not available</div>
              </div>
            </Show>

            {/* UTF-8 but not a known text type - still show as text */}
            <Show
              when={
                encoding() === "utf-8" &&
                !isMarkdown(fileName()) &&
                !isText(fileName())
              }
            >
              <TextEditor content={content()} onSave={handleSave} />
            </Show>
          </Show>
        </div>
      </div>
    </div>
  );
}
