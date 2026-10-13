"use client";
import * as React from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const getSnapshot = (): Theme => (document.documentElement.classList.contains("dark") ? "dark" : "light");
const getServerSnapshot = (): Theme => "light";

export function setTheme(next: Theme) {
  document.documentElement.classList.toggle("dark", next === "dark");
  try {
    localStorage.setItem("fa-theme-v2", next);
  } catch {}
  listeners.forEach((l) => l());
}

export function useTheme() {
  const theme = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const toggle = () => setTheme(theme === "dark" ? "light" : "dark");
  return { theme, toggle };
}

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button onClick={toggle} className="rounded-lg p-2 text-muted hover:bg-hover hover:text-fg" aria-label="Toggle theme">
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

export const themeInitScript = `(function(){try{if(localStorage.getItem('fa-theme-v2')==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`;
