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
    interimTranscript, 
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
    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 text-emerald-600">英語で話してみよう</h2>
      <div className="mb-4 h-12 flex items-center justify-center">
        {isListening ? (
          <div className="text-center">
            <p className="text-gray-500 text-sm">聞き取り中...</p>
            {interimTranscript && (
              <p className="text-gray-700 text-sm mt-1 italic">{interimTranscript}</p>
            )}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">マイクをタップして話す</p>
        )}
      </div>
      <button
        onClick={handleMicClick}
        disabled={disabled || !hasRecognitionSupport}
        className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-200 ease-in-out
          ${isListening ? 'bg-red-500 shadow-red-500/50 scale-110 animate-pulse' : 'bg-emerald-500 hover:bg-emerald-600'}
          ${disabled ? 'bg-gray-400 cursor-not-allowed' : ''}
          shadow-lg focus:outline-none focus:ring-4 focus:ring-emerald-300`}
          aria-label={isListening ? "Stop recording" : "Start recording"}
      >
        <MicrophoneIcon className="w-12 h-12 text-white" />
      </button>
      {error && <p className="text-red-500 mt-4 text-center text-sm">{error}</p>}
      {!hasRecognitionSupport && <p className="text-red-500 mt-4 text-center text-sm">このブラウザは音声認識に対応していません。</p>}
    </div>
  );
};