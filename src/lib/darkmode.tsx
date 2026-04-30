"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

type DarkModeContextValue = {
  dark: boolean;
  toggle: () => void;
};

const DarkModeContext = createContext<DarkModeContextValue>({
  dark: false,
  toggle: () => {},
});

export function DarkModeProvider({ children }: { children: ReactNode }) {
  // Start with `false` to match SSR; real value applied after mount
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Runs only on the client — safe from hydration mismatch
    const saved = localStorage.getItem("tm-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved ? saved === "dark" : prefersDark;
    setDark(isDark);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("tm-theme", dark ? "dark" : "light");
  }, [dark, mounted]);

  const toggle = () => setDark((d) => !d);

  return (
    <DarkModeContext.Provider value={{ dark, toggle }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode(): DarkModeContextValue {
  return useContext(DarkModeContext);
}
