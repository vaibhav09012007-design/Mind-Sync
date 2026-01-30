"use client";

import { Bell, Search, User } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
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
        <h1 className="text-3xl font-bold tracking-tight gradient-text w-fit">{title}</h1>
        {subtitle && <p className="text-lg text-muted-foreground mt-1">{subtitle}</p>}
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
