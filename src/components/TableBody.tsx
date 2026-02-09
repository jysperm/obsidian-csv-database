import { ColumnDef, SelectOption } from "../types";
import { TableRow } from "./TableRow";

interface TableBodyProps {
  rows: string[][];
  columns: ColumnDef[];
  onSetCell: (rowIdx: number, colIdx: number, value: string) => void;
  onDeleteRow: (rowIdx: number) => void;
  onAddSelectOption: (colIdx: number, option: SelectOption) => void;
  onUpdateSelectOption: (colIdx: number, oldValue: string, newOption: SelectOption | null) => void;
}

export function TableBody({
  rows,
  columns,
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
          columns={columns}
          onSetCell={onSetCell}
          onDeleteRow={onDeleteRow}
          onAddSelectOption={onAddSelectOption}
          onUpdateSelectOption={onUpdateSelectOption}
        />
      ))}
    </tbody>
  );
}
