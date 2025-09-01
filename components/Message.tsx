
import React, { useEffect } from 'react';
import { ChatMessage, MessageSender } from '../types';
import { SpeakerIcon, AiIcon, NewsIcon } from './icons';

interface MessageProps {
  message: ChatMessage;
}

export const Message: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.sender === MessageSender.USER;

  useEffect(() => {
    if (!isUser && message.englishText && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message.englishText);
      utterance.lang = 'en-US';
      window.speechSynthesis.cancel(); // Cancel any previous speech
      window.speechSynthesis.speak(utterance);
    }
    return () => {
        if (!isUser) {
            window.speechSynthesis.cancel();
        }
    }
  }, [message.id, message.englishText, isUser]);

  const handleReplay = () => {
    if ('speechSynthesis' in window && message.englishText) {
      const utterance = new SpeechSynthesisUtterance(message.englishText);
      utterance.lang = 'en-US';
      window.speechSynthesis.cancel(); // Stop any current speech
      window.speechSynthesis.speak(utterance);
    }
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
             {!isUser && (
                <button
                    onClick={handleReplay}
                    className="text-gray-400 hover:text-green-500 transition-colors focus:outline-none flex-shrink-0"
                    aria-label="Read message aloud again"
                >
                    <SpeakerIcon className="w-5 h-5" />
                </button>
            )}
        </div>
        
        {!isUser && (message.japaneseText || message.source || (message.replySuggestions && message.replySuggestions.length > 0)) && (
            <div className="pt-2 mt-2 border-t border-gray-200 space-y-3">
                {message.japaneseText && (
                    <p className="text-sm text-gray-500 font-light">{message.japaneseText}</p>
                )}
                {message.source && (
                    <div>
                        <h4 className="font-semibold text-sm text-green-700 mb-1 flex items-center">
                            <NewsIcon className="w-4 h-4 mr-1.5 flex-shrink-0" />
                            <span>Based on this news:</span>
                        </h4>
                        <a href={message.source.uri} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-700 hover:underline hover:text-emerald-800 transition-colors">
                            {message.source.title}
                        </a>
                    </div>
                )}
                {message.replySuggestions && message.replySuggestions.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-sm text-green-700 mb-1">Suggestions for your reply:</h4>
                        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 font-light">
                            {message.replySuggestions.map((suggestion, index) => (
                                <li key={index}>
                                    {suggestion.english}
                                    <span className="text-gray-500/80 ml-2">({suggestion.japanese})</span>
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
