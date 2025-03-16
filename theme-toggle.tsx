import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Sun className="h-5 w-5 text-yellow-500" />
            ) : (
              <Moon className="h-5 w-5 text-blue-300" />
            )}
            <span className="sr-only">{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Toggle {theme === 'light' ? 'dark' : 'light'} mode</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}