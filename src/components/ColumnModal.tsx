import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { App, Modal } from "obsidian";
import { createRoot, Root } from "react-dom/client";
import { ColumnDef, ColumnType, SelectOption, TagColor } from "../types";
import { COLUMN_TYPES, TAG_COLOR_OPTIONS, TAG_COLORS } from "../constants";

class ConfirmModal extends Modal {
  private message: string;
  private onConfirm: () => void;

  constructor(app: App, message: string, onConfirm: () => void) {
    super(app);
    this.message = message;
    this.onConfirm = onConfirm;
  }

  onOpen() {
    this.titleEl.textContent = "Confirm";
    const p = this.contentEl.createEl("p");
    p.textContent = this.message;
    const actions = this.contentEl.createDiv({ cls: "csv-db-modal-actions" });
    const cancelBtn = actions.createEl("button", { cls: "csv-db-modal-btn", text: "Cancel" });
    const confirmBtn = actions.createEl("button", { cls: "csv-db-modal-btn csv-db-modal-btn-danger", text: "Delete" });
    confirmBtn.style.marginLeft = "auto";
    cancelBtn.addEventListener("click", () => this.close());
    confirmBtn.addEventListener("click", () => {
      this.onConfirm();
      this.close();
    });
  }

  onClose() {
    this.contentEl.empty();
  }
}

export class DeleteOptionModal extends Modal {
  private optionName: string;
  private onDeleteAll: () => void;
  private onDeleteDefOnly: () => void;

  constructor(app: App, optionName: string, onDeleteAll: () => void, onDeleteDefOnly: () => void) {
    super(app);
    this.optionName = optionName;
    this.onDeleteAll = onDeleteAll;
    this.onDeleteDefOnly = onDeleteDefOnly;
  }

  onOpen() {
    this.titleEl.textContent = "Delete Option";
    const p = this.contentEl.createEl("p");
    p.textContent = `How would you like to delete "${this.optionName}"?`;
    const actions = this.contentEl.createDiv({ cls: "csv-db-confirm-actions" });
    const deleteAllBtn = actions.createEl("button", {
      cls: "csv-db-modal-btn csv-db-modal-btn-danger",
      text: "Delete from all rows",
    });
    const defOnlyBtn = actions.createEl("button", {
      cls: "csv-db-modal-btn",
      text: "Remove option only",
    });
    const cancelBtn = actions.createEl("button", {
      cls: "csv-db-modal-btn",
      text: "Cancel",
    });
    deleteAllBtn.addEventListener("click", () => { this.onDeleteAll(); this.close(); });
    defOnlyBtn.addEventListener("click", () => { this.onDeleteDefOnly(); this.close(); });
    cancelBtn.addEventListener("click", () => this.close());
  }

  onClose() {
    this.contentEl.empty();
  }
}

interface ColumnModalContentProps {
  app: App;
  column: ColumnDef;
  onSave: (name: string, type: ColumnType, options: SelectOption[], wrapContent: boolean) => void;
  onDelete: () => void;
  onRemoveOption: (value: string, removeData: boolean) => void;
}

function ColorSwatchPicker({ color, onChange }: { color: TagColor; onChange: (c: TagColor) => void }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const colors = TAG_COLORS[color];

  useEffect(() => {
    if (!open) return;
    const handleDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        btnRef.current && !btnRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleDown);
    return () => document.removeEventListener("mousedown", handleDown);
  }, [open]);

  const rect = open && btnRef.current ? btnRef.current.getBoundingClientRect() : null;

  return (
    <>
      <button
        ref={btnRef}
        className="csv-db-color-picker-btn"
        style={{ backgroundColor: colors.bg }}
        onClick={() => setOpen(!open)}
      />
      {open && rect && createPortal(
        <div
          ref={dropdownRef}
          className="csv-db-color-picker-dropdown"
          style={{ top: rect.bottom + 4, left: rect.left }}
        >
          {TAG_COLOR_OPTIONS.map((c) => (
            <div
              key={c}
              className="csv-db-color-picker-item"
              onClick={() => { onChange(c); setOpen(false); }}
            >
              <span
                className="csv-db-color-picker-swatch"
                style={{ backgroundColor: TAG_COLORS[c].bg }}
              />
              <span className="csv-db-color-picker-name">{c}</span>
              {c === color && <span className="csv-db-color-picker-check">✓</span>}
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

function ColumnModalContent({ app, column, onSave, onDelete, onRemoveOption }: ColumnModalContentProps) {
  const [name, setName] = useState(column.name);
  const [type, setType] = useState<ColumnType>(column.type);
  const [options, setOptions] = useState<SelectOption[]>(
    column.options ? column.options.map((o) => ({ ...o })) : []
  );
  const [wrapContent, setWrapContent] = useState(column.wrapContent ?? false);

  const handleSave = () => {
    onSave(name, type, options, wrapContent);
  };

  const handleDelete = () => {
    new ConfirmModal(
      app,
      `This will delete the column "${column.name}" and all its data. This cannot be undone.`,
      onDelete
    ).open();
  };

  const addOption = () => {
    setOptions([...options, { value: "", color: "gray" }]);
  };

  const removeOption = (idx: number) => {
    const optionValue = options[idx].value;
    new DeleteOptionModal(
      app,
      optionValue || "this option",
      () => {
        onRemoveOption(optionValue, true);
        setOptions(options.filter((_, i) => i !== idx));
      },
      () => {
        onRemoveOption(optionValue, false);
        setOptions(options.filter((_, i) => i !== idx));
      }
    ).open();
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

      <div className="csv-db-modal-field csv-db-modal-checkbox-field">
        <label className="csv-db-modal-checkbox-label">
          <input
            type="checkbox"
            checked={wrapContent}
            onChange={(e) => setWrapContent(e.target.checked)}
          />
          Wrap content
        </label>
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
                <ColorSwatchPicker
                  color={option.color || "gray"}
                  onChange={(color) => updateOptionColor(i, color)}
                />
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
        <button className="csv-db-modal-btn csv-db-modal-btn-danger" onClick={handleDelete}>
          Delete column
        </button>
        <button className="csv-db-modal-btn csv-db-modal-btn-primary" onClick={handleSave}>
          Save
        </button>
      </div>
    </>
  );
}

export class ColumnModalWrapper extends Modal {
  private column: ColumnDef;
  private onSaveCallback: (name: string, type: ColumnType, options: SelectOption[], wrapContent: boolean) => void;
  private onDeleteCallback: () => void;
  private onRemoveOptionCallback: (value: string, removeData: boolean) => void;
  private reactRoot: Root | null = null;

  constructor(
    app: App,
    column: ColumnDef,
    onSave: (name: string, type: ColumnType, options: SelectOption[], wrapContent: boolean) => void,
    onDelete: () => void,
    onRemoveOption: (value: string, removeData: boolean) => void
  ) {
    super(app);
    this.column = column;
    this.onSaveCallback = onSave;
    this.onDeleteCallback = onDelete;
    this.onRemoveOptionCallback = onRemoveOption;
  }

  onOpen() {
    this.titleEl.textContent = "Edit Column";
    this.reactRoot = createRoot(this.contentEl);
    this.reactRoot.render(
      <ColumnModalContent
        app={this.app}
        column={this.column}
        onSave={(name, type, options, wrapContent) => {
          this.onSaveCallback(name, type, options, wrapContent);
          this.close();
        }}
        onDelete={() => {
          this.onDeleteCallback();
          this.close();
        }}
        onRemoveOption={(value, removeData) => {
          this.onRemoveOptionCallback(value, removeData);
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
