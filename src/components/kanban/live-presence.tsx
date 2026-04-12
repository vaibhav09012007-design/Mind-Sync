"use client";

import { useEffect, useState } from "react";
import PartySocket from "partysocket";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Users } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PresenceUser {
  id: string;
  color: string;
}

const COLORS = ["bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-purple-500", "bg-pink-500"];

export function LivePresence({ room }: { room: string }) {
  const [activeUsers, setActiveUsers] = useState<Map<string, PresenceUser>>(new Map());

  useEffect(() => {
    // Generate a random color for this client
    const myColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    
    // In a real app, host would come from env. For local dev, use localhost:1999
    // Adjust based on your partykit deployment
    const socket = new PartySocket({
      host: process.env.NEXT_PUBLIC_PARTYKIT_HOST || "localhost:1999",
      room,
    });

    socket.addEventListener("message", (e) => {
      try {
        const data = JSON.parse(e.data);
        setActiveUsers((prev) => {
          const map = new Map(prev);
          if (data.type === "connect") {
            map.set(data.connectionId, { id: data.connectionId, color: COLORS[map.size % COLORS.length] });
          } else if (data.type === "disconnect") {
            map.delete(data.connectionId);
          }
          return map;
        });
      } catch (err) {
        // ignore non-json messages
      }
    });

    return () => {
      socket.close();
    };
  }, [room]);

  if (activeUsers.size === 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed text-muted-foreground">
              <User className="h-4 w-4" />
            </div>
          </TooltipTrigger>
          <TooltipContent>You are alone on this board.</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex -space-x-2">
       <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed text-muted-foreground mr-2 shadow-sm relative! left-0 z-10 bg-background">
                <Users className="h-4 w-4" />
              </div>
            </TooltipTrigger>
            <TooltipContent>{activeUsers.size} others viewing</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      {Array.from(activeUsers.values()).map((user) => (
        <Avatar key={user.id} className="h-8 w-8 border-2 border-background ring-2 ring-primary/20">
          <AvatarFallback className={`text-white text-xs ${user.color}`}>
             {user.id.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ))}
    </div>
  );
}
