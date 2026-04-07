import { useState, useEffect, useRef } from "react";

// Web Speech API types (not yet in standard TypeScript lib)
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: ((event: Event) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((event: Event) => void) | null;
}

export interface SpeechSegment {
  id: number;
  speaker: string;
  text: string;
  time: string;
  isFinal: boolean;
}

// Helper to get Constructor
const getSpeechRecognitionCtor = () => {
  if (typeof window === "undefined") return null;
  return (
    (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition ||
    null
  );
};
const SpeechRecognitionCtor = getSpeechRecognitionCtor();
const isBrowserSpeechSupported = !!SpeechRecognitionCtor;

export function useBrowserSpeechRecognition(isRecording: boolean) {
  const [segments, setSegments] = useState<SpeechSegment[]>([]);
  const [interimResult, setInterimResult] = useState<string>("");
  const [error, setError] = useState<string | null>(
    isBrowserSpeechSupported
      ? null
      : "Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari."
  );
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    if (!isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      return;
    }

    if (!isBrowserSpeechSupported) {
      return;
    }

    try {
      const recognition = new SpeechRecognitionCtor!();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setError(null);
        console.log("Speech recognition started");
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setSegments((prev) => [
            ...prev,
            {
              id: Date.now(),
              speaker: "You",
              text: finalTranscript.trim(),
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              isFinal: true,
            },
          ]);
          setInterimResult("");
        } else {
          setInterimResult(interimTranscript);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          setError(
            "Microphone access denied. Please allow microphone access in your browser settings."
          );
        } else if (event.error === "no-speech") {
          // Restart on no speech
          recognition.stop();
          setTimeout(() => {
            if (isRecording) recognition.start();
          }, 100);
        } else {
          setError(`Speech recognition error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        // Auto-restart if still recording
        if (isRecording) {
          setTimeout(() => {
            try {
              recognition.start();
            } catch {
              console.log("Could not restart recognition");
            }
          }, 100);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error("Error starting speech recognition:", err);
      setTimeout(() => setError("Failed to start speech recognition"), 0);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, [isRecording]);

  const startSystemAudio = async () => {
    // Browser speech API doesn't support system audio
    // Show a message to the user
    console.log("System audio capture requires screen sharing with Deepgram");
  };

  return {
    segments,
    interimResult,
    error,
    startSystemAudio,
    isSupported: isBrowserSpeechSupported,
  };
}

export default useBrowserSpeechRecognition;
