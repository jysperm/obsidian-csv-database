import Papa from "papaparse";
import { ColumnDef, DatabaseModel } from "./types";

export function parseCSV(csvText: string): DatabaseModel {
  const result = Papa.parse(csvText.trim(), {
    header: false,
    skipEmptyLines: true,
  });

  const rawRows = result.data as string[][];
  if (rawRows.length === 0) {
    return { columns: [], rows: [] };
  }

  const headerRow = rawRows[0];
  const columns: ColumnDef[] = headerRow.map((cell, i) => {
    try {
      const def = JSON.parse(cell) as ColumnDef;
      if (!def.name) def.name = "Untitled";
      if (!def.type) def.type = "text";
      if (def.columnIndex == null) def.columnIndex = i;
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

  return { columns, rows };
}

export function serializeCSV(model: DatabaseModel): string {
  const headerRow = model.columns.map((col) => JSON.stringify(col));

  const allRows = [headerRow, ...model.rows];

  return Papa.unparse(allRows, {
    header: false,
    newline: "\n",
  }) + "\n";
}
