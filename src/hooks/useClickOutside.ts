import { useEffect, RefObject } from "react";

export function useClickOutside(
  refs: RefObject<HTMLElement | null>[],
  handler: () => void,
  active: boolean = true
): void {
  useEffect(() => {
    if (!active) return;

    const listener = (e: MouseEvent) => {
      for (const ref of refs) {
        if (ref.current && ref.current.contains(e.target as Node)) {
          return;
        }
      }
      handler();
    };

    const keyListener = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handler();
      }
    };

    // Delay to avoid catching the click that opened the dropdown
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", listener);
    }, 0);
    document.addEventListener("keydown", keyListener);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("keydown", keyListener);
    };
  }, [refs, handler, active]);
}
