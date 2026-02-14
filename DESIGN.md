# CSV Database Plugin

## .csvdb File Format

### Header Row

The first row contains column definitions. Each cell is a JSON object. The first cell also carries the `views` array (see ViewDef below).

```
"{""name"":""Title"",""type"":""text"",""views"":[...]}","{""name"":""Status"",""type"":""select"",""options"":[{""value"":""Todo"",""color"":""red""},{""value"":""Done"",""color"":""green""}]}"
```

### ColumnDef Schema

```typescript
interface ColumnDef {
  name: string;
  type: "text" | "number" | "date" | "checkbox" | "select" | "multiselect";
  options?: Array<{ value: string; color?: string }>;
  width?: number;         // column width in pixels, default 180
  columnIndex?: number;   // display order, defaults to positional index
  wrapContent?: boolean;  // wrap cell content to multiple lines, default false
}
```

Color values: `gray`, `brown`, `orange`, `yellow`, `green`, `blue`, `purple`, `pink`, `red`.

### ViewDef Schema

The `views` array is stored in the first column's header cell JSON alongside the column definition. On parse, `views` is extracted and stored in `DatabaseModel.views`, then stripped from the `ColumnDef`. On serialize, `views` is merged back into the first column's JSON. If no `views` field is found (backward compatibility), a default view `[{ name: "Default", sorts: [], filters: [], hiddenColumns: [] }]` is created.

```typescript
interface SortRule {
  column: string;       // column name
  direction: "asc" | "desc";
}

type FilterOperator = "contains" | "does-not-contain" | "is-empty" | "is-not-empty";

interface FilterRule {
  column: string;       // column name
  operator: FilterOperator;
  value: string[];      // for contains/does-not-contain; array of values to match against
}

interface ViewDef {
  name: string;
  sorts: SortRule[];
  filters: FilterRule[];
  hiddenColumns: string[];  // column names to hide
}
```

### Data Storage by Type

| Type        | Storage Format                          | Example            |
| ----------- | --------------------------------------- | ------------------ |
| text        | Plain text                              | `Hello world`      |
| number      | Numeric string                          | `42.5`             |
| date        | ISO 8601 date                           | `2024-01-15`       |
| checkbox    | `true` / `false`                        | `true`             |
| select      | Option value string                     | `Todo`             |
| multiselect | Pipe-separated values                   | `Tag1\|Tag2\|Tag3` |

See the `examples/` directory for sample `.csvdb` files.

## Core Architecture

`DatabasePlugin` (`main.ts`) registers the view type and file extension. `DatabaseView` (`database-view.ts`) extends Obsidian's `TextFileView`, bridging file I/O with a React component tree mounted via `createRoot`. `csv-parser.ts` handles CSV parsing/serialization using PapaParse.

The React UI is rooted in `DatabaseTable`, which uses `useReducer` to manage the `DatabaseModel` state. Obsidian pushes data in via `setViewData` → `parseCSV` → dispatch; user edits dispatch actions that flow back via `onModelChange` → `requestSave` → `serializeCSV`.

### Column Display Order

Each `ColumnDef` has a `columnIndex` field that determines its display position. The column and row data order in the CSV file never changes — `rows[r][i]` always corresponds to `columns[i]`. Dragging columns only swaps `columnIndex` values; `serializeCSV` writes columns and rows in their original array order.

