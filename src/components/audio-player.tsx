"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Volume2, VolumeX, Play, Pause, Music } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const SOUNDSCAPES = [
  {
    id: "rain",
    label: "Rain",
    src: "https://assets.mixkit.co/sfx/preview/mixkit-light-rain-loop-2393.mp3",
  },
  {
    id: "forest",
    label: "Forest",
    src: "https://assets.mixkit.co/sfx/preview/mixkit-forest-birds-ambience-1210.mp3",
  },
  {
    id: "white-noise",
    label: "White Noise",
    src: "https://assets.mixkit.co/sfx/preview/mixkit-radio-static-noise-1221.mp3",
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
  const [audioError, setAudioError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Create audio element lazily only when needed
  const getOrCreateAudio = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.loop = true;
      audio.preload = "none";
      audio.onerror = () => {
        console.warn("Audio source failed to load:", currentTrack.label);
        setAudioError(true);
        setIsPlaying(false);
      };
      audioRef.current = audio;
    }
    return audioRef.current;
  }, [currentTrack.label]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Handle play/pause
  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.play().catch((e) => {
        console.warn("Audio playback error:", e);
        setAudioError(true);
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Handle track change
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = currentTrack.src;
      setAudioError(false);
      if (isPlaying) {
        audioRef.current.play().catch((e) => {
          console.warn("Audio playback error:", e);
          setAudioError(true);
          setIsPlaying(false);
        });
      }
    }
  }, [currentTrack, isPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const togglePlay = () => {
    // Lazily create audio element on first play
    const audio = getOrCreateAudio();
    if (!audio.src || audio.src !== currentTrack.src) {
      audio.src = currentTrack.src;
      audio.volume = volume;
    }
    setAudioError(false);
    setIsPlaying(!isPlaying);
  };

  const selectTrack = (track: typeof currentTrack) => {
    if (currentTrack.id === track.id) return;

    setCurrentTrack(track);
    setAudioError(false);

    // If not already playing, start playback
    if (!isPlaying) {
      const audio = getOrCreateAudio();
      audio.src = track.src;
      audio.volume = volume;
      setIsPlaying(true);
    }
  };

  return (
    <div className="bg-muted/50 flex items-center gap-2 rounded-full border p-2 shadow-sm">
      {/* No audio element in DOM - created dynamically */}

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

            {audioError && (
              <p className="text-xs text-amber-400">Audio unavailable. Try another track.</p>
            )}

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
