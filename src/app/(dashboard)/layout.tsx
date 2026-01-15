"use client";

import { AppSidebar } from "@/components/layout/AppSidebar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Search } from "lucide-react";
import { CommandMenu } from "@/components/layout/CommandMenu";
import { UserButton } from "@clerk/nextjs";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Global Command Palette */}
      <CommandMenu />

      {/* Desktop Sidebar */}
      <div className="hidden w-64 flex-shrink-0 md:block">
        <AppSidebar />
      </div>

      <div className="bg-background flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile Header (Hidden on Desktop) */}
        <header className="border-border bg-card/50 flex h-14 flex-shrink-0 items-center justify-between border-b px-4 backdrop-blur-sm md:hidden">
          <div className="flex items-center gap-4">
            {/* Mobile Sidebar Trigger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="border-border bg-card w-64 border-r p-0">
                <div className="h-full">
                  <AppSidebar />
                </div>
              </SheetContent>
            </Sheet>

            <h1 className="text-sm font-semibold tracking-tight">Mind-Sync</h1>
          </div>

          <div className="flex items-center gap-2">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                },
              }}
            />
          </div>
        </header>
        <main className="custom-scrollbar flex-1 overflow-hidden p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
