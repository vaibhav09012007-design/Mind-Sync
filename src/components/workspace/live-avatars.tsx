"use client";

/**
 * Live avatar bubbles showing online workspace members
 * Displays colored avatar circles with tooltips in the header
 */

import { type PresenceUser } from "@/lib/party-client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface LiveAvatarsProps {
  users: PresenceUser[];
  maxVisible?: number;
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getPageLabel(path: string): string {
  const segments: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/kanban": "Kanban Board",
    "/calendar": "Calendar",
    "/notes": "Notes",
    "/focus": "Focus Timer",
    "/analytics": "Analytics",
    "/habits": "Habits",
    "/meeting": "Meeting Mode",
    "/settings": "Settings",
  };
  return segments[path] ?? "Browsing";
}

export function LiveAvatars({ users, maxVisible = 5, className }: LiveAvatarsProps) {
  if (users.length === 0) return null;

  const visible = users.slice(0, maxVisible);
  const overflow = users.length - maxVisible;

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex items-center -space-x-2", className)}>
        {visible.map((user) => (
          <Tooltip key={user.userId}>
            <TooltipTrigger asChild>
              <div className="relative">
                <Avatar
                  className="h-8 w-8 border-2 border-background ring-2 transition-transform hover:z-10 hover:scale-110"
                  style={{ borderColor: user.color }}
                >
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback
                    className="text-xs font-medium text-white"
                    style={{ backgroundColor: user.color }}
                  >
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                {/* Online indicator dot */}
                <span
                  className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-emerald-500"
                  aria-label={`${user.name} is online`}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              <p className="font-medium">{user.name}</p>
              <p className="text-muted-foreground">
                {getPageLabel(user.activePage)}
              </p>
            </TooltipContent>
          </Tooltip>
        ))}

        {overflow > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium text-muted-foreground">
                +{overflow}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              <p>{overflow} more online</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
