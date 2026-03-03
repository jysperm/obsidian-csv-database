import { useCallback, useRef } from "react";

const DRAG_THRESHOLD = 5;

interface UseCardDragOptions {
  onCardMove: (rowOriginalIndex: number, targetGroupValue: string) => void;
}

export function useCardDrag({ onCardMove }: UseCardDragOptions) {
  const dragRef = useRef<{
    rowOriginalIndex: number;
    sourceGroupValue: string;
    ghost: HTMLElement | null;
    sourceCard: HTMLElement | null;
    board: HTMLElement | null;
  } | null>(null);

  const onCardMouseDown = useCallback(
    (e: React.MouseEvent, rowOriginalIndex: number) => {
      if (e.button !== 0) return;

      const startX = e.clientX;
      const startY = e.clientY;
      const cardEl = (e.target as HTMLElement).closest<HTMLElement>(".csv-db-kanban-card");
      if (!cardEl) return;

      const columnEl = cardEl.closest<HTMLElement>(".csv-db-kanban-column");
      const sourceGroupValue = columnEl?.getAttribute("data-group-value") ?? "";
      const boardEl = cardEl.closest<HTMLElement>(".csv-db-kanban-board");

      let dragging = false;
      let ghostOffsetX = 0;
      let ghostOffsetY = 0;

      const onMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;

        if (!dragging) {
          if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) {
            return;
          }
          dragging = true;
          document.body.classList.add("csv-db-card-dragging");

          // Create ghost
          const ghost = cardEl.cloneNode(true) as HTMLElement;
          const rect = cardEl.getBoundingClientRect();
          ghost.className = "csv-db-kanban-card-ghost";
          ghost.style.width = `${rect.width}px`;
          ghost.style.left = `${rect.left}px`;
          ghost.style.top = `${rect.top}px`;
          document.body.appendChild(ghost);

          ghostOffsetX = rect.left - startX;
          ghostOffsetY = rect.top - startY;

          // Mark source card
          cardEl.classList.add("csv-db-kanban-card-dragging-source");

          dragRef.current = {
            rowOriginalIndex,
            sourceGroupValue,
            ghost,
            sourceCard: cardEl,
            board: boardEl,
          };
        }

        if (dragRef.current?.ghost) {
          dragRef.current.ghost.style.left = `${ev.clientX + ghostOffsetX}px`;
          dragRef.current.ghost.style.top = `${ev.clientY + ghostOffsetY}px`;
        }

        // Highlight target column (scoped to the current board)
        if (boardEl) {
          const allColumns = boardEl.querySelectorAll(".csv-db-kanban-column");
          allColumns.forEach((col) => col.classList.remove("csv-db-kanban-column-drop-target"));
        }

        const targetCol = getColumnAtPoint(ev.clientX, ev.clientY, boardEl);
        if (targetCol) {
          targetCol.classList.add("csv-db-kanban-column-drop-target");
        }
      };

      const onUp = (ev: MouseEvent) => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);

        if (!dragging) return;

        document.body.classList.remove("csv-db-card-dragging");

        // Clean up ghost
        if (dragRef.current?.ghost) {
          dragRef.current.ghost.remove();
        }
        if (dragRef.current?.sourceCard) {
          dragRef.current.sourceCard.classList.remove("csv-db-kanban-card-dragging-source");
        }

        // Find target column (scoped to the current board)
        if (boardEl) {
          const allColumns = boardEl.querySelectorAll(".csv-db-kanban-column");
          allColumns.forEach((col) => col.classList.remove("csv-db-kanban-column-drop-target"));
        }

        const targetCol = getColumnAtPoint(ev.clientX, ev.clientY, boardEl);
        if (targetCol && dragRef.current) {
          const targetGroupValue = targetCol.getAttribute("data-group-value") ?? "";
          if (targetGroupValue !== dragRef.current.sourceGroupValue) {
            onCardMove(dragRef.current.rowOriginalIndex, targetGroupValue);
          }
        }

        dragRef.current = null;
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [onCardMove]
  );

  return { onCardMouseDown };
}

function getColumnAtPoint(x: number, y: number, board: HTMLElement | null): HTMLElement | null {
  const container = board || document;
  const columns = container.querySelectorAll(".csv-db-kanban-column");
  for (let i = 0; i < columns.length; i++) {
    const col = columns[i];
    const rect = col.getBoundingClientRect();
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      return col as HTMLElement;
    }
  }
  return null;
}
