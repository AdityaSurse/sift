import { useEffect, useState } from "react";
import type { BorderBeamTheme } from "border-beam";

export type SurfaceTheme = "auto" | "dark" | "light";

/**
 * Hook to detect and track whether the current page surface is dark or light.
 * Why: Allows animated components like BorderBeam to adapt their glow palette dynamically
 * based on the root HTML class (.dark / .light) or OS prefers-color-scheme.
 */
export function useSurfaceTheme(theme: SurfaceTheme = "auto"): BorderBeamTheme {
  const [detected, setDetected] = useState<"dark" | "light">(() => {
    if (typeof document !== "undefined") {
      if (document.documentElement.classList.contains("dark")) return "dark";
      if (document.documentElement.classList.contains("light")) return "light";
    }
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "dark";
  });

  useEffect(() => {
    if (theme !== "auto") return;

    const check = () => {
      if (document.documentElement.classList.contains("dark")) {
        setDetected("dark");
      } else if (document.documentElement.classList.contains("light")) {
        setDetected("light");
      } else {
        const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setDetected(isDark ? "dark" : "light");
      }
    };

    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    mql.addEventListener("change", check);

    return () => {
      observer.disconnect();
      mql.removeEventListener("change", check);
    };
  }, [theme]);

  return theme === "auto" ? detected : theme;
}
