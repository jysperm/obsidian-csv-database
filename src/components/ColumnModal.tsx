import { useState } from "react";
import { createPortal } from "react-dom";
import { App, Modal } from "obsidian";
import { createRoot, Root } from "react-dom/client";
import { ColumnDef, ColumnType, SelectOption, TagColor } from "../types";
import { COLUMN_TYPES, TAG_COLOR_OPTIONS } from "../constants";

interface ColumnModalContentProps {
  column: ColumnDef;
  onSave: (name: string, type: ColumnType, options: SelectOption[]) => void;
  onDelete: () => void;
}

function ColumnModalContent({ column, onSave, onDelete }: ColumnModalContentProps) {
  const [name, setName] = useState(column.name);
  const [type, setType] = useState<ColumnType>(column.type);
  const [options, setOptions] = useState<SelectOption[]>(
    column.options ? column.options.map((o) => ({ ...o })) : []
  );

  const handleSave = () => {
    onSave(name, type, options);
  };

  const handleDelete = () => {
    onDelete();
  };

  const addOption = () => {
    setOptions([...options, { value: "", color: "gray" }]);
  };

  const removeOption = (idx: number) => {
    setOptions(options.filter((_, i) => i !== idx));
  };

  const updateOptionValue = (idx: number, value: string) => {
    const next = [...options];
    next[idx] = { ...next[idx], value };
    setOptions(next);
  };

  const updateOptionColor = (idx: number, color: TagColor) => {
    const next = [...options];
    next[idx] = { ...next[idx], color };
    setOptions(next);
  };

  return (
    <>
      <div className="csv-db-modal-field">
        <label className="csv-db-modal-label">Name</label>
        <input
          className="csv-db-modal-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="csv-db-modal-field">
        <label className="csv-db-modal-label">Type</label>
        <select
          className="csv-db-modal-select"
          value={type}
          onChange={(e) => setType(e.target.value as ColumnType)}
        >
          {COLUMN_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {(type === "select" || type === "multiselect") && (
        <div className="csv-db-modal-field">
          <label className="csv-db-modal-label">Options</label>
          <div className="csv-db-options-list">
            {options.map((option, i) => (
              <div key={i} className="csv-db-option-row">
                <input
                  className="csv-db-option-value-input"
                  value={option.value}
                  placeholder="Option name"
                  onChange={(e) => updateOptionValue(i, e.target.value)}
                />
                <select
                  className="csv-db-option-color-select"
                  value={option.color || "gray"}
                  onChange={(e) => updateOptionColor(i, e.target.value as TagColor)}
                >
                  {TAG_COLOR_OPTIONS.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
                <button
                  className="csv-db-option-remove-btn"
                  onClick={() => removeOption(i)}
                >
                  ✕
                </button>
              </div>
            ))}
            <button className="csv-db-add-option-btn" onClick={addOption}>
              + Add option
            </button>
          </div>
        </div>
      )}

      <div className="csv-db-modal-actions">
        <button className="csv-db-modal-btn csv-db-modal-btn-primary" onClick={handleSave}>
          Save
        </button>
        <button className="csv-db-modal-btn csv-db-modal-btn-danger" onClick={handleDelete}>
          Delete column
        </button>
      </div>
    </>
  );
}

export class ColumnModalWrapper extends Modal {
  private column: ColumnDef;
  private onSaveCallback: (name: string, type: ColumnType, options: SelectOption[]) => void;
  private onDeleteCallback: () => void;
  private reactRoot: Root | null = null;

  constructor(
    app: App,
    column: ColumnDef,
    onSave: (name: string, type: ColumnType, options: SelectOption[]) => void,
    onDelete: () => void
  ) {
    super(app);
    this.column = column;
    this.onSaveCallback = onSave;
    this.onDeleteCallback = onDelete;
  }

  onOpen() {
    this.titleEl.textContent = "Edit Column";
    this.reactRoot = createRoot(this.contentEl);
    this.reactRoot.render(
      <ColumnModalContent
        column={this.column}
        onSave={(name, type, options) => {
          this.onSaveCallback(name, type, options);
          this.close();
        }}
        onDelete={() => {
          this.onDeleteCallback();
          this.close();
        }}
      />
    );
  }

  onClose() {
    this.reactRoot?.unmount();
    this.reactRoot = null;
    this.contentEl.empty();
  }
}
