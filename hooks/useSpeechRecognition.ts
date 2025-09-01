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
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!SpeechRecognitionAPI) {
        setError("Speech recognition not supported in this browser.");
        return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true; // 継続的に聞き取る
    recognition.lang = lang;
    recognition.interimResults = true; // 途中経過も表示
    recognitionRef.current = recognition;

    const handleResult = (event: Event) => {
        const speechEvent = event as SpeechRecognitionEvent;
        let interimText = '';
        let finalText = '';
        
        for (let i = speechEvent.resultIndex; i < speechEvent.results.length; i++) {
            const result = speechEvent.results[i];
            if (result.isFinal) {
                finalText += result[0].transcript;
            } else {
                interimText += result[0].transcript;
            }
        }
        
        if (finalText) {
            setTranscript(prev => prev + (prev ? ' ' : '') + finalText.trim());
            setInterimTranscript('');
        } else {
            setInterimTranscript(interimText);
        }
        
        // 話し終わったら0.8秒後に自動的に認識を終了
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            if (recognitionRef.current && isListening) {
                recognitionRef.current.stop();
            }
        }, 800);
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
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    };

    recognition.addEventListener('result', handleResult);
    recognition.addEventListener('error', handleError);
    recognition.addEventListener('end', handleEnd);

    return () => {
        recognition.removeEventListener('result', handleResult);
        recognition.removeEventListener('error', handleError);
        recognition.removeEventListener('end', handleEnd);
        recognition.abort();
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    };
  }, [lang, isListening]);

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
    setInterimTranscript('');
  }, []);
  
  return {
      isListening,
      transcript,
      interimTranscript,
      error,
      startListening,
      stopListening,
      resetTranscript,
      hasRecognitionSupport: !!SpeechRecognitionAPI
  };
};