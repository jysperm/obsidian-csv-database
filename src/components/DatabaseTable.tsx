import { useReducer, useEffect, useRef, useCallback, useMemo } from "react";
import { App } from "obsidian";
import { DatabaseModel, ColumnDef, ColumnType, SelectOption, DisplayColumn } from "../types";
import { TableHeader } from "./TableHeader";
import { TableBody } from "./TableBody";
import { NewRowButton } from "./NewRowButton";
import { ColumnModalWrapper } from "./ColumnModal";
import { useColumnResize } from "../hooks/useColumnResize";
import { useColumnDrag } from "../hooks/useColumnDrag";

type Action =
  | { type: "SET_MODEL"; model: DatabaseModel; fromExternal?: boolean }
  | { type: "SET_CELL"; rowIdx: number; colIdx: number; value: string }
  | { type: "ADD_ROW" }
  | { type: "DELETE_ROW"; rowIdx: number }
  | { type: "ADD_COLUMN"; column: ColumnDef }
  | { type: "DELETE_COLUMN"; colIdx: number }
  | { type: "UPDATE_COLUMN"; colIdx: number; name: string; colType: ColumnType; options: SelectOption[]; wrapContent: boolean }
  | { type: "SET_COLUMN_WIDTH"; colIdx: number; width: number }
  | { type: "ADD_SELECT_OPTION"; colIdx: number; option: SelectOption }
  | { type: "UPDATE_SELECT_OPTION"; colIdx: number; oldValue: string; newOption: SelectOption | null }
  | { type: "REORDER_COLUMN"; dataIdx1: number; dataIdx2: number };

function databaseReducer(state: DatabaseModel, action: Action): DatabaseModel {
  switch (action.type) {
    case "SET_MODEL":
      return action.model;

    case "SET_CELL": {
      const rows = state.rows.map((row, ri) =>
        ri === action.rowIdx
          ? row.map((cell, ci) => (ci === action.colIdx ? action.value : cell))
          : row
      );
      return { ...state, rows };
    }

    case "ADD_ROW": {
      const emptyRow = new Array(state.columns.length).fill("");
      return { ...state, rows: [...state.rows, emptyRow] };
    }

    case "DELETE_ROW": {
      const rows = state.rows.filter((_, i) => i !== action.rowIdx);
      return { ...state, rows };
    }

    case "ADD_COLUMN": {
      const maxColumnIndex = state.columns.reduce(
        (max, col) => Math.max(max, col.columnIndex ?? 0),
        -1
      );
      const columns = [...state.columns, { ...action.column, columnIndex: maxColumnIndex + 1 }];
      const rows = state.rows.map((row) => [...row, ""]);
      return { columns, rows };
    }

    case "DELETE_COLUMN": {
      const deletedColumnIndex = state.columns[action.colIdx].columnIndex!;
      const columns = state.columns
        .filter((_, i) => i !== action.colIdx)
        .map((col) => ({
          ...col,
          columnIndex: col.columnIndex! > deletedColumnIndex ? col.columnIndex! - 1 : col.columnIndex!,
        }));
      const rows = state.rows.map((row) => row.filter((_, i) => i !== action.colIdx));
      return { columns, rows };
    }

    case "UPDATE_COLUMN": {
      const columns = state.columns.map((col, i) => {
        if (i !== action.colIdx) return col;
        const updated: ColumnDef = {
          ...col,
          name: action.name || "Untitled",
          type: action.colType,
          wrapContent: action.wrapContent || undefined,
        };
        if (action.colType === "select" || action.colType === "multiselect") {
          updated.options = action.options.filter((o) => o.value.trim() !== "");
        } else {
          delete updated.options;
        }
        return updated;
      });
      return { ...state, columns };
    }

    case "SET_COLUMN_WIDTH": {
      const columns = state.columns.map((col, i) =>
        i === action.colIdx ? { ...col, width: action.width } : col
      );
      return { ...state, columns };
    }

    case "ADD_SELECT_OPTION": {
      const columns = state.columns.map((col, i) => {
        if (i !== action.colIdx) return col;
        const options = [...(col.options || []), action.option];
        return { ...col, options };
      });
      return { ...state, columns };
    }

    case "UPDATE_SELECT_OPTION": {
      const { colIdx, oldValue, newOption } = action;
      const col = state.columns[colIdx];
      const colType = col.type;

      // Update column options
      let newOptions: SelectOption[];
      if (newOption === null) {
        // Delete
        newOptions = (col.options || []).filter((o) => o.value !== oldValue);
      } else {
        newOptions = (col.options || []).map((o) =>
          o.value === oldValue ? newOption : o
        );
      }
      const columns = state.columns.map((c, i) =>
        i === colIdx ? { ...c, options: newOptions } : c
      );

      // Update row data if renamed or deleted
      const renamed = newOption !== null && newOption.value !== oldValue;
      const deleted = newOption === null;
      if (!renamed && !deleted) {
        return { ...state, columns };
      }

      const rows = state.rows.map((row) => {
        const cell = row[colIdx];
        if (!cell) return row;

        let newCell: string;
        if (colType === "multiselect") {
          const parts = cell.split("|");
          const updated = deleted
            ? parts.filter((p) => p !== oldValue)
            : parts.map((p) => (p === oldValue ? newOption!.value : p));
          newCell = updated.join("|");
        } else {
          if (cell === oldValue) {
            newCell = deleted ? "" : newOption!.value;
          } else {
            newCell = cell;
          }
        }

        if (newCell === cell) return row;
        return row.map((c, ci) => (ci === colIdx ? newCell : c));
      });

      return { columns, rows };
    }

    case "REORDER_COLUMN": {
      const { dataIdx1, dataIdx2 } = action;
      const ci1 = state.columns[dataIdx1].columnIndex!;
      const ci2 = state.columns[dataIdx2].columnIndex!;
      const columns = state.columns.map((col, i) => {
        if (i === dataIdx1) return { ...col, columnIndex: ci2 };
        if (i === dataIdx2) return { ...col, columnIndex: ci1 };
        return col;
      });
      return { ...state, columns };
    }

    default:
      return state;
  }
}

