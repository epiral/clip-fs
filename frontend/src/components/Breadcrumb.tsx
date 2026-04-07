interface Props {
  path: string;
  onNavigate: (path: string) => void;
}

export function Breadcrumb(props: Props) {
  const segments = () => {
    if (!props.path) return [];
    return props.path.split("/").filter(Boolean);
  };

  return (
    <div class="flex items-center gap-1 px-4 py-2 bg-white border-b border-gray-100 text-xs text-gray-600 overflow-x-auto">
      <button
        class="hover:text-blue-600 font-medium shrink-0"
        onClick={() => props.onNavigate("")}
      >
        /
      </button>
      {segments().map((seg, i) => {
        const pathUpTo = segments()
          .slice(0, i + 1)
          .join("/");
        const isLast = i === segments().length - 1;
        return (
          <>
            <span class="text-gray-300 shrink-0">&gt;</span>
            <button
              class={`hover:text-blue-600 shrink-0 ${
                isLast ? "text-gray-900 font-medium" : ""
              }`}
              onClick={() => props.onNavigate(pathUpTo)}
            >
              {seg}
            </button>
          </>
        );
      })}
    </div>
  );
}
