import { useState, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useApp, usePortalContainer } from "../AppContext";
import { useClickOutside } from "../hooks/useClickOutside";

interface NoteDropdownProps {
  currentValue: string;
  anchorRect: DOMRect;
  onSelect: (value: string) => void;
  onClose: () => void;
}

export function NoteDropdown({
  currentValue,
  anchorRect,
  onSelect,
  onClose,
}: NoteDropdownProps) {
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const app = useApp();
  const portalContainer = usePortalContainer();

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useClickOutside([dropdownRef], handleClose);

  const allFiles = useMemo(() => {
    return app.vault.getMarkdownFiles().map((f) => ({
      path: f.path,
      basename: f.basename,
      folder: f.parent?.path || "",
    }));
  }, [app.vault]);

  const lower = search.toLowerCase();
  const filtered = useMemo(() => {
    const results = allFiles.filter(
      (f) =>
        f.path !== currentValue &&
        (f.basename.toLowerCase().includes(lower) ||
          f.path.toLowerCase().includes(lower))
    );
    return results.slice(0, 50);
  }, [allFiles, currentValue, lower]);

  return createPortal(
    <div
      ref={dropdownRef}
      className="csv-db-dropdown"
      style={{
        top: `${anchorRect.top}px`,
        left: `${anchorRect.left}px`,
        width: `${anchorRect.width}px`,
      }}
    >
      <div
        className="csv-db-dropdown-input-area"
        onClick={() => {
          const input = dropdownRef.current?.querySelector<HTMLInputElement>(
            ".csv-db-dropdown-search"
          );
          input?.focus();
        }}
      >
        {currentValue && (
          <span className="csv-db-note-selected">
            <span className="csv-db-note-selected-icon">📄</span>
            <span className="csv-db-note-selected-name">
              {currentValue.replace(/\.md$/, "").split("/").pop()}
            </span>
            <span
              className="csv-db-tag-remove-btn"
              onClick={(e) => {
                e.stopPropagation();
                onSelect("");
              }}
            >
              ✕
            </span>
          </span>
        )}
        <input
          className="csv-db-dropdown-search"
          placeholder={currentValue ? "" : "Search notes..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          autoFocus
        />
      </div>
      <div className="csv-db-dropdown-hint">Search for a note</div>
      <div className="csv-db-dropdown-list">
        {filtered.map((file) => (
          <div
            key={file.path}
            className="csv-db-dropdown-item"
            onClick={() => onSelect(file.path)}
          >
            <span className="csv-db-note-item-icon">📄</span>
            <span className="csv-db-note-item-name">{file.basename}</span>
            {file.folder && (
              <span className="csv-db-note-item-path">{file.folder}</span>
            )}
          </div>
        ))}
      </div>
    </div>,
    portalContainer
  );
}
