"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Volume2, VolumeX, Play, Pause, Music } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const SOUNDSCAPES = [
  {
    id: "rain",
    label: "Rain",
    src: "https://assets.mixkit.co/sfx/preview/mixkit-light-rain-loop-2393.mp3", // Short loop example
  },
  {
    id: "forest",
    label: "Forest",
    src: "https://assets.mixkit.co/sfx/preview/mixkit-forest-birds-ambience-1210.mp3",
  },
  {
    id: "white-noise",
    label: "White Noise",
    src: "https://assets.mixkit.co/sfx/preview/mixkit-radio-static-noise-1221.mp3", // Placeholder
  },
  {
    id: "cafe",
    label: "Cafe",
    src: "https://assets.mixkit.co/sfx/preview/mixkit-restaurant-ambience-loop-1209.mp3",
  },
];

export function AudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(SOUNDSCAPES[0]);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch((e) => {
          console.error("Audio playback error:", e);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrack]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const selectTrack = (track: typeof currentTrack) => {
    if (currentTrack.id === track.id) {
      // Just toggle if same track
      // togglePlay();
      return;
    }
    const wasPlaying = isPlaying;
    setCurrentTrack(track);
    // Auto play if switching tracks
    if (wasPlaying) {
      // React effect will handle the play call when currentTrack changes
    } else {
      setIsPlaying(true);
    }
  };

  return (
    <div className="bg-muted/50 flex items-center gap-2 rounded-full border p-2 shadow-sm">
      <audio ref={audioRef} src={currentTrack.src} loop preload="none" />

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            <Music className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="start">
          <div className="space-y-3">
            <h4 className="text-foreground text-sm font-medium">Soundscapes</h4>
            <div className="grid gap-1">
              {SOUNDSCAPES.map((track) => (
                <Button
                  key={track.id}
                  variant={currentTrack.id === track.id ? "default" : "ghost"}
                  size="sm"
                  className="justify-start"
                  onClick={() => selectTrack(track)}
                >
                  {currentTrack.id === track.id && isPlaying ? (
                    <span className="relative mr-2 flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-white"></span>
                    </span>
                  ) : null}
                  {track.label}
                </Button>
              ))}
            </div>

            <div className="border-t pt-2">
              <div className="flex items-center gap-2">
                {volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                <Slider
                  value={[volume]}
                  max={1}
                  step={0.01}
                  onValueChange={([v]) => setVolume(v)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <div className="bg-border mx-1 h-4 w-px" />

      <span className="w-16 truncate text-center text-xs font-medium">{currentTrack.label}</span>

      <Button
        variant="ghost"
        size="icon"
        className="hover:bg-background h-8 w-8 rounded-full"
        onClick={togglePlay}
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
    </div>
  );
}
