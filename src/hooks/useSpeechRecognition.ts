import { useState, useEffect, useRef } from 'react';

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
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          if (finalTranscript) {
             const newSegment = {
                 id: Date.now(),
                 speaker: "You", // In a real app, we'd need speaker diarization (server-side)
                 text: finalTranscript,
                 time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                 isFinal: true
             };
             setSegments(prev => [...prev, newSegment]);
             setInterimResult('');
          } else {
              setInterimResult(interimTranscript);
          }
        };

        recognition.onerror = (event: any) => {
            if (event.error === 'no-speech') {
                return; // Ignore silence
            }
            console.error("Speech recognition error", event.error);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  useEffect(() => {
      if (!recognitionRef.current) return;

      if (isRecording) {
          try {
            recognitionRef.current.start();
          } catch (e) {
             // Already started
          }
      } else {
          recognitionRef.current.stop();
      }
  }, [isRecording]);

  return { segments, interimResult };
}
