"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Clock,
  FileText,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/kanban", label: "Tasks", icon: CheckSquare },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/focus", label: "Focus", icon: Clock },
  { href: "/notes", label: "Notes", icon: FileText },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-lg md:hidden"
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg px-3 py-2 transition-colors",
                "min-w-[64px] touch-manipulation",
                isActive
                  ? "text-[var(--primary)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                size={22}
                className={cn(
                  "transition-transform",
                  isActive && "scale-110"
                )}
                aria-hidden="true"
              />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Safe area padding for devices with home indicators */}
      <div className="h-safe-area-inset-bottom bg-[var(--surface)]" />
    </nav>
  );
}
