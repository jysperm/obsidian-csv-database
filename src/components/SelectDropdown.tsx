import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { ColumnDef, SelectOption } from "../types";
import { pickColor } from "../constants";
import { Tag } from "./Tag";
import { useClickOutside } from "../hooks/useClickOutside";

interface SelectDropdownProps {
  column: ColumnDef;
  currentValue: string;
  anchorRect: DOMRect;
  onSelect: (value: string) => void;
  onCreateOption: (option: SelectOption) => void;
  onClose: () => void;
}

export function SelectDropdown({
  column,
  currentValue,
  anchorRect,
  onSelect,
  onCreateOption,
  onClose,
}: SelectDropdownProps) {
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useClickOutside([dropdownRef], handleClose);

  const options = column.options || [];
  const lower = search.toLowerCase();
  const filtered = options.filter((o) => o.value.toLowerCase().includes(lower));
  const exactMatch = options.some((o) => o.value.toLowerCase() === lower);

  const handleCreate = () => {
    const newOption: SelectOption = {
      value: search.trim(),
      color: pickColor(options.length),
    };
    onCreateOption(newOption);
    onSelect(newOption.value);
  };

  return createPortal(
    <div
      ref={dropdownRef}
      className="csv-db-dropdown"
      style={{
        top: `${anchorRect.bottom + 2}px`,
        left: `${anchorRect.left}px`,
        minWidth: `${anchorRect.width}px`,
      }}
    >
      <input
        className="csv-db-dropdown-search"
        placeholder="Search or create..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        autoFocus
      />
      <div className="csv-db-dropdown-list">
        {filtered.map((option) => (
          <div
            key={option.value}
            className={`csv-db-dropdown-item ${option.value === currentValue ? "is-selected" : ""}`}
            onClick={() => onSelect(option.value)}
          >
            <span className="csv-db-dropdown-check">
              {option.value === currentValue ? "✓" : ""}
            </span>
            <Tag value={option.value} color={option.color || "gray"} />
          </div>
        ))}
        {search.trim() && !exactMatch && (
          <div
            className="csv-db-dropdown-item csv-db-dropdown-create"
            onClick={handleCreate}
          >
            Create &quot;{search.trim()}&quot;
          </div>
        )}
        {currentValue && (
          <div
            className="csv-db-dropdown-clear"
            onClick={() => onSelect("")}
          >
            Clear
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
