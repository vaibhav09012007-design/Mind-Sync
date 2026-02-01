import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DailyActivity, StatsCalculator } from "@/lib/stats-calculator";
import { Lightbulb, Sparkles } from "lucide-react";
import { TypewriterEffect } from "@/components/ui/typewriter-effect";

interface CoachWidgetProps {
  data: DailyActivity[];
}

export function CoachWidget({ data }: CoachWidgetProps) {
  const message = StatsCalculator.getCoachingMessage(data);

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="flex flex-row items-center space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary animate-pulse-glow" />
          Coach&apos;s Insight
        </CardTitle>
        <Lightbulb className="ml-auto h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm min-h-[3rem]">
          &quot;
          <TypewriterEffect text={message} speed={0.02} />
          &quot;
        </p>
      </CardContent>
    </Card>
  );
}
