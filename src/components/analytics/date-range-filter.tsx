"use client";

/**
 * Date Range Filter Component
 * Allows filtering analytics by time period
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { format, subDays, subMonths, startOfYear } from "date-fns";
import { cn } from "@/lib/utils";

export type DateRangeOption = "7d" | "30d" | "90d" | "year" | "custom";

export interface DateRange {
  from: Date;
  to: Date;
  label: string;
}

interface DateRangeFilterProps {
  value: DateRangeOption;
  onChange: (option: DateRangeOption, range: DateRange) => void;
}

const PRESET_OPTIONS: { value: DateRangeOption; label: string }[] = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "year", label: "This Year" },
  { value: "custom", label: "Custom Range" },
];

export function getDateRangeFromOption(option: DateRangeOption): DateRange {
  const today = new Date();

  switch (option) {
    case "7d":
      return { from: subDays(today, 7), to: today, label: "Last 7 Days" };
    case "30d":
      return { from: subDays(today, 30), to: today, label: "Last 30 Days" };
    case "90d":
      return { from: subDays(today, 90), to: today, label: "Last 90 Days" };
    case "year":
      return { from: startOfYear(today), to: today, label: "This Year" };
    case "custom":
      return { from: subDays(today, 30), to: today, label: "Custom" };
    default:
      return { from: subDays(today, 30), to: today, label: "Last 30 Days" };
  }
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const [customFrom, setCustomFrom] = useState<Date | undefined>(subDays(new Date(), 30));
  const [customTo, setCustomTo] = useState<Date | undefined>(new Date());
  const [showCustom, setShowCustom] = useState(false);

  const handleSelect = (option: DateRangeOption) => {
    if (option === "custom") {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      onChange(option, getDateRangeFromOption(option));
    }
  };

  const handleCustomApply = () => {
    if (customFrom && customTo) {
      onChange("custom", {
        from: customFrom,
        to: customTo,
        label: `${format(customFrom, "MMM d")} - ${format(customTo, "MMM d")}`,
      });
      setShowCustom(false);
    }
  };

  const currentLabel = PRESET_OPTIONS.find((o) => o.value === value)?.label || "Select Range";

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="min-w-[140px] justify-between">
            {currentLabel}
            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          {PRESET_OPTIONS.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={cn(value === option.value && "bg-accent")}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {showCustom && (
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customFrom ? format(customFrom, "MMM d") : "From"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={customFrom} onSelect={setCustomFrom} initialFocus />
            </PopoverContent>
          </Popover>
          <span className="text-muted-foreground">to</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customTo ? format(customTo, "MMM d") : "To"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={customTo} onSelect={setCustomTo} initialFocus />
            </PopoverContent>
          </Popover>
          <Button size="sm" onClick={handleCustomApply}>
            Apply
          </Button>
        </div>
      )}
    </div>
  );
}
