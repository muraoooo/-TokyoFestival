import React, { useState, useEffect } from 'react';
import { ChatMessage, MessageSender } from '../types';
import { SpeakerIcon, AiIcon, NewsIcon, EyeIcon, ChevronIcon } from './icons';

interface MessageProps {
  message: ChatMessage;
}

export const Message: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.sender === MessageSender.USER;
  const [showTranslation, setShowTranslation] = useState(false);

  const speak = (text: string) => {
    // Cancel any ongoing speech
    speechSynthesis.cancel();
    
    const uttr = new SpeechSynthesisUtterance(text);
    uttr.rate = parseFloat(localStorage.getItem('speechRate') || '0.9');
    uttr.pitch = 1.0;
    uttr.volume = 1.0;
    
    // Get available voices
    const voices = speechSynthesis.getVoices();
    
    // Mac system voice priority list
    const macVoiceNames = [
      'Samantha', 'Alex', 'Victoria', 'Allison', 
      'Ava', 'Susan', 'Zoe', 'Tom', 'Siri'
    ];
    
    // Try to find a Mac system voice
    let selectedVoice = null;
    
    // First, try to find a preferred Mac voice
    for (const name of macVoiceNames) {
      selectedVoice = voices.find(v => 
        v.name.toLowerCase().includes(name.toLowerCase()) && 
        v.localService === true &&
        (v.lang === 'en-US' || v.lang.startsWith('en'))
      );
      if (selectedVoice) break;
    }
    
    // If no preferred voice found, use any English Mac system voice
    if (!selectedVoice) {
      selectedVoice = voices.find(v => 
        v.localService === true && 
        v.lang === 'en-US'
      ) || voices.find(v => 
        v.localService === true && 
        v.lang.startsWith('en')
      );
    }
    
    // Final fallback to any English voice
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang === 'en-US') || 
                      voices.find(v => v.lang.startsWith('en'));
    }
    
    if (selectedVoice) {
      uttr.voice = selectedVoice;
      uttr.lang = selectedVoice.lang;
      console.log('Using voice:', selectedVoice.name, '(System:', selectedVoice.localService, ')');
    } else {
      // Set language even if no voice is found
      uttr.lang = 'en-US';
      console.log('Using default voice');
    }
    
    speechSynthesis.speak(uttr);
  };

  useEffect(() => {
    if (!isUser && message.englishText) {
      // Auto-speak only if user has interacted with the page
      const hasUserInteracted = document.hasFocus() || 
                                localStorage.getItem('userInteracted') === 'true';
      
      if (hasUserInteracted) {
        const timer = setTimeout(() => {
          speak(message.englishText);
        }, 700); // Slightly longer delay for Mac voices to load
        return () => {
          clearTimeout(timer);
        };
      }
    }
  }, [isUser, message.englishText]);
  
  // Track user interaction
  useEffect(() => {
    const markInteraction = () => {
      localStorage.setItem('userInteracted', 'true');
    };
    
    window.addEventListener('click', markInteraction, { once: true });
    window.addEventListener('keydown', markInteraction, { once: true });
    
    return () => {
      window.removeEventListener('click', markInteraction);
      window.removeEventListener('keydown', markInteraction);
    };
  }, []);

  const handleReplay = () => {
    speak(message.englishText);
  };

  return (
    <div className={`flex items-start mb-4 gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
        {!isUser && (
            <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center flex-shrink-0">
                <AiIcon className="w-8 h-8 text-emerald-600" />
            </div>
        )}
      <div className={`max-w-xl lg:max-w-2xl px-4 py-3 rounded-2xl shadow-md ${isUser ? 'bg-green-500 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none'}`}>
        <div className="flex items-start justify-between">
            <p className="font-sans text-base mr-4 flex-grow">{message.englishText}</p>
            <div className="flex items-center gap-1">
              {message.japaneseText && (
                <button
                    onClick={() => setShowTranslation(!showTranslation)}
                    className={`p-1.5 rounded-lg transition-all ${
                      isUser 
                        ? 'hover:bg-white/20 text-white/80 hover:text-white' 
                        : 'hover:bg-emerald-50 text-gray-500 hover:text-emerald-600'
                    } ${showTranslation ? (isUser ? 'bg-white/20' : 'bg-emerald-50 text-emerald-600') : ''}`}
                    aria-label={showTranslation ? "翻訳を非表示" : "翻訳を表示"}
                >
                    <EyeIcon className="w-5 h-5" isOpen={showTranslation} />
                </button>
              )}
              {!isUser && (
                <button
                    onClick={handleReplay}
                    className="p-1.5 rounded-lg transition-all hover:bg-green-50 text-gray-500 hover:text-green-600"
                    aria-label="英語を読み上げる"
                >
                    <SpeakerIcon className="w-5 h-5" />
                </button>
              )}
            </div>
        </div>
        
        {isUser && showTranslation && message.japaneseText && (
          <div className="pt-2 mt-2 border-t border-white/30">
            <p className="text-sm text-white/90 font-light italic">{message.japaneseText}</p>
          </div>
        )}
        
        {!isUser && showTranslation && (message.japaneseText || message.source || (message.replySuggestions && message.replySuggestions.length > 0)) && (
            <div className="pt-2 mt-2 border-t border-gray-200 space-y-3">
                {message.japaneseText && (
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-sm text-gray-600 font-light">{message.japaneseText}</p>
                    </div>
                )}
                {message.source && (
                    <div>
                        <h4 className="font-semibold text-sm text-green-700 mb-1 flex items-center">
                            <NewsIcon className="w-4 h-4 mr-1.5 flex-shrink-0" />
                            <span>参考にしたニュース:</span>
                        </h4>
                        <a href={message.source.uri} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-700 hover:underline hover:text-emerald-800 transition-colors">
                            {message.source.title}
                        </a>
                    </div>
                )}
                {message.replySuggestions && message.replySuggestions.length > 0 && (
                    <div className="bg-emerald-50 rounded-lg p-3">
                        <h4 className="font-semibold text-sm text-green-700 mb-2 flex items-center">
                          <ChevronIcon className="w-4 h-4 mr-1" isOpen={true} />
                          返信のヒント:
                        </h4>
                        <ul className="space-y-2">
                            {message.replySuggestions.map((suggestion, index) => (
                                <li key={index} className="text-sm">
                                    <span className="font-medium text-gray-800">{suggestion.english}</span>
                                    <span className="text-gray-500 ml-2 text-xs">({suggestion.japanese})</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};