import { useState, useEffect } from "react";
import { ViewDef, ColumnDef, FilterRule, FilterOperator } from "../types";
import { getTypeIcon } from "../constants";

interface FilterEditorProps {
  activeView: ViewDef;
  columns: ColumnDef[];
  onUpdateFilters: (filters: FilterRule[]) => void;
}

function FilterValueInput({
  filter,
  column,
  onUpdateValue,
}: {
  filter: FilterRule;
  column: ColumnDef | undefined;
  onUpdateValue: (value: string[]) => void;
}) {
  const [inputText, setInputText] = useState(filter.value.join(", "));

  useEffect(() => {
    setInputText(filter.value.join(", "));
  }, [filter.column, filter.operator]);

  if (filter.operator === "is-empty" || filter.operator === "is-not-empty") {
    return null;
  }

  if (column && (column.type === "select" || column.type === "multiselect") && column.options) {
    return (
      <div className="csv-db-filter-value-options">
        {column.options.map((opt) => {
          const isSelected = filter.value.includes(opt.value);
          return (
            <label key={opt.value} className="csv-db-filter-option-label">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => {
                  const newValue = isSelected
                    ? filter.value.filter((v) => v !== opt.value)
                    : [...filter.value, opt.value];
                  onUpdateValue(newValue);
                }}
              />
              <span>{opt.value}</span>
            </label>
          );
        })}
      </div>
    );
  }

  return (
    <input
      className="csv-db-popover-input"
      placeholder="Value..."
      value={inputText}
      onChange={(e) => {
        setInputText(e.target.value);
        const values = e.target.value
          .split(",")
          .map((v) => v.trim())
          .filter((v) => v !== "");
        onUpdateValue(values);
      }}
    />
  );
}

export function FilterEditor({ activeView, columns, onUpdateFilters }: FilterEditorProps) {
  const filters = activeView.filters;

  const addFilter = () => {
    const first = columns[0];
    if (!first) return;
    onUpdateFilters([...filters, { column: first.name, operator: "contains", value: [] }]);
  };

  const removeFilter = (index: number) => {
    onUpdateFilters(filters.filter((_, i) => i !== index));
  };

  const updateFilter = (index: number, update: Partial<FilterRule>) => {
    onUpdateFilters(filters.map((f, i) => {
      if (i !== index) return f;
      const updated = { ...f, ...update };
      // Clear value when switching to is-empty/is-not-empty
      if (update.operator === "is-empty" || update.operator === "is-not-empty") {
        updated.value = [];
      }
      return updated;
    }));
  };

  const clearAll = () => {
    onUpdateFilters([]);
  };

  return (
    <div className="csv-db-popover csv-db-filter-editor" onClick={(e) => e.stopPropagation()}>
      {filters.length === 0 ? (
        <div className="csv-db-popover-empty">No filters applied</div>
      ) : (
        <div className="csv-db-filter-list">
          {filters.map((filter, i) => {
            const column = columns.find((c) => c.name === filter.column);
            return (
              <div key={i} className="csv-db-filter-rule">
                <span className="csv-db-filter-connector">
                  {i === 0 ? "Where" : "And"}
                </span>
                <select
                  className="csv-db-popover-select"
                  value={filter.column}
                  onChange={(e) => updateFilter(i, { column: e.target.value, value: [] })}
                >
                  {columns.map((col) => (
                    <option key={col.name} value={col.name}>
                      {getTypeIcon(col.type)} {col.name}
                    </option>
                  ))}
                </select>
                <select
                  className="csv-db-popover-select"
                  value={filter.operator}
                  onChange={(e) => updateFilter(i, { operator: e.target.value as FilterOperator })}
                >
                  <option value="contains">Contains</option>
                  <option value="does-not-contain">Does not contain</option>
                  <option value="is-empty">Is empty</option>
                  <option value="is-not-empty">Is not empty</option>
                </select>
                <FilterValueInput
                  filter={filter}
                  column={column}
                  onUpdateValue={(value) => updateFilter(i, { value })}
                />
                <button className="csv-db-popover-remove" onClick={() => removeFilter(i)}>✕</button>
              </div>
            );
          })}
        </div>
      )}
      <div className="csv-db-popover-actions">
        <button className="csv-db-popover-btn" onClick={addFilter}>+ Add filter rule</button>
        {filters.length > 0 && (
          <button className="csv-db-popover-btn csv-db-popover-btn-danger" onClick={clearAll}>Delete filter</button>
        )}
      </div>
    </div>
  );
}
