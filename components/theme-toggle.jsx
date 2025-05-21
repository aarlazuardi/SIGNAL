"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return (
    <Button
      variant="ghost"
      size="icon"
      className={`h-10 w-10 rounded-full p-0 flex items-center justify-center relative z-10 transition-all ${
        theme === "light" ? "bg-white text-black" : "bg-[#0f172a] text-white"
      }`}
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      aria-label={
        theme === "light" ? "Switch to dark theme" : "Switch to light theme"
      }
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
    >
      {theme === "light" ? (
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem]" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
