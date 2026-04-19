import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className="relative size-9 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors overflow-hidden"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle theme"
    >
      <Sun
        className={`absolute size-4 transition-all duration-500 ease-out ${
          isDark
            ? "opacity-0 rotate-90 scale-50"
            : "opacity-100 rotate-0 scale-100"
        }`}
      />
      <Moon
        className={`absolute size-4 transition-all duration-500 ease-out ${
          isDark
            ? "opacity-100 rotate-0 scale-100"
            : "opacity-0 -rotate-90 scale-50"
        }`}
      />
    </button>
  );
};

export default ThemeToggle;
