import React, { useState, useEffect } from 'react';
import { translateJapaneseToEnglish } from '../services/geminiService';
import { SendIcon, TranslateIcon, MicrophoneIcon } from './icons';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';


interface TranslatorProps {
  onSend: (englishText: string) => void;
  disabled: boolean;
}

export const Translator: React.FC<TranslatorProps> = ({ onSend, disabled }) => {
  const [japaneseText, setJapaneseText] = useState('');
  const [translationResult, setTranslationResult] = useState<{ main: string } | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    hasRecognitionSupport
  } = useSpeechRecognition({ lang: 'ja-JP' });

  useEffect(() => {
    if (transcript) {
        setJapaneseText(prevText => prevText ? `${prevText} ${transcript}` : transcript);
    }
  }, [transcript]);


  const handleTranslate = async () => {
    if (!japaneseText.trim() || disabled) return;
    setIsTranslating(true);
    setTranslationResult(null);
    const result = await translateJapaneseToEnglish(japaneseText);
    setTranslationResult(result);
    setIsTranslating(false);

    if (result?.main && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(result.main);
      utterance.lang = 'en-US';
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSend = () => {
    if (!translationResult?.main.trim() || disabled) return;
    onSend(translationResult.main);
    setJapaneseText('');
    setTranslationResult(null);
  };
  
  const handleMicClick = () => {
      if (disabled) return;
      if (isListening) {
          stopListening();
      } else {
          startListening();
      }
  };

  return (
    <div className="flex flex-col p-4 bg-white rounded-lg shadow-md mt-6">
      <h2 className="text-xl font-bold mb-4 text-green-600">Help Me Say...</h2>
      <div className="relative w-full">
        <textarea
            value={japaneseText}
            onChange={(e) => setJapaneseText(e.target.value)}
            placeholder="困った時は日本語で入力・音声入力..."
            className="w-full h-24 p-2 pr-12 bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-800 resize-none"
            disabled={disabled}
        />
        {hasRecognitionSupport && (
             <button
                onClick={handleMicClick}
                disabled={disabled}
                className={`absolute top-3 right-3 p-1 rounded-full transition-colors ${
                    isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-500 hover:bg-gray-200'
                } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                aria-label={isListening ? 'マイクをオフにする' : 'マイクをオンにする'}
            >
                <MicrophoneIcon className="w-6 h-6"/>
            </button>
        )}
      </div>
      <button
        onClick={handleTranslate}
        disabled={disabled || isTranslating || !japaneseText.trim()}
        className="mt-3 w-full flex items-center justify-center px-4 py-2 bg-emerald-500 text-white font-semibold rounded-md hover:bg-emerald-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isTranslating ? (
          <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
        ) : (
          <>
            <TranslateIcon className="w-5 h-5 mr-2" />
            <span>Translate to English</span>
          </>
        )}
      </button>

      {translationResult && translationResult.main && (
        <div className="mt-4 p-3 bg-emerald-50 rounded-md border border-gray-200">
            <p className="font-semibold text-gray-800">{translationResult.main}</p>
            <button
                onClick={handleSend}
                disabled={disabled}
                className="mt-3 w-full flex items-center justify-center px-4 py-2 bg-green-500 text-white font-semibold rounded-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
                <SendIcon className="w-5 h-5 mr-2" />
                <span>Send to Chat</span>
            </button>
        </div>
      )}
    </div>
  );
};