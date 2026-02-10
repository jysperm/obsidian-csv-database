import { DisplayColumn } from "../types";
import { getTypeIcon } from "../constants";
import { DragState } from "../hooks/useColumnDrag";

interface TableHeaderProps {
  displayColumns: DisplayColumn[];
  onResizeStart: (colIdx: number, e: React.MouseEvent) => void;
  consumeJustResized: () => boolean;
  onAddColumn: () => void;
  onColumnClick: (dataIdx: number) => void;
  onDragStart: (displayIdx: number, e: React.MouseEvent) => void;
  consumeJustDragged: () => boolean;
  dragState: DragState;
}

export function TableHeader({
  displayColumns,
  onResizeStart,
  consumeJustResized,
  onAddColumn,
  onColumnClick,
  onDragStart,
  consumeJustDragged,
  dragState,
}: TableHeaderProps) {
  return (
    <thead>
      <tr>
        {displayColumns.map(({ col, dataIdx }, displayIdx) => {
          const isDragged = dragState.isDragging && dragState.dragColIdx === displayIdx;

          return (
            <th
              key={dataIdx}
              className={`csv-db-header-cell${isDragged ? " csv-db-header-dragging" : ""}`}
              onMouseDown={(e) => {
                onDragStart(displayIdx, e);
              }}
              onClick={() => {
                if (consumeJustResized()) return;
                if (consumeJustDragged()) return;
                onColumnClick(dataIdx);
              }}
            >
              <span className="csv-db-header-icon">{getTypeIcon(col.type)}</span>
              <span className="csv-db-header-name">{col.name}</span>
              <div
                className="csv-db-resize-handle"
                onMouseDown={(e) => onResizeStart(displayIdx, e)}
              />
            </th>
          );
        })}
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
