import React, { useEffect, useRef } from 'react';
import { ChatMessage, NewsHeadline } from '../types';
import { Message } from './Message';
import { NewsIcon, SearchIcon } from './icons';

interface ChatAreaProps {
  messages: ChatMessage[];
  isLoading: boolean;
  isSearching: boolean;
  newsHeadlines?: NewsHeadline[];
  showNewsSelector?: boolean;
  searchResults?: NewsHeadline[];
  showSearchResults?: boolean;
  onArticleSelect?: (headline: NewsHeadline) => void;
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

const SearchIndicator: React.FC = () => (
    <div className="flex justify-start mb-4">
        <div className="bg-white rounded-2xl rounded-bl-none p-3 shadow-md flex items-center space-x-2">
            <div className="w-5 h-5 border-2 border-t-transparent border-emerald-500 rounded-full animate-spin"></div>
            <span className="text-gray-500 text-sm">ウェブを検索中...</span>
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

const SearchResultSelector: React.FC<{
    results: NewsHeadline[];
    onSelect: (result: NewsHeadline) => void;
}> = ({ results, onSelect }) => (
    <div className="my-4 p-4 bg-blue-100/50 rounded-lg">
        <h2 className="text-lg font-bold text-blue-700 mb-3 text-center">調べてみました！こちらの情報はいかがですか？</h2>
        <div className="w-full max-w-2xl mx-auto space-y-3">
            {results.map((result, index) => (
                <button
                    key={index}
                    onClick={() => onSelect(result)}
                    className="w-full text-left p-4 bg-white rounded-lg shadow-md hover:shadow-lg hover:bg-blue-50 border border-transparent hover:border-blue-300 transition-all transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    aria-label={`Select article: ${result.title}`}
                >
                    <div className="flex items-start">
                        <SearchIcon className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-blue-600" />
                        <div className="flex-grow">
                            <h3 className="font-bold text-blue-800 text-base mb-1">
                                {result.japaneseTitle || result.title}
                            </h3>
                            {result.japaneseTitle && (
                                <p className="text-sm text-gray-500 font-light mb-3">
                                    {result.title}
                                </p>
                            )}
                            
                            <p className="text-sm text-gray-700 font-light">
                                {result.japaneseSummary || result.summary}
                            </p>
                            {result.japaneseSummary && (
                                <p className="text-xs text-gray-500 font-light mt-1">
                                    {result.summary}
                                </p>
                            )}
                        </div>
                    </div>
                </button>
            ))}
        </div>
    </div>
);


export const ChatArea: React.FC<ChatAreaProps> = ({ messages, isLoading, isSearching, newsHeadlines = [], showNewsSelector = false, searchResults = [], showSearchResults = false, onArticleSelect = () => {} }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isSearching, showNewsSelector, showSearchResults]);

  if (messages.length === 0 && isLoading) {
    return (
        <div className="h-full flex flex-col items-center justify-center p-4 bg-white/40 backdrop-blur-sm rounded-2xl shadow-inner">
            <div className="w-8 h-8 border-4 border-t-transparent border-emerald-500 rounded-full animate-spin"></div>
            <p className="mt-3 text-gray-500">AIバディを起動中...</p>
        </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 bg-white/40 backdrop-blur-sm rounded-2xl shadow-inner">
      <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
            <>
                {messages.map((msg) => (
                    <Message key={msg.id} message={msg} />
                ))}
                {isLoading && messages.length > 0 && <TypingIndicator />}
                {isSearching && <SearchIndicator />}
                {showNewsSelector && newsHeadlines.length > 0 && (
                    <NewsSelector headlines={newsHeadlines} onSelect={onArticleSelect} />
                )}
                {showSearchResults && searchResults.length > 0 && (
                    <SearchResultSelector results={searchResults} onSelect={onArticleSelect} />
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
                background-color: rgba(156, 163, 175, 0.5);
                border-radius: 20px;
                border: 3px solid transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background-color: rgba(107, 114, 128, 0.5);
            }
        `}</style>
    </div>
  );
};