interface DatabaseTableProps {
  initialModel: DatabaseModel;
  onModelChange: (model: DatabaseModel) => void;
  setModelSetter: (setter: (model: DatabaseModel) => void) => void;
  app: App;
}

export function DatabaseTable({
  initialModel,
  onModelChange,
  setModelSetter,
  app,
}: DatabaseTableProps) {
  const [model, dispatch] = useReducer(databaseReducer, initialModel);
  const isExternalUpdate = useRef(false);
  const prevModelRef = useRef(model);

  // Compute display order: columns sorted by columnIndex
  const displayColumns: DisplayColumn[] = useMemo(
    () =>
      model.columns
        .map((col, i) => ({ col, dataIdx: i }))
        .sort((a, b) => (a.col.columnIndex ?? 0) - (b.col.columnIndex ?? 0)),
    [model.columns]
  );

  // Ref for stable access in callbacks
  const displayColumnsRef = useRef(displayColumns);
  displayColumnsRef.current = displayColumns;

  // Register setter for external model pushes (from setViewData)
  useEffect(() => {
    setModelSetter((newModel: DatabaseModel) => {
      isExternalUpdate.current = true;
      dispatch({ type: "SET_MODEL", model: newModel });
    });
  }, [setModelSetter]);

  // Notify parent of changes (skip external updates to avoid write-back loop)
  useEffect(() => {
    if (isExternalUpdate.current) {
      isExternalUpdate.current = false;
      prevModelRef.current = model;
      return;
    }
    if (model !== prevModelRef.current) {
      prevModelRef.current = model;
      onModelChange(model);
    }
  }, [model, onModelChange]);

  const handleResizeEnd = useCallback((displayIdx: number, width: number) => {
    const dataIdx = displayColumnsRef.current[displayIdx].dataIdx;
    dispatch({ type: "SET_COLUMN_WIDTH", colIdx: dataIdx, width });
  }, []);

  const { colGroupRef, tableRef, onResizeStart, consumeJustResized } =
    useColumnResize({ onResizeEnd: handleResizeEnd });

  const handleReorderColumn = useCallback((fromDisplayIdx: number, toDisplayIdx: number) => {
    const dc = displayColumnsRef.current;
    const insertIdx = toDisplayIdx > fromDisplayIdx ? toDisplayIdx - 1 : toDisplayIdx;
    const dataIdx1 = dc[fromDisplayIdx].dataIdx;
    const dataIdx2 = dc[insertIdx].dataIdx;
    dispatch({ type: "REORDER_COLUMN", dataIdx1, dataIdx2 });
  }, []);

  const { dragState, onDragStart, consumeJustDragged } =
    useColumnDrag({ onReorder: handleReorderColumn, tableRef });

  const handleSetCell = useCallback((rowIdx: number, colIdx: number, value: string) => {
    dispatch({ type: "SET_CELL", rowIdx, colIdx, value });
  }, []);

  const handleDeleteRow = useCallback((rowIdx: number) => {
    dispatch({ type: "DELETE_ROW", rowIdx });
  }, []);

  const handleAddRow = useCallback(() => {
    dispatch({ type: "ADD_ROW" });
  }, []);

  const handleAddColumn = useCallback(() => {
    dispatch({ type: "ADD_COLUMN", column: { name: "New Column", type: "text" } });
  }, []);

  const handleAddSelectOption = useCallback((colIdx: number, option: SelectOption) => {
    dispatch({ type: "ADD_SELECT_OPTION", colIdx, option });
  }, []);

  const handleUpdateSelectOption = useCallback((colIdx: number, oldValue: string, newOption: SelectOption | null) => {
    dispatch({ type: "UPDATE_SELECT_OPTION", colIdx, oldValue, newOption });
  }, []);

  const handleColumnClick = useCallback(
    (dataIdx: number) => {
      const col = model.columns[dataIdx];
      const modal = new ColumnModalWrapper(
        app,
        col,
        (name, colType, options, wrapContent) => {
          dispatch({ type: "UPDATE_COLUMN", colIdx: dataIdx, name, colType, options, wrapContent });
        },
        () => {
          dispatch({ type: "DELETE_COLUMN", colIdx: dataIdx });
        }
      );
      modal.open();
    },
    [app, model.columns]
  );

  // Compute total table width from display order
  let totalWidth = 0;
  for (const { col } of displayColumns) {
    totalWidth += col.width ?? 180;
  }
  totalWidth += 32; // add-column button width

  return (
    <div className="csv-db-wrapper">
      <table
        className="csv-db-table"
        ref={tableRef}
        style={{ width: `${totalWidth}px` }}
      >
        <colgroup ref={colGroupRef}>
          {displayColumns.map(({ col }, i) => (
            <col key={i} style={{ width: `${col.width ?? 180}px` }} />
          ))}
          <col style={{ width: "32px" }} />
        </colgroup>
        <TableHeader
          displayColumns={displayColumns}
          onResizeStart={onResizeStart}
          consumeJustResized={consumeJustResized}
          onAddColumn={handleAddColumn}
          onColumnClick={handleColumnClick}
          onDragStart={onDragStart}
          consumeJustDragged={consumeJustDragged}
          dragState={dragState}
        />
        <TableBody
          rows={model.rows}
          displayColumns={displayColumns}
          onSetCell={handleSetCell}
          onDeleteRow={handleDeleteRow}
          onAddSelectOption={handleAddSelectOption}
          onUpdateSelectOption={handleUpdateSelectOption}
        />
      </table>
      <NewRowButton onAddRow={handleAddRow} />
    </div>
  );
}
