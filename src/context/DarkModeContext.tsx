import React, { createContext, useContext, useState, Dispatch, SetStateAction } from "react";

interface DarkModeContextValue {
  isDark: boolean;
  setIsDark: Dispatch<SetStateAction<boolean>>;
}

const DarkModeContext = createContext<DarkModeContextValue | null>(null);

export const DarkModeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDark, setIsDark] = useState(false);

  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", isDark);
  }

  return (
    <DarkModeContext.Provider value={{ isDark, setIsDark }}>
      {children}
    </DarkModeContext.Provider>
  );
};

export const useDarkMode = (): DarkModeContextValue => {
  const ctx = useContext(DarkModeContext);
  if (!ctx) {
    throw new Error("useDarkMode precisa estar dentro de <DarkModeProvider>");
  }
  return ctx;
};