import { useState, useEffect, useRef } from 'react';
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

  useEffect(() => {
    if (!isRecording) {
      // Stop recording
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
        
        if (!data.key) {
            console.error("No Deepgram key found");
            return;
        }

        const deepgram = createClient(data.key);

        // 2. Setup WebSocket
        deepgramLive.current = deepgram.listen.live({
            model: "nova-2",
            language: "en-US",
            smart_format: true,
            interim_results: true,
            diarize: true,
        });

        // 3. Listen for events
        deepgramLive.current.on(LiveTranscriptionEvents.Open, () => {
            console.log("Deepgram connected");
            
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

        // 4. Start Audio
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder.current = new MediaRecorder(stream);

        mediaRecorder.current.ondataavailable = (event) => {
            if (event.data.size > 0 && deepgramLive.current) {
                deepgramLive.current.send(event.data);
            }
        };

        mediaRecorder.current.start(250); // Send chunk every 250ms

      } catch (e) {
        console.error("Error starting Deepgram:", e);
      }
    };

    startRecording();

    return () => {
        if (mediaRecorder.current) mediaRecorder.current.stop();
        if (deepgramLive.current) deepgramLive.current.finish();
    };
  }, [isRecording]);

  return { segments, interimResult };
}
