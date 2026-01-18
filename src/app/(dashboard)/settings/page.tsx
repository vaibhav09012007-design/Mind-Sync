"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useUser, useClerk } from "@clerk/nextjs";
import { useStore } from "@/store/useStore";
import { exportAllData } from "@/lib/export-utils";
import { Download } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { setTheme, theme } = useTheme();
  const { user } = useUser();
  const { openUserProfile } = useClerk();
  const { tasks, events, notes } = useStore();
  const [notifications, setNotifications] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const handleGoogleConnect = () => {
    openUserProfile(); // Directs to connections tab if supported, or just open profile
  };

  const handleExportAllData = () => {
    exportAllData({ tasks, events, notes });
    toast.success("Data exported successfully!");
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return null; 
  }

  return (
    <div className="h-full overflow-y-auto pr-6">
      <div className="max-w-4xl space-y-8 pb-10">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your profile and preferences.</p>
        </div>

        <div className="space-y-6">
          {/* Profile Section */}
          <div className="border rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-medium">Profile</h2>
            <Separator />
             <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                    <AvatarImage src={user?.imageUrl} />
                    <AvatarFallback>{user?.firstName?.[0] || "U"}</AvatarFallback>
                </Avatar>

              <div className="space-y-1">
                <div className="font-medium">{user?.fullName || "Guest User"}</div>
                <div className="text-sm text-muted-foreground">{user?.primaryEmailAddress?.emailAddress || "Not signed in"}</div>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => openUserProfile()}>
                    Edit Profile
                </Button>
              </div>
            </div>
          </div>

          {/* Integrations Section */}
          <div className="border rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-medium">Integrations</h2>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-red-500/10 p-2 rounded-md">
                  <svg className="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                  </svg>
                </div>
                <div>
                  <div className="font-medium">Google Calendar</div>
                  <div className="text-sm text-muted-foreground">Sync events two-way</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* We can check externalAccounts to see if google is linked */}
                {user?.externalAccounts.some(acc => acc.provider === "google") ? (
                  <div className="flex items-center gap-2">
                      <span className="text-sm text-green-600 font-medium bg-green-500/10 px-2 py-0.5 rounded-full">Connected</span>
                      <Button variant="ghost" size="sm" onClick={handleGoogleConnect} className="text-muted-foreground h-auto p-0 hover:bg-transparent hover:underline">Manage</Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={handleGoogleConnect}>Connect</Button>
                )}
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="border rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-medium">Preferences</h2>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-medium">Dark Mode</div>
                <div className="text-sm text-muted-foreground">Reduce eye strain</div>
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-medium">Meeting Notifications</div>
                <div className="text-sm text-muted-foreground">Get alerted 5 mins before</div>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>
          </div>

          {/* Data & Privacy Section */}
          <div className="border rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-medium">Data & Privacy</h2>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-medium">Export All Data</div>
                <div className="text-sm text-muted-foreground">Download all your tasks, events, and notes as JSON</div>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportAllData}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