`DatabaseTable` computes a `displayColumns: DisplayColumn[]` (sorted by `columnIndex`) for rendering. All UI components receive `displayColumns` and use `dataIdx` (the column's index in the data array) for data operations, and the rendering loop index for DOM operations (resize, drag).

On parse, if a column has no `columnIndex` in its JSON (e.g. files created before this feature), it defaults to the positional index.

### Column Drag-to-Reorder

Drag interaction is handled by `useColumnDrag` hook. Mousedown on a header cell + 5px drag threshold enters drag mode. Columns swap in real-time as the cursor crosses the current column's boundary, with a 150ms CSS transform animation (slide) before each data commit. A direction lock prevents jitter when columns have different widths. `flushSync` ensures no visual flash between clearing transforms and committing the React state update.

### Wrap Content

Each column has an optional `wrapContent` flag. When enabled, cell content wraps to multiple lines and rows auto-expand in height. When disabled (default), content is clipped at the cell boundary (`text-overflow: clip`).

Wrap cells use adjusted padding (`4px` vertical vs the default `6px`) with `margin-top/bottom: 2px` on tags, so that a single-line wrap cell still matches the standard `32px` row height. Multi-line rows get `4px` vertical gap between tag lines. All cells use `vertical-align: top` so content aligns to the top when other cells in the same row cause it to expand.

### Deleting Columns and Options

Deleting a column shows a confirmation modal explaining the column and all its data will be permanently removed.

Deleting a select/multiselect option (from the column edit modal or from the cell dropdown's option edit popover) shows a modal with two choices:
- **Delete from all rows**: removes the option definition and clears the value from all cells that reference it (select → empty, multiselect → removes the value from the pipe-separated list). Dispatches `UPDATE_SELECT_OPTION` with `newOption: null`.
- **Remove option only**: removes the option definition but preserves existing cell data. Orphaned values display as gray tags and can still be removed by users in the cell editor. Dispatches `REMOVE_OPTION_DEF`.

Both actions take effect immediately (not deferred to the column modal's Save button).

## UI/UX Specification

### Color Palette

- Primary text: `#37352F`
- Muted text: `rgba(55,53,47,0.65)`
- Light muted text: `rgba(55,53,47,0.5)`
- Border: `#E9E9E7`
- Header background: `#F7F6F3`
- Row hover: `rgba(55,53,47,0.04)`
- Focus ring: `#2383E2`
- Checkbox checked: `#2383E2`

### Tag Color Palette (9 Colors)

| Color  | Background | Text      |
| ------ | ---------- | --------- |
| gray   | `#E3E2E080` | `#5A5A5A` |
| brown  | `#EEE0DA`   | `#6B4C3B` |
| orange | `#FADEC9`   | `#AD5700` |
| yellow | `#FDECC8`   | `#AD7700` |
| green  | `#DBEDDB`   | `#2B6B2B` |
| blue   | `#D3E5EF`   | `#24548F` |
| purple | `#E8DEEE`   | `#6940A5` |
| pink   | `#F5E0E9`   | `#AD1A72` |
| red    | `#FFE2DD`   | `#C4554D` |

Default (no color): same as `gray`.

### Typography

- Header cells: `12px`, `500` weight, muted color
- Body cells: `14px`, `400` weight, primary color
- Tag labels: `12px`, `400` weight
- Line height: `1.5`

### Spacing

- Cell padding: `8px`
- Minimum row height: `32px`
- Tag padding: `0 6px`
- Tag border-radius: `3px`

### Interactive States

- Row hover: background `rgba(55,53,47,0.04)`
- Cell edit focus: `2px solid #2383E2` border (inset, replaces normal border)
- Dropdown shadow (3 layers):
  ```
  0 0 0 1px rgba(15,15,15,0.05),
  0 3px 6px rgba(15,15,15,0.1),
  0 9px 24px rgba(15,15,15,0.2)
  ```

### Layout

- Table has no outer border
- Columns separated by `1px` `#E9E9E7` vertical lines
- Rows separated by `1px` `#E9E9E7` horizontal lines
- Bottom row: "+ New" button, full width, muted text
- Right side of header: "+" button, `32x32px`, for adding columns
- Checkbox: `14x14px`, `border-radius: 2px`, checked state is `#2383E2` background with white checkmark

### Column Edit Modal

Clicking a column header opens a modal with: Name input, Type selector, Wrap content checkbox, and (for select/multiselect) an options editor. Options editor rows show a text input, a color swatch button (opens a portal-based color picker dropdown), and a delete button.

Button layout: Delete column (left, red on hover) and Save (right, accent color). Delete column requires confirmation via a secondary modal.

### Popover Positioning

All portal-based popovers (select/multiselect dropdown, option edit panel, color picker) check viewport boundaries before rendering. The option edit panel flips from right to left of its anchor when there is insufficient horizontal space, and shifts upward when there is insufficient vertical space.

## Multi-View System

### Column Name Uniqueness

Column names must be unique since views reference columns by name. When adding a column, if the name already exists, a numeric suffix is appended (e.g. "New Column 2"). When renaming, the same uniqueness check applies.

### Column Rename Propagation

When a column is renamed, all view references are updated: `SortRule.column`, `FilterRule.column`, and `ViewDef.hiddenColumns` entries matching the old name are updated to the new name. When a column is deleted, its references are removed from all views.

### Active View

`activeViewIndex` is stored as component state (not persisted) and always starts at 0. The active view determines which sorts, filters, and hidden columns are applied. Switching views recomputes the visible columns and filtered/sorted rows.

### Filter Logic

- **contains**: for text/number/date, cell includes any value in the array (case-insensitive); for select, cell equals any value; for multiselect, pipe-split cell values intersect with filter values
- **does-not-contain**: inverse of contains
- **is-empty**: cell is empty string
- **is-not-empty**: cell is non-empty

### Sort Logic

Sorts are applied in order (stable sort). For `text`/`select`: locale string compare. For `number`: numeric compare. For `date`: string compare (ISO format sorts correctly). For `checkbox`: "true" > "false". For `multiselect`: compare by joined string.

### UI Layout

The view bar and toolbar share a single horizontal row: view tabs on the left, icon buttons on the right. This row is outside the horizontal scroll area, so it always stays visible even when the table is wider than the viewport.

### UI Components

- **ViewBar**: View tabs on the left side of the bar. Active tab is bold with an underline indicator. Clicking a tab switches the view.
- **Toolbar**: Icon buttons on the right side of the bar — Filter (funnel), Sort (arrows), Fields (eye), and a "..." menu button. The "..." menu contains: New view, Rename (opens a modal), and Delete "[view name]" (only shown when more than one view exists). Filter and Sort buttons highlight in accent color when active rules exist. Fields button highlights when columns are hidden.
- **SortEditor**: Popover with a list of sort rules (column dropdown + direction dropdown + remove). "+ Add sort" and "Delete sort" buttons.
- **FilterEditor**: Popover with a list of filter rules (Where/And connector, column dropdown, operator dropdown, value input, remove). Value input adapts to column type (text input for text/number/date, checkbox options for select/multiselect, hidden for is-empty/is-not-empty).
- **ColumnVisibilityEditor**: Popover with a list of all columns and toggle switches to show/hide each column in the active view.
