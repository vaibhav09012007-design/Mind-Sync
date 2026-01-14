"use client";

import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Settings2, LayoutTemplate, Image, KanbanSquare } from "lucide-react";

export function ViewSettings() {
  const { viewSettings, setViewSettings, columns, addColumn } = useStore();

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-2">
            <Settings2 className="h-4 w-4" />
            View
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>View Mode</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={viewSettings.mode}
            onValueChange={(v) => setViewSettings({ mode: v as any })}
          >
            <DropdownMenuRadioItem value="board">
              <KanbanSquare className="mr-2 h-4 w-4" /> Board
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="swimlane">
              <LayoutTemplate className="mr-2 h-4 w-4" /> Swimlanes
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Card Appearance</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={viewSettings.density}
            onValueChange={(v) => setViewSettings({ density: v as any })}
          >
            <DropdownMenuRadioItem value="comfortable">Comfortable</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="compact">Compact</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>

          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            checked={viewSettings.showCoverImages}
            onCheckedChange={(checked) => setViewSettings({ showCoverImages: checked })}
          >
            <Image className="mr-2 h-4 w-4" /> Show Cover Images
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="outline"
        size="sm"
        className="h-8"
        onClick={() => {
          const title = prompt("Enter column name:");
          if (title) {
            // Generate a random color or select from a preset
            const colors = [
              {
                color: "text-purple-600 dark:text-purple-400",
                bgColor: "bg-purple-50 dark:bg-purple-900/20",
              },
              {
                color: "text-pink-600 dark:text-pink-400",
                bgColor: "bg-pink-50 dark:bg-pink-900/20",
              },
              {
                color: "text-indigo-600 dark:text-indigo-400",
                bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
              },
            ];
            const randomTheme = colors[Math.floor(Math.random() * colors.length)];

            addColumn({
              title,
              ...randomTheme,
            });
          }
        }}
      >
        + Add Column
      </Button>
    </div>
  );
}
