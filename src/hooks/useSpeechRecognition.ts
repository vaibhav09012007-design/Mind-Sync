import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient, LiveClient, LiveTranscriptionEvents } from "@deepgram/sdk";

export interface SpeechSegment {
  id: number;
  speaker: string;
  text: string;
  time: string;
  isFinal: boolean;
}

export function useSpeechRecognition(isRecording: boolean) {
  const [segments, setSegments] = useState<SpeechSegment[]>([]);
  const [interimResult, setInterimResult] = useState<string>('');
  
  const deepgramLive = useRef<LiveClient | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const audioDestination = useRef<MediaStreamAudioDestinationNode | null>(null);
  const micSource = useRef<MediaStreamAudioSourceNode | null>(null);
  const sysSource = useRef<MediaStreamAudioSourceNode | null>(null);

  // Initialize Audio Context & Mixer
  const initMixer = useCallback(() => {
      if (!audioContext.current) {
          audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          audioDestination.current = audioContext.current.createMediaStreamDestination();
      }
      return { ctx: audioContext.current, dest: audioDestination.current! };
  }, []);

  const startSystemAudio = async () => {
      try {
          const sysStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
          
          // Check if user actually shared audio
          if (sysStream.getAudioTracks().length === 0) {
              console.warn("No system audio track found. Did you check 'Share tab audio'?");
              sysStream.getTracks().forEach(t => t.stop());
              return;
          }

          const { ctx, dest } = initMixer();
          
          // Connect System to Mixer
          sysSource.current = ctx.createMediaStreamSource(sysStream);
          sysSource.current.connect(dest);

          // Stop handling when user stops sharing
          sysStream.getVideoTracks()[0].onended = () => {
              sysSource.current?.disconnect();
              sysSource.current = null;
          };

      } catch (err) {
          console.error("Error sharing system audio:", err);
      }
  };

  useEffect(() => {
    if (!isRecording) {
      // Cleanup
      if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
        mediaRecorder.current.stop();
      }
      if (deepgramLive.current) {
        deepgramLive.current.finish();
        deepgramLive.current = null;
      }
      return;
    }

    const startRecording = async () => {
      try {
        // 1. Get Key
        const response = await fetch("/api/deepgram");
        const data = await response.json();
        if (!data.key) return;

        const deepgram = createClient(data.key);

        // 2. Setup Deepgram
        deepgramLive.current = deepgram.listen.live({
            model: "nova-2",
            language: "en-US",
            smart_format: true,
            interim_results: true,
            diarize: true,
        });

        // 3. Events
        deepgramLive.current.on(LiveTranscriptionEvents.Open, () => {
            deepgramLive.current?.on(LiveTranscriptionEvents.Transcript, (data) => {
                const transcript = data.channel.alternatives[0].transcript;
                if (!transcript) return;

                const isFinal = data.is_final;
                const speakerId = data.channel.alternatives[0].words?.[0]?.speaker || 0;
                
                if (isFinal) {
                    setSegments(prev => [...prev, {
                        id: Date.now(),
                        speaker: speakerId === 0 ? "You" : `Speaker ${speakerId}`,
                        text: transcript,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        isFinal: true
                    }]);
                    setInterimResult("");
                } else {
                    setInterimResult(transcript);
                }
            });
        });

        // 4. Setup Audio Chain
        const { ctx, dest } = initMixer();

        // Mic Stream
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micSource.current = ctx.createMediaStreamSource(micStream);
        micSource.current.connect(dest);

        // Recorder listens to the DESTINATION (Mixed) stream
        mediaRecorder.current = new MediaRecorder(dest.stream);

        mediaRecorder.current.ondataavailable = (event) => {
            if (event.data.size > 0 && deepgramLive.current) {
                deepgramLive.current.send(event.data);
            }
        };

        mediaRecorder.current.start(250);

      } catch (e) {
        console.error("Error starting Deepgram:", e);
      }
    };

    startRecording();

    return () => {
        // Cleanup sources on unmount
        micSource.current?.disconnect();
        sysSource.current?.disconnect();
        if (mediaRecorder.current) mediaRecorder.current.stop();
        if (deepgramLive.current) deepgramLive.current.finish();
    };
  }, [isRecording, initMixer]);

  return { segments, interimResult, startSystemAudio };
}
