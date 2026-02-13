import { createContext, useContext } from "react";
import { App } from "obsidian";

export const AppContext = createContext<App>(null!);

export function useApp(): App {
  return useContext(AppContext);
}
