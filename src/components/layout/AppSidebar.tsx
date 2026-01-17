"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Timer,
  BarChart3,
  Kanban,
  Settings,
  Sparkles,
  Search,
} from "lucide-react";
import { motion } from "framer-motion";
import { UserButton, useUser } from "@clerk/nextjs";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/notes", label: "Notes", icon: FileText },
  { href: "/focus", label: "Focus", icon: Timer },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/kanban", label: "Kanban", icon: Kanban },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();

  return (
    <aside className="sidebar border-border bg-card flex h-full w-full flex-col border-r">
      {/* Logo */}
      <div className="border-border flex items-center gap-3 border-b p-4">
        <div className="gradient-primary shadow-primary/20 flex h-10 w-10 items-center justify-center rounded-xl shadow-lg">
          <span className="text-lg font-bold text-white">M</span>
        </div>
        <div>
          <h1 className="text-foreground font-semibold tracking-tight">Mind-Sync</h1>
          <p className="text-muted-foreground text-xs">Productivity Hub</p>
        </div>
      </div>

      {/* Quick Search */}
      <div className="px-3 py-3">
        <div className="relative">
          <Search
            size={14}
            className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
          />
          <input
            type="text"
            placeholder="Quick Search (Cmd+K)"
            className="bg-secondary/50 border-border focus:ring-primary placeholder:text-muted-foreground hover:bg-secondary w-full cursor-pointer rounded-lg border py-2 pl-9 text-sm transition-colors focus:ring-1 focus:outline-none"
            readOnly
            onClick={() => {
              const down = new KeyboardEvent("keydown", {
                key: "k",
                metaKey: true,
                ctrlKey: true,
              });
              document.dispatchEvent(down);
            }}
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="custom-scrollbar flex-1 overflow-y-auto px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-item group relative mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 ${
                isActive
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon
                size={18}
                className={`icon-bounce transition-all duration-200 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}
              />
              <span className="text-sm font-medium">{item.label}</span>
              {isActive && (
                <>
                  <motion.div
                    layoutId="activeIndicator"
                    className="bg-primary absolute left-0 h-5 w-1 rounded-r-full"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                  {/* Active glow effect */}
                  <div
                    className="bg-primary/5 animate-pulse-glow absolute inset-0 rounded-lg"
                    style={{ animationDuration: "3s" }}
                  />
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="border-border mt-auto space-y-2 border-t p-4">
        <Link
          href="/settings"
          className="sidebar-item text-muted-foreground hover:bg-secondary hover:text-foreground flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors"
        >
          <Settings size={18} />
          <span className="text-sm font-medium">Settings</span>
        </Link>

        {/* Meeting Mode / AI CTA */}
        <Link
          href="/meeting"
          className="bg-primary/10 border-primary/20 hover:bg-primary/20 group mb-2 flex items-center gap-2 rounded-lg border p-3 transition-colors"
        >
          <Sparkles size={16} className="text-primary transition-transform group-hover:scale-110" />
          <span className="text-primary text-xs font-semibold">Meeting Mode</span>
        </Link>

        {/* User Profile */}
        <div className="bg-secondary/50 border-border flex items-center gap-3 rounded-lg border p-3">
          <div className="flex-shrink-0">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8 ring-2 ring-primary/20",
                },
              }}
            />
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            {isLoaded && user ? (
              <>
                <p className="text-foreground truncate text-sm font-medium">
                  {user.fullName || user.username || "User"}
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  {user.primaryEmailAddress?.emailAddress}
                </p>
              </>
            ) : (
              <div className="space-y-1">
                <div className="bg-muted/50 h-3 w-20 animate-pulse rounded" />
                <div className="bg-muted/50 h-2 w-16 animate-pulse rounded" />
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
