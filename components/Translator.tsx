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
  const [translationError, setTranslationError] = useState('');


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
        setTranslationError('');
    }
  }, [transcript]);


  const handleTranslate = async () => {
    if (!japaneseText.trim() || disabled) return;
    setIsTranslating(true);
    setTranslationResult(null);
    setTranslationError('');

    const result = await translateJapaneseToEnglish(japaneseText);
    setIsTranslating(false);

    if (result?.main) {
      setTranslationResult(result);
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(result.main);
        utterance.lang = 'en-US';
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }
    } else {
      setTranslationError('翻訳に失敗しました。もう一度お試しください。');
    }
  };

  const handleSend = () => {
    if (!translationResult?.main.trim() || disabled) return;
    onSend(translationResult.main);
    setJapaneseText('');
    setTranslationResult(null);
    setTranslationError('');
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
    <div className="flex flex-col p-3 bg-white/80 backdrop-blur-sm rounded-xl shadow-md h-full">
      <h2 className="text-lg font-semibold mb-2 text-green-600">翻訳サポート</h2>
      <div className="relative w-full">
        <textarea
            value={japaneseText}
            onChange={(e) => {
                setJapaneseText(e.target.value)
                setTranslationError('');
            }}
            placeholder="困った時は日本語で入力・音声入力..."
            className="w-full h-20 p-2 pr-12 bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-800 resize-none"
            disabled={disabled}
        />
        {hasRecognitionSupport && (
             <button
                onClick={handleMicClick}
                disabled={disabled}
                className={`absolute top-2 right-2 p-1 rounded-full transition-colors ${
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
        className="mt-2 w-full flex items-center justify-center px-4 py-2 bg-emerald-500 text-white font-semibold rounded-md hover:bg-emerald-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isTranslating ? (
          <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
        ) : (
          <>
            <TranslateIcon className="w-5 h-5 mr-2" />
            <span>英語に翻訳</span>
          </>
        )}
      </button>

      {translationError && <p className="text-red-500 mt-2 text-sm text-center">{translationError}</p>}

      {translationResult && translationResult.main && (
        <div className="mt-3 p-2 bg-emerald-50 rounded-md border border-gray-200">
            <p className="font-semibold text-gray-800">{translationResult.main}</p>
            <button
                onClick={handleSend}
                disabled={disabled}
                className="mt-2 w-full flex items-center justify-center px-4 py-2 bg-green-500 text-white font-semibold rounded-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
                <SendIcon className="w-5 h-5 mr-2" />
                <span>チャットに送信</span>
            </button>
        </div>
      )}
    </div>
  );
};