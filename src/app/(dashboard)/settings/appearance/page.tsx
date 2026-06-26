"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

const THEMES = [
  {
    id: "light" as const,
    label: "Light",
    icon: Sun,
    description: "Bright and airy",
  },
  {
    id: "dark" as const,
    label: "Dark",
    icon: Moon,
    description: "Easy on the eyes",
  },
  {
    id: "system" as const,
    label: "System",
    icon: Monitor,
    description: "Follows your device",
  },
];

export default function AppearanceSettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Appearance</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Customize how ClientSpace looks on your device.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-medium">Theme</h2>
        <div className="grid grid-cols-3 gap-3">
          {THEMES.map(({ id, label, icon: Icon, description }) => (
            <button
              key={id}
              onClick={() => setTheme(id)}
              disabled={!mounted}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border p-5 text-sm transition-all duration-200",
                "hover:border-primary/50 hover:shadow-sm",
                mounted && theme === id
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border",
              )}
            >
              <Icon
                className={cn(
                  "h-6 w-6",
                  mounted && theme === id
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
              />
              <span
                className={cn(
                  "font-medium",
                  mounted && theme === id ? "text-primary" : "text-foreground",
                )}
              >
                {label}
              </span>
              <span className="text-muted-foreground text-xs">
                {description}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
