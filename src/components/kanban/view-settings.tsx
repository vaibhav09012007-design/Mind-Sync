"use client";

import { useViewSettings, useViewActions, useColumnActions } from "@/store/selectors";
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
import { Settings2, LayoutTemplate, Image as ImageIcon, KanbanSquare } from "lucide-react";
import { Density, ViewMode } from "@/store/useStore";

export function ViewSettings() {
  const viewSettings = useViewSettings();
  const { setViewSettings } = useViewActions();
  const { addColumn } = useColumnActions();

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
            onValueChange={(v) => setViewSettings({ mode: v as ViewMode })}
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
            onValueChange={(v) => setViewSettings({ density: v as Density })}
          >
            <DropdownMenuRadioItem value="comfortable">Comfortable</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="compact">Compact</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>

          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            checked={viewSettings.showCoverImages}
            onCheckedChange={(checked) => setViewSettings({ showCoverImages: checked })}
          >
            <ImageIcon className="mr-2 h-4 w-4" /> Show Cover Images
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
                color: "text-primary",
                bgColor: "bg-primary/10 border-primary/20",
              },
              {
                color: "text-success",
                bgColor: "bg-success/10 border-success/20",
              },
              {
                color: "text-info",
                bgColor: "bg-info/10 border-info/20",
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
