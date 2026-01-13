"use client";

import { AppSidebar } from "@/components/layout/AppSidebar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Search } from "lucide-react";
import { CommandMenu } from "@/components/layout/CommandMenu";
import { UserButton } from "@clerk/nextjs";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Global Command Palette */}
      <CommandMenu />

      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 flex-shrink-0">
        <AppSidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-muted/10">
        <header className="flex items-center justify-between h-14 px-6 border-b bg-background/50 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-4">
            {/* Mobile Sidebar Trigger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <SheetHeader className="sr-only">
                  <SheetTitle>Navigation Menu</SheetTitle>
                  <SheetDescription>Access different sections of the application</SheetDescription>
                </SheetHeader>
                <AppSidebar />
              </SheetContent>
            </Sheet>

            <h1 className="text-sm font-medium text-muted-foreground">Dashboard</h1>
          </div>

          <div className="flex items-center gap-4">
             {/* Visual search trigger */}
             <Button
                variant="outline"
                className="relative h-8 w-full justify-start rounded-[0.5rem] bg-muted/50 text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64 hidden sm:flex"
                onClick={() => {
                    const down = new KeyboardEvent("keydown", {
                        key: "k",
                        metaKey: true,
                        ctrlKey: true
                    });
                    document.dispatchEvent(down);
                }}
             >
                <Search className="mr-2 h-4 w-4" />
                <span>Search...</span>
                <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                    <span className="text-xs">?</span>K
                </kbd>
             </Button>

             <UserButton />
          </div>
        </header>
        <main className="flex-1 overflow-hidden p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
