"use client";

/**
 * Enhanced Weekly Chart
 * Bar/Line chart with toggle between Tasks and Focus Time, plus comparison
 */

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import { format } from "date-fns";
import { DailyActivity } from "@/lib/stats-calculator";
import { BarChart2, LineChartIcon, TrendingUp, TrendingDown } from "lucide-react";

interface EnhancedWeeklyChartProps {
  data: DailyActivity[];
  previousPeriodData?: DailyActivity[];
}

type ViewMode = "tasks" | "focus";
type ChartType = "bar" | "line";

interface ChartData extends DailyActivity {
  dayName: string;
  formattedDate: string;
  previousTasks: number;
  previousFocus: number;
}

const CustomTooltip = ({
  active,
  payload,
  viewMode,
  unit,
  color,
  previousColor,
  previousPeriodData,
}: {
  active?: boolean;
  payload?: { payload: ChartData }[];
  viewMode: ViewMode;
  unit: string;
  color: string;
  previousColor: string;
  previousPeriodData?: DailyActivity[];
}) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    const currentValue = viewMode === "tasks" ? d.tasksCompleted : d.focusMinutes;
    const previousValue = viewMode === "tasks" ? d.previousTasks : d.previousFocus;

    return (
      <div className="bg-popover rounded-lg border p-3 text-sm shadow-lg">
        <p className="mb-2 font-bold">{d.formattedDate}</p>
        <div className="space-y-1">
          <p className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            Current: {currentValue} {unit}
          </p>
          {previousPeriodData && (
            <p className="text-muted-foreground flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: previousColor }} />
              Previous: {previousValue} {unit}
            </p>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export function EnhancedWeeklyChart({ data, previousPeriodData }: EnhancedWeeklyChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("tasks");
  const [chartType, setChartType] = useState<ChartType>("bar");

  const formattedData = useMemo(() => {
    return data.map((d, index) => {
      const prevDay = previousPeriodData?.[index];
      return {
        ...d,
        dayName: format(d.date, "EEE"),
        formattedDate: format(d.date, "MMM d"),
        previousTasks: prevDay?.tasksCompleted ?? 0,
        previousFocus: prevDay?.focusMinutes ?? 0,
      };
    });
  }, [data, previousPeriodData]);

  // Calculate comparison percentage
  const comparison = useMemo(() => {
    const currentTotal = data.reduce(
      (acc, d) => acc + (viewMode === "tasks" ? d.tasksCompleted : d.focusMinutes),
      0
    );
    const previousTotal =
      previousPeriodData?.reduce(
        (acc, d) => acc + (viewMode === "tasks" ? d.tasksCompleted : d.focusMinutes),
        0
      ) ?? 0;

    if (previousTotal === 0) return null;
    return ((currentTotal - previousTotal) / previousTotal) * 100;
  }, [data, previousPeriodData, viewMode]);

  const dataKey = viewMode === "tasks" ? "tasksCompleted" : "focusMinutes";
  const previousKey = viewMode === "tasks" ? "previousTasks" : "previousFocus";
  const unit = viewMode === "tasks" ? "tasks" : "min";
  const color = viewMode === "tasks" ? "#8b5cf6" : "#22c55e";
  const previousColor = "#666";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Weekly Activity</CardTitle>
          {comparison !== null && (
            <p
              className={`mt-1 flex items-center gap-1 text-sm ${comparison >= 0 ? "text-green-500" : "text-red-500"}`}
            >
              {comparison >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {comparison >= 0 ? "+" : ""}
              {comparison.toFixed(0)}% vs last week
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="h-8">
            <TabsList className="h-8">
              <TabsTrigger value="tasks" className="h-6 px-2 text-xs">
                Tasks
              </TabsTrigger>
              <TabsTrigger value="focus" className="h-6 px-2 text-xs">
                Focus
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex rounded-md border">
            <Button
              variant={chartType === "bar" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setChartType("bar")}
            >
              <BarChart2 className="h-4 w-4" />
            </Button>
            <Button
              variant={chartType === "line" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setChartType("line")}
            >
              <LineChartIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "bar" ? (
            <BarChart data={formattedData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
              <XAxis dataKey="dayName" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                content={
                  <CustomTooltip
                    viewMode={viewMode}
                    unit={unit}
                    color={color}
                    previousColor={previousColor}
                    previousPeriodData={previousPeriodData}
                  />
                }
              />
              {previousPeriodData && (
                <Bar
                  dataKey={previousKey}
                  fill={previousColor}
                  radius={[4, 4, 0, 0]}
                  opacity={0.3}
                />
              )}
              <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]}>
                {formattedData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={(entry[dataKey as keyof typeof entry] as number) > 0 ? color : "#27272a"}
                  />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <LineChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
              <XAxis dataKey="dayName" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                content={
                  <CustomTooltip
                    viewMode={viewMode}
                    unit={unit}
                    color={color}
                    previousColor={previousColor}
                    previousPeriodData={previousPeriodData}
                  />
                }
              />
              {previousPeriodData && (
                <Line
                  type="monotone"
                  dataKey={previousKey}
                  stroke={previousColor}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              )}
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={3}
                dot={{ fill: color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
