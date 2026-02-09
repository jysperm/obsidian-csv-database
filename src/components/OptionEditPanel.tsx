import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { SelectOption, TagColor } from "../types";
import { TAG_COLOR_OPTIONS, TAG_COLORS } from "../constants";
import { useClickOutside } from "../hooks/useClickOutside";

const COLOR_LABELS: Record<TagColor, string> = {
  gray: "Gray",
  brown: "Brown",
  orange: "Orange",
  yellow: "Yellow",
  green: "Green",
  blue: "Blue",
  purple: "Purple",
  pink: "Pink",
  red: "Red",
};

interface OptionEditPanelProps {
  option: SelectOption;
  anchorRect: DOMRect;
  panelRef: React.RefObject<HTMLDivElement | null>;
  onUpdate: (oldValue: string, newOption: SelectOption | null) => void;
  onClose: () => void;
}

export function OptionEditPanel({ option, anchorRect, panelRef, onUpdate, onClose }: OptionEditPanelProps) {
  const [name, setName] = useState(option.value);
  const [color, setColor] = useState<TagColor>(option.color || "gray");

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useClickOutside([panelRef], handleClose);

  const handleNameBlur = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== option.value) {
      onUpdate(option.value, { value: trimmed, color });
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleColorClick = (c: TagColor) => {
    setColor(c);
    onUpdate(option.value, { value: name.trim() || option.value, color: c });
  };

  const handleDelete = () => {
    onUpdate(option.value, null);
    onClose();
  };

  return createPortal(
    <div
      ref={panelRef}
      className="csv-db-option-edit-popover"
      style={{
        top: `${anchorRect.top}px`,
        left: `${anchorRect.right + 6}px`,
      }}
    >
      <div className="csv-db-option-edit-panel">
        <input
          className="csv-db-option-edit-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleNameBlur}
          onKeyDown={handleNameKeyDown}
          autoFocus
        />
        <button className="csv-db-option-edit-delete" onClick={handleDelete}>
          <span className="csv-db-option-edit-delete-icon">🗑</span>
          Delete
        </button>
        <div className="csv-db-option-edit-separator" />
        <div className="csv-db-option-edit-colors-label">Colors</div>
        <div className="csv-db-option-edit-colors">
          {TAG_COLOR_OPTIONS.map((c) => {
            const colors = TAG_COLORS[c];
            return (
              <div
                key={c}
                className={`csv-db-option-edit-color-row ${c === color ? "is-active" : ""}`}
                onClick={() => handleColorClick(c)}
              >
                <span
                  className="csv-db-option-edit-color-swatch"
                  style={{ backgroundColor: colors.bg }}
                />
                <span className="csv-db-option-edit-color-name">{COLOR_LABELS[c]}</span>
                {c === color && <span className="csv-db-option-edit-color-check">✓</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}
