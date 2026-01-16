"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Volume2, VolumeX, Play, Pause, Music } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSoundscapes, NoiseType } from "@/hooks/use-soundscapes";

const SOUNDSCAPES: { id: NoiseType; label: string; description: string }[] = [
  {
    id: "pink",
    label: "Rain",
    description: "Soothing pink noise",
  },
  {
    id: "white",
    label: "White Noise",
    description: "Consistent masking sound",
  },
  {
    id: "brown",
    label: "Deep Focus",
    description: "Deep rumbling brown noise",
  },
];

export function AudioPlayer() {
  const { isPlaying, activeType, volume, play, stop, toggle, setVolume } = useSoundscapes();
  const [selectedTrack, setSelectedTrack] = useState(SOUNDSCAPES[0]);

  const selectTrack = (track: (typeof SOUNDSCAPES)[0]) => {
    if (track.id === activeType && isPlaying) {
      // Same track playing, just return
      return;
    }
    setSelectedTrack(track);
    play(track.id);
  };

  return (
    <div className="bg-muted/50 flex items-center gap-2 rounded-full border p-2 shadow-sm">
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
                  variant={activeType === track.id && isPlaying ? "default" : "ghost"}
                  size="sm"
                  className="justify-start"
                  onClick={() => selectTrack(track)}
                >
                  {activeType === track.id && isPlaying ? (
                    <span className="relative mr-2 flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-white"></span>
                    </span>
                  ) : null}
                  <span className="flex flex-col items-start">
                    <span>{track.label}</span>
                    <span className="text-muted-foreground text-xs font-normal">
                      {track.description}
                    </span>
                  </span>
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

      <span className="w-16 truncate text-center text-xs font-medium">
        {isPlaying ? selectedTrack.label : "Off"}
      </span>

      <Button
        variant="ghost"
        size="icon"
        className="hover:bg-background h-8 w-8 rounded-full"
        onClick={toggle}
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
    </div>
  );
}
