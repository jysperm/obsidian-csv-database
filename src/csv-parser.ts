import Papa from "papaparse";
import { ColumnDef, DatabaseModel, ViewDef } from "./types";

const DEFAULT_VIEW: ViewDef = { name: "Default", sorts: [], filters: [], hiddenColumns: [] };

export function parseCSV(csvText: string): DatabaseModel {
  const result = Papa.parse(csvText.trim(), {
    header: false,
    skipEmptyLines: true,
  });

  const rawRows = result.data as string[][];
  if (rawRows.length === 0) {
    return { columns: [], rows: [], views: [{ ...DEFAULT_VIEW }] };
  }

  const headerRow = rawRows[0];
  let views: ViewDef[] | null = null;

  const columns: ColumnDef[] = headerRow.map((cell, i) => {
    try {
      const def = JSON.parse(cell) as ColumnDef & { views?: ViewDef[] };
      if (!def.name) def.name = "Untitled";
      if (!def.type) def.type = "text";
      if (def.columnIndex == null) def.columnIndex = i;

      // Extract views from first column's header cell
      if (i === 0 && def.views) {
        views = def.views;
        delete def.views;
      }

      return def;
    } catch {
      return { name: cell || "Untitled", type: "text" as const, columnIndex: i };
    }
  });

  const rows = rawRows.slice(1).map((row) => {
    // Pad or trim row to match column count
    while (row.length < columns.length) {
      row.push("");
    }
    return row.slice(0, columns.length);
  });

  return { columns, rows, views: views ?? [{ ...DEFAULT_VIEW }] };
}

export function serializeCSV(model: DatabaseModel): string {
  const headerRow = model.columns.map((col, i) => {
    if (i === 0) {
      // Merge views into first column's header cell
      return JSON.stringify({ ...col, views: model.views });
    }
    return JSON.stringify(col);
  });

  const allRows = [headerRow, ...model.rows];

  return Papa.unparse(allRows, {
    header: false,
    newline: "\n",
  }) + "\n";
}
