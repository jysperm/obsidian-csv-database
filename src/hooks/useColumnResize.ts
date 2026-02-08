import { useRef, useCallback } from "react";

interface UseColumnResizeOptions {
  onResizeEnd: (colIdx: number, width: number) => void;
}

export function useColumnResize({ onResizeEnd }: UseColumnResizeOptions) {
  const colGroupRef = useRef<HTMLTableColElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const justResizedRef = useRef(false);

  const onResizeStart = useCallback(
    (colIdx: number, e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      const colGroup = colGroupRef.current;
      if (!colGroup) return;

      const colEl = colGroup.children[colIdx] as HTMLElement;
      if (!colEl) return;

      const startX = e.clientX;
      const startWidth = parseInt(colEl.style.width, 10) || 180;

      document.body.classList.add("csv-db-resizing");

      const onMove = (ev: MouseEvent) => {
        const delta = ev.clientX - startX;
        const newWidth = Math.max(80, startWidth + delta);
        colEl.style.width = `${newWidth}px`;
      };

      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        document.body.classList.remove("csv-db-resizing");

        justResizedRef.current = true;

        const finalWidth = parseInt(colEl.style.width, 10);
        onResizeEnd(colIdx, finalWidth);
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [onResizeEnd]
  );

  const consumeJustResized = useCallback((): boolean => {
    if (justResizedRef.current) {
      justResizedRef.current = false;
      return true;
    }
    return false;
  }, []);

  return { colGroupRef, tableRef, onResizeStart, consumeJustResized };
}
