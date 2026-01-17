import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DailyActivity, StatsCalculator } from "@/lib/stats-calculator";
import { Lightbulb } from "lucide-react";

interface CoachWidgetProps {
  data: DailyActivity[];
}

export function CoachWidget({ data }: CoachWidgetProps) {
  const message = StatsCalculator.getCoachingMessage(data);

  return (
    <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50 dark:border-indigo-900 dark:from-indigo-950/20 dark:to-purple-900/20">
      <CardHeader className="flex flex-row items-center space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Coach&apos;s Insight</CardTitle>
        <Lightbulb className="ml-auto h-4 w-4 text-indigo-500" />
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">&quot;{message}&quot;</p>
      </CardContent>
    </Card>
  );
}
