"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { format } from "date-fns";
import { DailyActivity } from "@/lib/stats-calculator";

interface WeeklyChartProps {
  data: DailyActivity[];
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  // Ensure we have last 7 days at least, filling gaps
  // (Caller should provide full data, but we can handle display logic here)

  const formattedData = data.map((d) => ({
    ...d,
    dayName: format(d.date, "EEE"), // Mon, Tue...
    formattedDate: format(d.date, "MMM d"),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Activity</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="dayName" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: "transparent" }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-background rounded-lg border p-2 text-xs shadow-md">
                      <p className="font-bold">{d.formattedDate}</p>
                      <p>Tasks: {d.tasksCompleted}</p>
                      <p>Focus: {d.focusMinutes}m</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="tasksCompleted" radius={[4, 4, 0, 0]}>
              {formattedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.tasksCompleted > 0 ? "#8884d8" : "#e5e7eb"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
