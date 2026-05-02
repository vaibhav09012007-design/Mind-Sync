"use client";

import { NotificationBell } from "@/components/layout/notification-bell";

interface HeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function Header({ title, subtitle, children }: HeaderProps) {
  return (
    <header className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 className="h1 gradient-text w-fit relative pb-1">
          {title}
          <span className="absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r from-primary/40 via-primary/20 to-transparent rounded-full" />
        </h1>
        {subtitle && <p className="text-sm md:text-base text-muted-foreground mt-2">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {children}

        <div className="flex items-center gap-2">
          <NotificationBell />
          {/* Placeholders for header actions if needed, though Sidebar has Search/User now. 
               We kept this flexible for page-specific actions.
           */}
        </div>
      </div>
    </header>
  );
}
