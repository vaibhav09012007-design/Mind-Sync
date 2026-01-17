import { useState, useEffect, useRef, useCallback } from "react";

export interface SpeechSegment {
  id: number;
  speaker: string;
  text: string;
  time: string;
  isFinal: boolean;
}

// Check if browser supports Web Speech API
const isBrowserSpeechSupported =
  typeof window !== "undefined" &&
  ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

export function useBrowserSpeechRecognition(isRecording: boolean) {
  const [segments, setSegments] = useState<SpeechSegment[]>([]);
  const [interimResult, setInterimResult] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      return;
    }

    if (!isBrowserSpeechSupported) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(
        "Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari."
      );
      return;
    }

    try {
      // Create speech recognition instance
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setError(null);
        console.log("Speech recognition started");
      };

      recognition.onresult = (event: any) => {
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

      recognition.onerror = (event: any) => {
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
            } catch (e) {
              console.log("Could not restart recognition");
            }
          }, 100);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error("Error starting speech recognition:", err);
      setError("Failed to start speech recognition");
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
