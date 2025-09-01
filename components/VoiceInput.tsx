import React, { useEffect } from 'react';
import { MicrophoneIcon } from './icons';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';


interface VoiceInputProps {
  onTranscriptReceived: (transcript: string) => void;
  disabled: boolean;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscriptReceived, disabled }) => {
  const { 
    isListening, 
    transcript, 
    error, 
    startListening, 
    stopListening,
    resetTranscript,
    hasRecognitionSupport
  } = useSpeechRecognition({ lang: 'en-US' });

  useEffect(() => {
    // When a final transcript is received, send it and then reset it
    // to prevent re-sending on subsequent re-renders.
    if (transcript) {
        onTranscriptReceived(transcript);
        resetTranscript();
    }
  }, [transcript, onTranscriptReceived, resetTranscript]);
  
  const handleMicClick = () => {
    if (disabled || !hasRecognitionSupport) return;

    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-3 bg-white/80 backdrop-blur-sm rounded-xl shadow-md h-full">
      <h2 className="text-lg font-semibold mb-2 text-emerald-600">英語で話してみてください</h2>
      <p className="text-gray-500 mb-3 h-4 text-xs">{isListening ? "聞き取り中..." : "マイクをタップして話す"}</p>
      <button
        onClick={handleMicClick}
        disabled={disabled || !hasRecognitionSupport}
        className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-200 ease-in-out
          ${isListening ? 'bg-red-500 shadow-red-500/50 scale-110 animate-pulse' : 'bg-emerald-500 hover:bg-emerald-600'}
          ${disabled ? 'bg-gray-400 cursor-not-allowed' : ''}
          shadow-lg focus:outline-none focus:ring-4 focus:ring-emerald-300`}
          aria-label={isListening ? "録音停止" : "録音開始"}
      >
        <MicrophoneIcon className="w-12 h-12 text-white" />
      </button>
      {error && <p className="text-red-500 mt-2 text-center text-sm">{error}</p>}
    </div>
  );
};