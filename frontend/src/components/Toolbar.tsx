interface Props {
  selectedCount: number;
  onNewFile: () => void;
  onNewFolder: () => void;
  onDelete: () => void;
}

export function Toolbar(props: Props) {
  return (
    <div class="flex items-center gap-2 px-4 py-2 bg-white border-t border-gray-200 text-xs">
      <button
        class="px-3 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50"
        onClick={props.onNewFile}
      >
        New File
      </button>
      <button
        class="px-3 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50"
        onClick={props.onNewFolder}
      >
        New Folder
      </button>
      <div class="flex-1" />
      {props.selectedCount > 0 && (
        <button
          class="px-3 py-1.5 rounded-md border border-red-200 text-red-600 hover:bg-red-50"
          onClick={props.onDelete}
        >
          Delete ({props.selectedCount})
        </button>
      )}
    </div>
  );
}
