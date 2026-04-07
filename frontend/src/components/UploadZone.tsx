import { createSignal } from "solid-js";

interface Props {
  onUpload: (fileName: string, content: string, encoding: "utf-8" | "base64") => void;
  onClose: () => void;
}

export function UploadZone(props: Props) {
  const [dragging, setDragging] = createSignal(false);
  const [uploading, setUploading] = createSignal(false);
  let fileInput!: HTMLInputElement;

  function handleFiles(files: FileList) {
    setUploading(true);
    const promises: Promise<void>[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      promises.push(
        new Promise<void>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Check if it's text
            const isTextFile =
              file.type.startsWith("text/") ||
              file.type === "application/json" ||
              file.type === "application/javascript" ||
              file.type === "application/xml" ||
              file.type === "";

            if (isTextFile) {
              // Re-read as text
              const textReader = new FileReader();
              textReader.onload = () => {
                props.onUpload(file.name, textReader.result as string, "utf-8");
                resolve();
              };
              textReader.onerror = () => reject(textReader.error);
              textReader.readAsText(file);
            } else {
              // Use base64 encoding - strip the data URL prefix
              const base64 = result.split(",")[1] || "";
              props.onUpload(file.name, base64, "base64");
              resolve();
            }
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        }),
      );
    }

    Promise.all(promises).finally(() => {
      setUploading(false);
      props.onClose();
    });
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer?.files.length) {
      handleFiles(e.dataTransfer.files);
    }
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();
    setDragging(true);
  }

  return (
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) props.onClose();
      }}
    >
      <div class="bg-white rounded-xl shadow-xl w-96 p-6">
        <h3 class="text-sm font-medium mb-4">Upload Files</h3>

        <div
          class={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            dragging()
              ? "border-blue-400 bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={() => setDragging(false)}
          onClick={() => fileInput.click()}
        >
          <input
            ref={fileInput}
            type="file"
            class="hidden"
            multiple
            onChange={(e) => {
              if (e.currentTarget.files?.length) {
                handleFiles(e.currentTarget.files);
              }
            }}
          />
          {uploading() ? (
            <div class="text-sm text-gray-500">Uploading...</div>
          ) : (
            <>
              <div class="text-2xl mb-2">{"\u{1F4E4}"}</div>
              <div class="text-sm text-gray-500">
                Drop files here or click to select
              </div>
            </>
          )}
        </div>

        <div class="flex justify-end mt-4">
          <button
            class="px-3 py-1.5 text-xs rounded-md border border-gray-200 hover:bg-gray-50"
            onClick={props.onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
