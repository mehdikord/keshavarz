"use client";

import { Check, Monitor, Moon, Sun } from "lucide-react";

import { Button } from "@/components/admin/ui/button";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/admin/ui/menu";

import { type AdminTheme, useAdminTheme } from "./admin-theme";

const OPTIONS: Array<{ icon: typeof Sun; label: string; value: AdminTheme }> = [
  { icon: Sun, label: "روشن", value: "light" },
  { icon: Moon, label: "تیره", value: "dark" },
  { icon: Monitor, label: "هماهنگ با سیستم", value: "system" },
];

export function ThemeMenu() {
  const { setTheme, theme } = useAdminTheme();
  const Current = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  return (
    <Menu>
      <MenuTrigger asChild>
        <Button aria-label="حالت نمایش" size="icon" variant="ghost">
          <Current />
        </Button>
      </MenuTrigger>
      <MenuContent className="w-52">
        {OPTIONS.map((option) => (
          <MenuItem key={option.value} onSelect={() => setTheme(option.value)}>
            <option.icon />
            <span className="flex-1">{option.label}</span>
            {theme === option.value ? <Check className="!text-primary" /> : null}
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  );
}
