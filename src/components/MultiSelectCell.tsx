import { useState, useRef } from "react";
import { ColumnDef, SelectOption } from "../types";
import { Tag } from "./Tag";
import { MultiSelectDropdown } from "./MultiSelectDropdown";

interface MultiSelectCellProps {
  value: string;
  column: ColumnDef;
  onChange: (value: string) => void;
  onAddOption: (option: SelectOption) => void;
}

export function MultiSelectCell({ value, column, onChange, onAddOption }: MultiSelectCellProps) {
  const [open, setOpen] = useState(false);
  const tdRef = useRef<HTMLTableCellElement>(null);

  const values = value ? value.split("|").filter(Boolean) : [];

  const handleClick = () => {
    if (!open) {
      setOpen(true);
    }
  };

  const handleCommit = (newValues: string[]) => {
    onChange(newValues.join("|"));
    setOpen(false);
  };

  return (
    <td className="csv-db-cell" onClick={handleClick} ref={tdRef}>
      {values.map((v) => {
        const option = column.options?.find((o) => o.value === v);
        return <Tag key={v} value={v} color={option?.color || "gray"} />;
      })}
      {open && tdRef.current && (
        <MultiSelectDropdown
          column={column}
          currentValues={values}
          anchorRect={tdRef.current.getBoundingClientRect()}
          onCommit={handleCommit}
          onCreateOption={onAddOption}
          onClose={() => setOpen(false)}
        />
      )}
    </td>
  );
}
