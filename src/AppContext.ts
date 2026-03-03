import { createContext, useContext } from "react";
import { App } from "obsidian";

export const AppContext = createContext<App>(null!);

export function useApp(): App {
  return useContext(AppContext);
}

export const PortalContainerContext = createContext<HTMLElement | null>(null);

export function usePortalContainer(): HTMLElement {
  const container = useContext(PortalContainerContext);
  return container ?? document.body;
}
