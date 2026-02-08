import { ColumnDef, SelectOption } from "../types";
import { CheckboxCell } from "./CheckboxCell";
import { TextCell } from "./TextCell";
import { SelectCell } from "./SelectCell";
import { MultiSelectCell } from "./MultiSelectCell";

interface CellProps {
  value: string;
  column: ColumnDef;
  onChange: (value: string) => void;
  onAddOption: (option: SelectOption) => void;
}

export function Cell({ value, column, onChange, onAddOption }: CellProps) {
  if (column.type === "checkbox") {
    return (
      <td className="csv-db-cell">
        <CheckboxCell value={value} onChange={onChange} />
      </td>
    );
  }

  if (column.type === "select") {
    return (
      <SelectCell
        value={value}
        column={column}
        onChange={onChange}
        onAddOption={onAddOption}
      />
    );
  }

  if (column.type === "multiselect") {
    return (
      <MultiSelectCell
        value={value}
        column={column}
        onChange={onChange}
        onAddOption={onAddOption}
      />
    );
  }

  // text, number, date
  return (
    <TextCell value={value} column={column} onChange={onChange} />
  );
}
