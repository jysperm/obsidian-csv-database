import { ColumnDef, SelectOption } from "../types";
import { Cell } from "./Cell";

interface TableRowProps {
  rowIdx: number;
  row: string[];
  columns: ColumnDef[];
  onSetCell: (rowIdx: number, colIdx: number, value: string) => void;
  onDeleteRow: (rowIdx: number) => void;
  onAddSelectOption: (colIdx: number, option: SelectOption) => void;
}

export function TableRow({
  rowIdx,
  row,
  columns,
  onSetCell,
  onDeleteRow,
  onAddSelectOption,
}: TableRowProps) {
  return (
    <tr className="csv-db-row">
      {columns.map((col, colIdx) => (
        <Cell
          key={colIdx}
          value={row[colIdx] || ""}
          column={col}
          onChange={(value) => onSetCell(rowIdx, colIdx, value)}
          onAddOption={(option) => onAddSelectOption(colIdx, option)}
        />
      ))}
      <td className="csv-db-cell csv-db-cell-spacer" />
      <td className="csv-db-row-action">
        <span
          className="csv-db-row-delete"
          onClick={() => onDeleteRow(rowIdx)}
        >
          ✕
        </span>
      </td>
    </tr>
  );
}
