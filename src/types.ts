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
  columnIndex?: number;
  wrapContent?: boolean;
}

export interface DisplayColumn {
  col: ColumnDef;
  dataIdx: number;
}

export interface SortRule {
  column: string;
  direction: "asc" | "desc";
}

export type FilterOperator = "contains" | "does-not-contain" | "is-empty" | "is-not-empty";

export interface FilterRule {
  column: string;
  operator: FilterOperator;
  value: string[];
}

export interface ViewDef {
  name: string;
  sorts: SortRule[];
  filters: FilterRule[];
  hiddenColumns: string[];
}

export interface DatabaseModel {
  columns: ColumnDef[];
  rows: string[][];
  views: ViewDef[];
}
