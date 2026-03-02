import { ColumnDef, DisplayColumn } from "../types";
import { splitMultiSelect } from "../csv-parser";
import { Tag } from "./Tag";

interface KanbanCardProps {
  row: string[];
  originalIndex: number;
  displayColumns: DisplayColumn[];
  groupByDataIdx: number;
  onDeleteRow: (rowIdx: number) => void;
  onMouseDown: (e: React.MouseEvent, rowOriginalIndex: number) => void;
}

function renderCardProperty(value: string, col: ColumnDef): React.ReactNode {
  if (!value) return null;

  if (col.type === "select") {
    const opt = col.options?.find((o) => o.value === value);
    return <Tag value={value} color={opt?.color || "gray"} />;
  }

  if (col.type === "multiselect") {
    const values = splitMultiSelect(value);
    if (values.length === 0) return null;
    return (
      <span className="csv-db-kanban-card-tags">
        {values.map((v) => {
          const opt = col.options?.find((o) => o.value === v);
          return <Tag key={v} value={v} color={opt?.color || "gray"} />;
        })}
      </span>
    );
  }

  if (col.type === "checkbox") {
    return <span>{value === "true" ? "☑" : "☐"}</span>;
  }

  return <span>{value}</span>;
}

export function KanbanCard({
  row,
  originalIndex,
  displayColumns,
  groupByDataIdx,
  onDeleteRow,
  onMouseDown,
}: KanbanCardProps) {
  const visibleColumns = displayColumns.filter((dc) => dc.dataIdx !== groupByDataIdx);
  const titleCol = visibleColumns[0];
  const propertyColumns = visibleColumns.slice(1);

  // Title: render with type awareness — use plain text for text-like types, Tag for select types
  const titleIsPlainText = titleCol && (titleCol.col.type === "text" || titleCol.col.type === "number" || titleCol.col.type === "date" || titleCol.col.type === "note");
  const titleValue = titleCol ? row[titleCol.dataIdx] : "";

  return (
    <div
      className="csv-db-kanban-card"
      data-row-index={originalIndex}
      onMouseDown={(e) => onMouseDown(e, originalIndex)}
    >
      {titleIsPlainText ? (
        <div className="csv-db-kanban-card-title">{titleValue || "Untitled"}</div>
      ) : titleCol ? (
        <div className="csv-db-kanban-card-prop">{renderCardProperty(titleValue, titleCol.col)}</div>
      ) : (
        <div className="csv-db-kanban-card-title">Untitled</div>
      )}
      {propertyColumns.map(({ col, dataIdx }) => {
        const value = row[dataIdx];
        const rendered = renderCardProperty(value, col);
        if (!rendered) return null;
        return (
          <div key={col.name} className="csv-db-kanban-card-prop">
            {rendered}
          </div>
        );
      })}
      <div
        className="csv-db-kanban-card-delete"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onDeleteRow(originalIndex);
        }}
      >
        ✕
      </div>
    </div>
  );
}
