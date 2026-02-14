import { ViewDef, ColumnDef, SortRule } from "../types";
import { getTypeIcon } from "../constants";

interface SortEditorProps {
  activeView: ViewDef;
  columns: ColumnDef[];
  onUpdateSorts: (sorts: SortRule[]) => void;
}

export function SortEditor({ activeView, columns, onUpdateSorts }: SortEditorProps) {
  const sorts = activeView.sorts;

  const addSort = () => {
    // Pick first column not already used, or first column
    const usedCols = new Set(sorts.map((s) => s.column));
    const available = columns.find((c) => !usedCols.has(c.name)) || columns[0];
    if (!available) return;
    onUpdateSorts([...sorts, { column: available.name, direction: "asc" }]);
  };

  const removeSort = (index: number) => {
    onUpdateSorts(sorts.filter((_, i) => i !== index));
  };

  const updateSort = (index: number, update: Partial<SortRule>) => {
    onUpdateSorts(sorts.map((s, i) => (i === index ? { ...s, ...update } : s)));
  };

  const clearAll = () => {
    onUpdateSorts([]);
  };

  return (
    <div className="csv-db-popover csv-db-sort-editor" onClick={(e) => e.stopPropagation()}>
      {sorts.length === 0 ? (
        <div className="csv-db-popover-empty">No sorts applied</div>
      ) : (
        <div className="csv-db-sort-list">
          {sorts.map((sort, i) => (
            <div key={i} className="csv-db-sort-rule">
              <select
                className="csv-db-popover-select"
                value={sort.column}
                onChange={(e) => updateSort(i, { column: e.target.value })}
              >
                {columns.map((col) => (
                  <option key={col.name} value={col.name}>
                    {getTypeIcon(col.type)} {col.name}
                  </option>
                ))}
              </select>
              <select
                className="csv-db-popover-select csv-db-popover-select-direction"
                value={sort.direction}
                onChange={(e) => updateSort(i, { direction: e.target.value as "asc" | "desc" })}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
              <button className="csv-db-popover-remove" onClick={() => removeSort(i)}>✕</button>
            </div>
          ))}
        </div>
      )}
      <div className="csv-db-popover-actions">
        <button className="csv-db-popover-btn" onClick={addSort}>+ Add sort</button>
        {sorts.length > 0 && (
          <button className="csv-db-popover-btn csv-db-popover-btn-danger" onClick={clearAll}>Delete sort</button>
        )}
      </div>
    </div>
  );
}
