import { useState, useRef } from "react";
import { ColumnDef } from "../types";
import { useApp } from "../AppContext";
import { NoteDropdown } from "./NoteDropdown";

interface NoteCellProps {
  value: string;
  column: ColumnDef;
  onChange: (value: string) => void;
}

export function NoteCell({ value, column, onChange }: NoteCellProps) {
  const [open, setOpen] = useState(false);
  const tdRef = useRef<HTMLTableCellElement>(null);
  const app = useApp();

  const handleClick = () => {
    if (!open) {
      setOpen(true);
    }
  };

  const handleSelect = (newValue: string) => {
    onChange(newValue);
    setOpen(false);
  };

  const basename = value ? value.replace(/\.md$/, "").split("/").pop() : "";

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (value) {
      app.workspace.openLinkText(value, "");
    }
  };

  return (
    <td
      className={`csv-db-cell${column.wrapContent ? " csv-db-cell-wrap" : ""}`}
      onClick={handleClick}
      ref={tdRef}
    >
      {value && (
        <span className="csv-db-note-cell-content">
          <span className="csv-db-note-cell-icon">📄</span>
          <span className="csv-db-note-cell-name">{basename}</span>
          <button className="csv-db-note-open-btn" onClick={handleOpen}>
            OPEN
          </button>
        </span>
      )}
      {open && tdRef.current && (
        <NoteDropdown
          currentValue={value}
          anchorRect={tdRef.current.getBoundingClientRect()}
          onSelect={handleSelect}
          onClose={() => setOpen(false)}
        />
      )}
    </td>
  );
}
