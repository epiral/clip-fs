import type { ViewMode } from "../App";

interface Props {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onUpload: () => void;
}

export function Header(props: Props) {
  return (
    <header class="flex items-center justify-between px-4 py-2.5 bg-white border-b border-gray-200">
      <div class="flex items-center gap-2">
        <span class="text-base">Workspace</span>
      </div>
      <div class="flex items-center gap-2">
        {/* View toggle */}
        <div class="flex rounded-md border border-gray-200 overflow-hidden">
          <button
            class={`px-2.5 py-1 text-xs ${
              props.viewMode === "list"
                ? "bg-gray-100 text-gray-900"
                : "text-gray-500 hover:bg-gray-50"
            }`}
            onClick={() => props.onViewModeChange("list")}
            title="List view"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button
            class={`px-2.5 py-1 text-xs border-l border-gray-200 ${
              props.viewMode === "grid"
                ? "bg-gray-100 text-gray-900"
                : "text-gray-500 hover:bg-gray-50"
            }`}
            onClick={() => props.onViewModeChange("grid")}
            title="Grid view"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
          </button>
        </div>

        <button
          class="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700"
          onClick={props.onUpload}
        >
          Upload
        </button>
      </div>
    </header>
  );
}
