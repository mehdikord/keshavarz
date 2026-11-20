"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { ADMIN_THEME_COOKIE } from "./constants";

export type AdminTheme = "light" | "dark" | "system";

const ThemeContext = createContext<{ setTheme: (theme: AdminTheme) => void; theme: AdminTheme }>({
  setTheme: () => {},
  theme: "system",
});

/**
 * Owns the console's colour scheme. The server renders the saved choice (from
 * the cookie) so the first paint is right; the same attribute is mirrored on
 * <html> so portalled dialogs, menus and toasts share the palette.
 */
export function AdminThemeRoot({
  children,
  initialTheme,
}: {
  children: React.ReactNode;
  initialTheme: AdminTheme;
}) {
  const [theme, setThemeState] = useState<AdminTheme>(initialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.adminTheme = theme;
    return () => {
      delete root.dataset.adminTheme;
    };
  }, [theme]);

  const setTheme = useCallback((next: AdminTheme) => {
    setThemeState(next);
    document.cookie = `${ADMIN_THEME_COOKIE}=${next}; Path=/admins; Max-Age=31536000; SameSite=Lax`;
  }, []);

  return (
    <ThemeContext.Provider value={{ setTheme, theme }}>
      <div className="admin-root min-h-dvh bg-canvas font-sans text-foreground" data-admin-theme={theme} dir="rtl">
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useAdminTheme() {
  return useContext(ThemeContext);
}
