# Obsidian CSV Database

An [Obsidian](https://obsidian.md) plugin that provides an interactive database view for CSV files, supporting multiple column types, inline editing, and more.

## Features

- **Rich column types**: text, number, date, checkbox, select, and multi-select
- **Inline editing**: click any cell to edit its value directly
- **Column management**: rename, change type, configure options, resize, and delete columns
- **Select & multi-select**: color-coded tags with a dropdown picker
- **Auto-save**: all changes are saved back to the CSV file immediately

## Usage

1. Install the plugin in Obsidian
2. Use the command palette to create a new database (creates a `.csvdb` file)
3. Add columns and rows to build your database

The `.csvdb` file is a standard CSV file with column metadata encoded in the header row, so it remains portable and human-readable.

## Development

```bash
npm install
npm run dev    # watch mode
npm run build  # production build
```

Copy `main.js`, `styles.css`, and `manifest.json` to your vault's plugin directory (`.obsidian/plugins/csv-database/`) to test locally.
