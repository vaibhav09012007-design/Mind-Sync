"use client";

import { Bell, Search, User } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

interface HeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function Header({ title, subtitle, children }: HeaderProps) {
  return (
    <header className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-[var(--text-secondary)]">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {children}

        <div className="flex items-center gap-2">
          {/* Placeholders for header actions if needed, though Sidebar has Search/User now. 
               We kept this flexible for page-specific actions.
           */}
        </div>
      </div>
    </header>
  );
}
