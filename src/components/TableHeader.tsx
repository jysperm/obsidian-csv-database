import { App } from "obsidian";
import { ColumnDef, DatabaseModel } from "../types";
import { getTypeIcon } from "../constants";

interface TableHeaderProps {
  columns: ColumnDef[];
  model: DatabaseModel;
  app: App;
  onResizeStart: (colIdx: number, e: React.MouseEvent) => void;
  consumeJustResized: () => boolean;
  onAddColumn: () => void;
  onColumnClick: (colIdx: number) => void;
}

export function TableHeader({
  columns,
  onResizeStart,
  consumeJustResized,
  onAddColumn,
  onColumnClick,
}: TableHeaderProps) {
  return (
    <thead>
      <tr>
        {columns.map((col, colIdx) => (
          <th
            key={colIdx}
            className="csv-db-header-cell"
            onClick={() => {
              if (consumeJustResized()) return;
              onColumnClick(colIdx);
            }}
          >
            <span className="csv-db-header-icon">{getTypeIcon(col.type)}</span>
            <span className="csv-db-header-name">{col.name}</span>
            <div
              className="csv-db-resize-handle"
              onMouseDown={(e) => onResizeStart(colIdx, e)}
            />
          </th>
        ))}
        <th className="csv-db-add-column-cell">
          <button
            className="csv-db-add-column-btn"
            onClick={(e) => {
              e.stopPropagation();
              onAddColumn();
            }}
          >
            +
          </button>
        </th>
      </tr>
    </thead>
  );
}
