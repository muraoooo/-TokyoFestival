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
  const speechEndTimeoutRef = useRef<number | null>(null);
  const finalTranscriptRef = useRef<string>('');

  useEffect(() => {
    if (!SpeechRecognitionAPI) {
        setError("お使いのブラウザは音声認識に対応していません。");
        return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true; // Keep listening through pauses.
    recognition.lang = lang;
    recognition.interimResults = true; // Get results as they come in.
    recognitionRef.current = recognition;

    const handleResult = (event: Event) => {
        const speechEvent = event as SpeechRecognitionEvent;
        
        if (speechEndTimeoutRef.current) {
            clearTimeout(speechEndTimeoutRef.current);
        }

        const fullTranscript = Array.from(speechEvent.results)
            .map(result => result[0].transcript)
            .join('');
        
        finalTranscriptRef.current = fullTranscript;
        
        // Set a timeout to stop recognition after a pause.
        speechEndTimeoutRef.current = window.setTimeout(() => {
            recognitionRef.current?.stop();
        }, 800); // 800ms pause detection
    };
    
    const handleError = (event: Event) => {
        const errorEvent = event as SpeechRecognitionErrorEvent;
        if (errorEvent.error === 'not-allowed' || errorEvent.error === 'service-not-allowed') {
            setError("マイクへのアクセスが拒否されました。ブラウザの設定で許可してください。");
        } else {
            // Don't show an error for 'no-speech' or 'aborted' as it's common and our timeout handles it
            if(errorEvent.error !== 'no-speech' && errorEvent.error !== 'aborted') {
               setError(`音声認識エラー: ${errorEvent.error}`);
            }
        }
        setIsListening(false);
    };

    const handleEnd = () => {
        if (speechEndTimeoutRef.current) {
            clearTimeout(speechEndTimeoutRef.current);
        }
        if (finalTranscriptRef.current) {
            setTranscript(finalTranscriptRef.current);
        }
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
        if (speechEndTimeoutRef.current) {
            clearTimeout(speechEndTimeoutRef.current);
        }
    };
  }, [lang]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
        try {
            setError('');
            setTranscript('');
            finalTranscriptRef.current = '';
            recognitionRef.current.start();
            setIsListening(true);
        } catch (e) {
            console.error("Could not start recognition", e);
            setError("録音を開始できませんでした。他のアプリがマイクを使用していませんか？");
            setIsListening(false);
        }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
        if (speechEndTimeoutRef.current) {
            clearTimeout(speechEndTimeoutRef.current);
        }
        recognitionRef.current.stop();
        // The 'onend' event will handle the rest of the state updates.
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    finalTranscriptRef.current = '';
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