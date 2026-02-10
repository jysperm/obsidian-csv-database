import { DisplayColumn, SelectOption } from "../types";
import { TableRow } from "./TableRow";

interface TableBodyProps {
  rows: string[][];
  displayColumns: DisplayColumn[];
  onSetCell: (rowIdx: number, colIdx: number, value: string) => void;
  onDeleteRow: (rowIdx: number) => void;
  onAddSelectOption: (colIdx: number, option: SelectOption) => void;
  onUpdateSelectOption: (colIdx: number, oldValue: string, newOption: SelectOption | null) => void;
}

export function TableBody({
  rows,
  displayColumns,
  onSetCell,
  onDeleteRow,
  onAddSelectOption,
  onUpdateSelectOption,
}: TableBodyProps) {
  return (
    <tbody>
      {rows.map((row, rowIdx) => (
        <TableRow
          key={rowIdx}
          rowIdx={rowIdx}
          row={row}
          displayColumns={displayColumns}
          onSetCell={onSetCell}
          onDeleteRow={onDeleteRow}
          onAddSelectOption={onAddSelectOption}
          onUpdateSelectOption={onUpdateSelectOption}
        />
      ))}
    </tbody>
  );
}
