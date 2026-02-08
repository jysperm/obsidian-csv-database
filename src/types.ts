export type ColumnType = "text" | "number" | "date" | "checkbox" | "select" | "multiselect";

export type TagColor = "gray" | "brown" | "orange" | "yellow" | "green" | "blue" | "purple" | "pink" | "red";

export interface SelectOption {
  value: string;
  color?: TagColor;
}

export interface ColumnDef {
  name: string;
  type: ColumnType;
  options?: SelectOption[];
  width?: number;
}

export interface DatabaseModel {
  columns: ColumnDef[];
  rows: string[][];
}
