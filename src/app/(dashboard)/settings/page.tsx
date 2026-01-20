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
import { Download, User, Globe, Bell, Shield, Calendar, Database } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/ui/card";

export default function SettingsPage() {
  const { setTheme, theme } = useTheme();
  const { user } = useUser();
  const { openUserProfile } = useClerk();
  const { tasks, events, notes } = useStore();
  const [notifications, setNotifications] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGoogleConnect = () => {
    openUserProfile();
  };

  const handleExportAllData = () => {
    exportAllData({ tasks, events, notes });
    toast.success("Data exported successfully!");
  };

  if (!mounted) {
    return null; 
  }

  return (
    <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
      <div className="max-w-4xl space-y-8 pb-10 mx-auto">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight gradient-text w-fit">
            Settings
          </h1>
          <p className="text-muted-foreground text-lg">Manage your profile and preferences.</p>
        </div>

        <div className="space-y-6">
          {/* Profile Section */}
          <GlassCard className="p-0 overflow-hidden">
            <div className="p-6 pb-4 flex items-center gap-3 border-b border-border/50">
              <div className="p-2 bg-primary/10 rounded-lg">
                <User className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">Profile</h2>
            </div>
            
            <div className="p-6 flex items-center gap-6">
              <div className="relative group">
                <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
                    <AvatarImage src={user?.imageUrl} />
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                      {user?.firstName?.[0] || "U"}
                    </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 rounded-full ring-2 ring-purple-500/20 group-hover:ring-purple-500/50 transition-all" />
              </div>

              <div className="space-y-2 flex-1">
                <div className="font-bold text-xl">{user?.fullName || "Guest User"}</div>
                <div className="text-muted-foreground flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  {user?.primaryEmailAddress?.emailAddress || "Not signed in"}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 hover:bg-primary/10 hover:text-primary border-purple-500/20"
                  onClick={() => openUserProfile()}
                >
                    Edit Profile
                </Button>
              </div>
            </div>
          </GlassCard>

          {/* Integrations Section */}
          <GlassCard className="p-0 overflow-hidden">
            <div className="p-6 pb-4 flex items-center gap-3 border-b border-border/50">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Globe className="w-5 h-5 text-blue-500" />
              </div>
              <h2 className="text-lg font-semibold">Integrations</h2>
            </div>
            
            <div className="p-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-card/50 border border-border/50 hover:border-blue-500/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="bg-white p-2 rounded-lg shadow-sm">
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M24 12.276c0-1.047-.093-2.025-.273-2.964H12v5.61h6.732c-.29 1.565-1.173 2.894-2.496 3.78v3.132h4.045c2.366-2.18 3.732-5.388 3.732-9.558z"/>
                      <path fill="#34A853" d="M12 24c3.24 0 5.957-1.074 7.942-2.908l-4.045-3.132c-1.073.72-2.45 1.144-3.897 1.144-3.01 0-5.56-2.033-6.468-4.766H1.428v3.18C3.414 21.52 8.328 24 12 24z"/>
                      <path fill="#FBBC05" d="M5.532 14.338c-.227-.68-.356-1.408-.356-2.162s.13-2.482.356-2.162V6.657H1.428C.518 8.47 0 10.525 0 12.5s.518 4.03 1.428 5.843l4.104-3.18z"/>
                      <path fill="#4285F4" d="M12 4.773c1.763 0 3.347.606 4.59 1.794l3.44-3.44C17.953 1.19 15.236 0 12 0 8.328 0 3.414 2.48 1.428 6.657l4.104 3.18C6.44 7.033 8.99 5 12 5z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold">Google Calendar</div>
                    <div className="text-sm text-muted-foreground">Sync events two-way</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {user?.externalAccounts.some(acc => acc.provider === "google") ? (
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-sm text-emerald-500 font-medium bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/>
                          Connected
                        </span>
                        <Button variant="ghost" size="sm" onClick={handleGoogleConnect} className="text-muted-foreground hover:text-foreground">Manage</Button>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" onClick={handleGoogleConnect} className="gap-2">
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Preferences Section */}
          <GlassCard className="p-0 overflow-hidden">
            <div className="p-6 pb-4 flex items-center gap-3 border-b border-border/50">
              <div className="p-2 bg-pink-500/10 rounded-lg">
                <Bell className="w-5 h-5 text-pink-500" />
              </div>
              <h2 className="text-lg font-semibold">Preferences</h2>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-medium">Meeting Notifications</div>
                  <div className="text-sm text-muted-foreground">Get alerted 5 minutes before meetings start</div>
                </div>
                <Switch
                  checked={notifications}
                  onCheckedChange={setNotifications}
                  className="data-[state=checked]:bg-purple-600"
                />
              </div>
            </div>
          </GlassCard>

          {/* Data & Privacy Section */}
          <GlassCard className="p-0 overflow-hidden">
            <div className="p-6 pb-4 flex items-center gap-3 border-b border-border/50">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Database className="w-5 h-5 text-amber-500" />
              </div>
              <h2 className="text-lg font-semibold">Data & Privacy</h2>
            </div>
            
            <div className="p-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-card/50 border border-border/50">
                <div className="space-y-0.5">
                  <div className="font-medium">Export All Data</div>
                  <div className="text-sm text-muted-foreground">Download all your tasks, events, and notes as JSON</div>
                </div>
                <Button variant="outline" size="sm" onClick={handleExportAllData} className="gap-2 hover:bg-primary/10 hover:border-purple-500/50">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
