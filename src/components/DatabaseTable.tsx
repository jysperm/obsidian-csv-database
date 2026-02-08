import { useReducer, useEffect, useRef, useCallback } from "react";
import { App } from "obsidian";
import { DatabaseModel, ColumnDef, ColumnType, SelectOption } from "../types";
import { TableHeader } from "./TableHeader";
import { TableBody } from "./TableBody";
import { NewRowButton } from "./NewRowButton";
import { ColumnModalWrapper } from "./ColumnModal";
import { useColumnResize } from "../hooks/useColumnResize";

type Action =
  | { type: "SET_MODEL"; model: DatabaseModel; fromExternal?: boolean }
  | { type: "SET_CELL"; rowIdx: number; colIdx: number; value: string }
  | { type: "ADD_ROW" }
  | { type: "DELETE_ROW"; rowIdx: number }
  | { type: "ADD_COLUMN"; column: ColumnDef }
  | { type: "DELETE_COLUMN"; colIdx: number }
  | { type: "UPDATE_COLUMN"; colIdx: number; name: string; colType: ColumnType; options: SelectOption[] }
  | { type: "SET_COLUMN_WIDTH"; colIdx: number; width: number }
  | { type: "ADD_SELECT_OPTION"; colIdx: number; option: SelectOption };

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
      const columns = [...state.columns, action.column];
      const rows = state.rows.map((row) => [...row, ""]);
      return { columns, rows };
    }

    case "DELETE_COLUMN": {
      const columns = state.columns.filter((_, i) => i !== action.colIdx);
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

  const handleResizeEnd = useCallback((colIdx: number, width: number) => {
    dispatch({ type: "SET_COLUMN_WIDTH", colIdx, width });
  }, []);

  const { colGroupRef, tableRef, onResizeStart, consumeJustResized } =
    useColumnResize({ onResizeEnd: handleResizeEnd });

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

  const handleColumnClick = useCallback(
    (colIdx: number) => {
      const col = model.columns[colIdx];
      const modal = new ColumnModalWrapper(
        app,
        col,
        (name, colType, options) => {
          dispatch({ type: "UPDATE_COLUMN", colIdx, name, colType, options });
        },
        () => {
          dispatch({ type: "DELETE_COLUMN", colIdx });
        }
      );
      modal.open();
    },
    [app, model.columns]
  );

  // Compute total table width and render colgroup
  let totalWidth = 0;
  for (const col of model.columns) {
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
          {model.columns.map((col, i) => (
            <col key={i} style={{ width: `${col.width ?? 180}px` }} />
          ))}
          <col style={{ width: "32px" }} />
        </colgroup>
        <TableHeader
          columns={model.columns}
          model={model}
          app={app}
          onResizeStart={onResizeStart}
          consumeJustResized={consumeJustResized}
          onAddColumn={handleAddColumn}
          onColumnClick={handleColumnClick}
        />
        <TableBody
          rows={model.rows}
          columns={model.columns}
          onSetCell={handleSetCell}
          onDeleteRow={handleDeleteRow}
          onAddSelectOption={handleAddSelectOption}
        />
      </table>
      <NewRowButton onAddRow={handleAddRow} />
    </div>
  );
}
