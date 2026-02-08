import { ColumnDef, SelectOption } from "../types";
import { TableRow } from "./TableRow";

interface TableBodyProps {
  rows: string[][];
  columns: ColumnDef[];
  onSetCell: (rowIdx: number, colIdx: number, value: string) => void;
  onDeleteRow: (rowIdx: number) => void;
  onAddSelectOption: (colIdx: number, option: SelectOption) => void;
}

export function TableBody({
  rows,
  columns,
  onSetCell,
  onDeleteRow,
  onAddSelectOption,
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
        />
      ))}
    </tbody>
  );
}
