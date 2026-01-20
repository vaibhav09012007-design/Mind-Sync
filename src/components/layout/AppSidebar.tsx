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
import { Logo } from "@/components/ui/Logo";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
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
    <aside className="border-r border-white/10 bg-background/60 backdrop-blur-xl h-full w-full flex flex-col transition-all duration-300">
      {/* Logo */}
      <div className="border-b border-white/10 p-4 flex items-center justify-between">
        <Logo size="sm" />
      </div>

      {/* Quick Search */}
      <div className="px-3 py-3">
        <div className="relative group">
          <Search
            size={14}
            className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 group-hover:text-primary transition-colors"
          />
          <input
            type="text"
            placeholder="Quick Search (Cmd+K)"
            className="bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 placeholder:text-muted-foreground hover:bg-white/10 w-full cursor-pointer rounded-lg border py-2 pl-9 text-sm transition-all focus:ring-2 focus:outline-none"
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
      <nav className="custom-scrollbar flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 ${
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
            >
              <Icon
                size={18}
                className={`transition-all duration-200 ${
                  isActive 
                    ? "text-primary drop-shadow-sm" 
                    : "text-muted-foreground group-hover:text-foreground"
                }`}
              />
              <span className="text-sm">{item.label}</span>
              
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute left-0 h-6 w-1 rounded-r-full bg-primary shadow-[0_0_10px_2px_rgba(255,215,0,0.3)]"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-white/10 space-y-2 p-4 bg-background/20 backdrop-blur-sm">
        <Link
          href="/settings"
          className="text-muted-foreground hover:bg-white/5 hover:text-foreground flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors"
        >
          <Settings size={18} />
          <span className="text-sm font-medium">Settings</span>
        </Link>

        {/* Meeting Mode / AI CTA */}
        <Link
          href="/meeting"
          className="relative overflow-hidden group mb-2 flex items-center gap-2 rounded-lg p-[1px]"
        >
          <div className="absolute inset-0 bg-primary/20 group-hover:opacity-40 transition-opacity" />
          <div className="relative bg-background/80 backdrop-blur-md flex items-center gap-2 w-full p-2.5 rounded-[7px] border border-white/10 group-hover:bg-background/60 transition-colors">
            <Sparkles size={16} className="text-primary transition-transform group-hover:scale-110 group-hover:rotate-12" />
            <span className="text-foreground text-xs font-semibold">Meeting Mode</span>
          </div>
        </Link>

        {/* User Profile */}
        <div className="bg-white/5 border-white/10 flex items-center gap-3 rounded-lg border p-3 hover:bg-white/10 transition-colors cursor-pointer">
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
                <div className="bg-white/10 h-3 w-20 animate-pulse rounded" />
                <div className="bg-white/10 h-2 w-16 animate-pulse rounded" />
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
