import React, { useEffect, useRef } from 'react';
import { ChatMessage, NewsHeadline } from '../types';
import { Message } from './Message';
import { NewsIcon } from './icons';

interface ChatAreaProps {
  messages: ChatMessage[];
  isLoading: boolean;
  newsHeadlines?: NewsHeadline[];
  showNewsSelector?: boolean;
  onNewsSelect?: (headline: NewsHeadline) => void;
}

const TypingIndicator: React.FC = () => (
    <div className="flex justify-start mb-4">
        <div className="bg-white rounded-2xl rounded-bl-none p-3 shadow-md flex items-center space-x-1.5">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-225"></div>
        </div>
    </div>
);

const NewsSelector: React.FC<{
    headlines: NewsHeadline[];
    onSelect: (headline: NewsHeadline) => void;
}> = ({ headlines, onSelect }) => (
    <div className="my-4 p-4 bg-emerald-200/50 rounded-lg">
        <h2 className="text-lg font-bold text-emerald-700 mb-3 text-center">次の話題に、こんなニュースはいかがですか？</h2>
        <div className="w-full max-w-2xl mx-auto space-y-3">
            {headlines.map((headline, index) => (
                <button
                    key={index}
                    onClick={() => onSelect(headline)}
                    className="w-full text-left p-4 bg-white rounded-lg shadow-md hover:shadow-lg hover:bg-emerald-50 border border-transparent hover:border-emerald-300 transition-all transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    aria-label={`Select article: ${headline.title}`}
                >
                    <div className="flex items-start">
                        <NewsIcon className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-emerald-600" />
                        <div className="flex-grow">
                            <h3 className="font-bold text-emerald-800 text-base mb-1">
                                {headline.japaneseTitle || headline.title}
                            </h3>
                            {headline.japaneseTitle && (
                                <p className="text-sm text-gray-500 font-light mb-3">
                                    {headline.title}
                                </p>
                            )}
                            
                            <p className="text-sm text-gray-700 font-light">
                                {headline.japaneseSummary || headline.summary}
                            </p>
                            {headline.japaneseSummary && (
                                <p className="text-xs text-gray-500 font-light mt-1">
                                    {headline.summary}
                                </p>
                            )}
                        </div>
                    </div>
                </button>
            ))}
        </div>
    </div>
);


export const ChatArea: React.FC<ChatAreaProps> = ({ messages, isLoading, newsHeadlines = [], showNewsSelector = false, onNewsSelect = () => {} }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, showNewsSelector]);

  if (messages.length === 0 && isLoading) {
    return (
        <div className="h-full flex flex-col items-center justify-center p-4 bg-emerald-100/50 rounded-lg shadow-inner">
            <div className="w-8 h-8 border-4 border-t-transparent border-emerald-500 rounded-full animate-spin"></div>
            <p className="mt-3 text-gray-500">AIバディを起動中...</p>
        </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 md:p-6 bg-emerald-100/50 rounded-lg shadow-inner">
      <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
            <>
                {messages.map((msg) => (
                    <Message key={msg.id} message={msg} />
                ))}
                {isLoading && messages.length > 0 && <TypingIndicator />}
                {showNewsSelector && newsHeadlines.length > 0 && (
                    <NewsSelector headlines={newsHeadlines} onSelect={onNewsSelect} />
                )}
                <div ref={endOfMessagesRef} />
            </>
      </div>
       <style>{`
            .custom-scrollbar::-webkit-scrollbar {
                width: 8px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
                background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background-color: #9ca3af;
                border-radius: 20px;
                border: 3px solid transparent;
            }
        `}</style>
    </div>
  );
};