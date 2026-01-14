"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { DailyActivity } from "@/lib/stats-calculator";
import { format } from "date-fns";

interface ExportStatsProps {
  data: DailyActivity[];
}

export function ExportStats({ data }: ExportStatsProps) {
  const handleExportCSV = () => {
    if (!data.length) return;

    // Create CSV content
    const headers = ["Date", "Tasks Completed", "Focus Minutes"];
    const rows = data.map((d) => [format(d.date, "yyyy-MM-dd"), d.tasksCompleted, d.focusMinutes]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `mind-sync_stats_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExportCSV}>
      <Download className="mr-2 h-4 w-4" />
      Export Data
    </Button>
  );
}
