"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Calendar,
  CheckSquare,
  Settings,
  FileText,
  Mic,
  Timer,
  Kanban,
  BarChart3,
} from "lucide-react";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function AppSidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  const items = [
    {
      title: "Day Planner",
      href: "/dashboard",
      icon: CheckSquare,
    },
    {
      title: "Kanban Board",
      href: "/kanban",
      icon: Kanban,
    },
    {
      title: "Calendar",
      href: "/calendar",
      icon: Calendar,
    },
    {
      title: "Focus Timer",
      href: "/focus",
      icon: Timer,
    },
    {
      title: "Notes",
      href: "/notes",
      icon: FileText,
    },
    {
      title: "Meeting Mode",
      href: "/meeting",
      icon: Mic,
    },
    {
      title: "Analytics",
      href: "/analytics",
      icon: BarChart3,
    },
  ];

  return (
    <div className={cn("bg-background h-screen border-r pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="text-primary mb-2 px-4 text-lg font-semibold tracking-tight">MindSync</h2>
          <div className="space-y-1">
            {items.map((item) => (
              <Button
                key={item.href}
                variant={pathname === item.href ? "secondary" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute bottom-4 mt-auto w-full px-3 py-2">
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link href="/settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </Button>
      </div>
    </div>
  );
}
