import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { ColumnDef, SelectOption } from "../types";
import { pickColor } from "../constants";
import { Tag } from "./Tag";
import { useClickOutside } from "../hooks/useClickOutside";

interface MultiSelectDropdownProps {
  column: ColumnDef;
  currentValues: string[];
  anchorRect: DOMRect;
  onCommit: (values: string[]) => void;
  onCreateOption: (option: SelectOption) => void;
  onClose: () => void;
}

export function MultiSelectDropdown({
  column,
  currentValues,
  anchorRect,
  onCommit,
  onCreateOption,
  onClose,
}: MultiSelectDropdownProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set(currentValues));
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    onCommit(Array.from(selected));
    onClose();
  }, [onCommit, onClose, selected]);

  useClickOutside([dropdownRef], handleClose);

  const options = column.options || [];
  const lower = search.toLowerCase();
  const filtered = options.filter((o) => o.value.toLowerCase().includes(lower));
  const exactMatch = options.some((o) => o.value.toLowerCase() === lower);

  const toggleOption = (value: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  };

  const handleCreate = () => {
    const newOption: SelectOption = {
      value: search.trim(),
      color: pickColor(options.length),
    };
    onCreateOption(newOption);
    setSelected((prev) => new Set(prev).add(newOption.value));
    setSearch("");
  };

  const handleClearAll = () => {
    setSelected(new Set());
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
        {filtered.map((option) => {
          const isSelected = selected.has(option.value);
          return (
            <div
              key={option.value}
              className={`csv-db-dropdown-item ${isSelected ? "is-selected" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleOption(option.value);
              }}
            >
              <span className="csv-db-dropdown-check">
                {isSelected ? "✓" : ""}
              </span>
              <Tag value={option.value} color={option.color || "gray"} />
            </div>
          );
        })}
        {search.trim() && !exactMatch && (
          <div
            className="csv-db-dropdown-item csv-db-dropdown-create"
            onClick={(e) => {
              e.stopPropagation();
              handleCreate();
            }}
          >
            Create &quot;{search.trim()}&quot;
          </div>
        )}
        {selected.size > 0 && (
          <div
            className="csv-db-dropdown-clear"
            onClick={(e) => {
              e.stopPropagation();
              handleClearAll();
            }}
          >
            Clear all
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
