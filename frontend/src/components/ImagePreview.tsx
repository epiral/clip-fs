interface Props {
  name: string;
  base64: string;
}

function mimeType(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  const types: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    svg: "image/svg+xml",
    webp: "image/webp",
    bmp: "image/bmp",
    ico: "image/x-icon",
  };
  return types[ext] || "image/png";
}

export function ImagePreview(props: Props) {
  return (
    <div class="flex items-center justify-center p-4 bg-gray-50 min-h-[300px]">
      <img
        src={`data:${mimeType(props.name)};base64,${props.base64}`}
        alt={props.name}
        class="max-w-full max-h-[60vh] object-contain rounded-md"
      />
    </div>
  );
}
