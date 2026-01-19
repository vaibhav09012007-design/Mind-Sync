"use client";

import { AppSidebar } from "@/components/layout/AppSidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { CommandMenu } from "@/components/layout/CommandMenu";
import { UserButton } from "@clerk/nextjs";
import { SkipLink } from "@/components/accessibility/skip-link";
import { KeyboardShortcutsHelp } from "@/components/accessibility/keyboard-shortcuts-help";
import { GlobalKeyboardShortcuts } from "@/components/accessibility/global-keyboard-shortcuts";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Accessibility: Skip to main content link */}
      <SkipLink />

      {/* Accessibility: Keyboard shortcuts help overlay (? key) */}
      <KeyboardShortcutsHelp />

      {/* Global Keyboard Shortcuts (G+D, G+K, Ctrl+Z, etc.) */}
      <GlobalKeyboardShortcuts />

      {/* PWA Service Worker Registration */}
      <ServiceWorkerRegistration />

      {/* Global Command Palette */}
      <CommandMenu />

      {/* Desktop Sidebar */}
      <nav className="hidden w-64 flex-shrink-0 md:block" aria-label="Main navigation">
        <AppSidebar />
      </nav>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile Header (Hidden on Desktop) */}
        <header
          className="border-border bg-background flex h-14 flex-shrink-0 items-center justify-between border-b px-4 md:hidden"
          role="banner"
        >
          <div className="flex items-center gap-4">
            {/* Mobile Sidebar Trigger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open navigation menu">
                  <Menu className="h-5 w-5" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="border-border bg-card w-64 border-r p-0"
                aria-label="Navigation menu"
              >
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

        {/* Main Content Area */}
        <main
          id="main-content"
          className="custom-scrollbar flex-1 overflow-y-auto p-4 pb-20 md:p-6 md:pb-6"
          role="main"
          aria-label="Main content"
        >
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* ARIA Live Region for Announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" id="announcements" />
    </div>
  );
}
