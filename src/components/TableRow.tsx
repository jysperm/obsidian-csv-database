import { DisplayColumn, SelectOption } from "../types";
import { Cell } from "./Cell";

interface TableRowProps {
  rowIdx: number;
  row: string[];
  displayColumns: DisplayColumn[];
  onSetCell: (rowIdx: number, colIdx: number, value: string) => void;
  onDeleteRow: (rowIdx: number) => void;
  onAddSelectOption: (colIdx: number, option: SelectOption) => void;
  onUpdateSelectOption: (colIdx: number, oldValue: string, newOption: SelectOption | null) => void;
  onRemoveOptionDef: (colIdx: number, value: string) => void;
}

export function TableRow({
  rowIdx,
  row,
  displayColumns,
  onSetCell,
  onDeleteRow,
  onAddSelectOption,
  onUpdateSelectOption,
  onRemoveOptionDef,
}: TableRowProps) {
  return (
    <tr className="csv-db-row">
      {displayColumns.map(({ col, dataIdx }) => (
        <Cell
          key={dataIdx}
          value={row[dataIdx] || ""}
          column={col}
          onChange={(value) => onSetCell(rowIdx, dataIdx, value)}
          onAddOption={(option) => onAddSelectOption(dataIdx, option)}
          onUpdateOption={(oldValue, newOption) => onUpdateSelectOption(dataIdx, oldValue, newOption)}
          onRemoveOptionDef={(value) => onRemoveOptionDef(dataIdx, value)}
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
