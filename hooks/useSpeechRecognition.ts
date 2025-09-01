import { useState, useEffect, useCallback, useRef } from 'react';

// --- START: Type definitions for Web Speech API ---
interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
}

interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
}

type SpeechRecognitionErrorCode =
  | 'no-speech'
  | 'aborted'
  | 'audio-capture'
  | 'network'
  | 'not-allowed'
  | 'service-not-allowed'
  | 'bad-grammar'
  | 'language-not-supported';

interface SpeechRecognitionErrorEvent extends Event {
    readonly error: SpeechRecognitionErrorCode;
    readonly message: string;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    lang: string;
    interimResults: boolean;
    maxAlternatives: number;
    onend: (() => void) | null;
    start(): void;
    stop(): void;
    abort(): void;
}

interface SpeechRecognitionStatic {
    new(): SpeechRecognition;
}

declare global {
    interface Window {
        SpeechRecognition: SpeechRecognitionStatic;
        webkitSpeechRecognition: SpeechRecognitionStatic;
    }
}
// --- END: Type definitions for Web Speech API ---

const SpeechRecognitionAPI = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;

interface UseSpeechRecognitionOptions {
  lang: string;
}

export const useSpeechRecognition = ({ lang }: UseSpeechRecognitionOptions) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (!SpeechRecognitionAPI) {
        setError("Speech recognition not supported in this browser.");
        return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.lang = lang;
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    const handleResult = (event: Event) => {
        const speechEvent = event as SpeechRecognitionEvent;
        const lastResult = speechEvent.results[speechEvent.results.length - 1];
        if (lastResult.isFinal) {
            setTranscript(lastResult[0].transcript.trim());
        }
    };
    
    const handleError = (event: Event) => {
        const errorEvent = event as SpeechRecognitionErrorEvent;
        if (errorEvent.error === 'not-allowed' || errorEvent.error === 'service-not-allowed') {
            setError("Microphone access denied. Please enable it in your browser settings.");
        } else {
            // Don't show an error for 'no-speech' as it's a common occurrence
            if(errorEvent.error !== 'no-speech') {
               setError(`Speech recognition error: ${errorEvent.error}`);
            }
        }
        setIsListening(false);
    };

    const handleEnd = () => {
        setIsListening(false);
    };

    recognition.addEventListener('result', handleResult);
    recognition.addEventListener('error', handleError);
    recognition.addEventListener('end', handleEnd);

    return () => {
        recognition.removeEventListener('result', handleResult);
        recognition.removeEventListener('error', handleError);
        recognition.removeEventListener('end', handleEnd);
        recognition.abort();
    };
  }, [lang]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
        try {
            setError('');
            setTranscript('');
            recognitionRef.current.start();
            setIsListening(true);
        } catch (e) {
            console.error("Could not start recognition", e);
            setError("Could not start recording. Is another app using the mic?");
            setIsListening(false);
        }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);
  
  return {
      isListening,
      transcript,
      error,
      startListening,
      stopListening,
      resetTranscript,
      hasRecognitionSupport: !!SpeechRecognitionAPI
  };
};