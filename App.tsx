import React, { useState, useCallback, useEffect } from 'react';
import { ChatArea } from './components/ChatArea';
import { VoiceInput } from './components/VoiceInput';
import { Translator } from './components/Translator';
import { ChatMessage, MessageSender, NewsHeadline } from './types';
import { getAIResponse, getNewsHeadlines, getGreetingForSelectedNews, getInitialGreeting } from './services/geminiService';

const personalityOptions = [
  { value: 'standard', label: 'フレンドリー（標準）' },
  { value: 'charismatic-sarcastic', label: 'カリスマ熱血 × 皮肉屋' },
  { value: 'calm-sharp', label: '冷静知的 × 毒舌' },
  { value: 'hyper-dark', label: 'ハイテンション × ブラックジョーク' },
  { value: 'easygoing-honest', label: 'おっとり × 怖いくらい正直' },
  { value: 'hearty-direct', label: '豪快 × 直球毒舌' },
];

const topicOptions = [
  { value: 'world', label: 'World & Politics（世界・政治）' },
  { value: 'business', label: 'Business & Economy（ビジネス・経済）' },
  { value: 'science', label: 'Science & Technology（科学・テクノロジー）' },
  { value: 'culture', label: 'Culture & Lifestyle（文化・生活）' },
  { value: 'human', label: 'Human Stories & Others（人間ドラマ・その他）' },
];

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [personality, setPersonality] = useState(personalityOptions[0].value);
  const [topic, setTopic] = useState(topicOptions[1].value); // Default to Business
  const [newsHeadlines, setNewsHeadlines] = useState<NewsHeadline[]>([]);
  const [showNewsSelector, setShowNewsSelector] = useState(false);

  // Effect for the initial greeting. Runs only once on component mount.
  useEffect(() => {
    const startConversation = async () => {
        setIsLoading(true);
        // The personality for the initial greeting is based on the default state.
        const initialResponse = await getInitialGreeting(personality);
        
        const firstAiMessage: ChatMessage = {
            id: `ai-init-${Date.now()}`,
            sender: MessageSender.AI,
            englishText: initialResponse.english,
            japaneseText: initialResponse.japanese,
            replySuggestions: initialResponse.suggestions,
        };

        setMessages([firstAiMessage]);
        setIsLoading(false);
    };

    startConversation();
    // This effect should only run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effect to fetch news headlines. Runs on initial load and whenever the topic changes.
  useEffect(() => {
    const fetchNews = async () => {
      // Hide the selector if it's already visible with old news
      setShowNewsSelector(false);
      setNewsHeadlines([]); // Clear old headlines immediately for better UX
      const headlines = await getNewsHeadlines(topic);
      setNewsHeadlines(headlines);
    };

    fetchNews();
  }, [topic]);


  const handleNewUserMessage = useCallback(async (englishText: string) => {
    if (!englishText.trim() || isLoading) return;

    const newUserMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: MessageSender.USER,
      englishText: englishText,
    };

    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    const currentHistory = [...messages, newUserMessage];
    const aiResponse = await getAIResponse(currentHistory, englishText, personality, topic);

    const newAiMessage: ChatMessage = {
      id: `ai-${Date.now()}`,
      sender: MessageSender.AI,
      englishText: aiResponse.english,
      japaneseText: aiResponse.japanese,
      replySuggestions: aiResponse.suggestions,
    };
    
    setMessages(prev => [...prev, newAiMessage]);
    
    // After user's 3rd message (history length: AI, User, AI, User, AI, User = 6)
    if (currentHistory.length === 6 && newsHeadlines.length > 0) {
        setShowNewsSelector(true);
    }
    
    setIsLoading(false);
  }, [isLoading, messages, personality, topic, newsHeadlines]);
  
  const handleNewsSelection = useCallback(async (headline: NewsHeadline) => {
    if (isLoading) return;

    setIsLoading(true);
    setShowNewsSelector(false); // Hide selector immediately

    const response = await getGreetingForSelectedNews(headline, personality);

    const newsAiMessage: ChatMessage = {
      id: `ai-news-${Date.now()}`,
      sender: MessageSender.AI,
      englishText: response.english,
      japaneseText: response.japanese,
      replySuggestions: response.suggestions,
      source: response.source,
    };

    setMessages(prev => [...prev, newsAiMessage]);
    setNewsHeadlines([]); // Clear headlines so they don't appear again
    setIsLoading(false);
  }, [isLoading, personality]);

  return (
    <div className="h-screen bg-emerald-50 text-gray-800 font-sans flex flex-col p-4">
      <main className="flex-grow flex flex-col md:flex-row gap-6 max-w-7xl w-full mx-auto overflow-y-hidden">
        {/* Left Panel */}
        <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
          {/* App Info & Settings */}
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-green-600">
              Eikaiwa Buddy
            </h1>
            <p className="text-gray-500 mb-6">Your AI Partner for English Conversation</p>

            <div className="space-y-4">
                <div>
                    <label htmlFor="personality-select" className="block text-sm font-medium text-gray-700 mb-1">AI Personality</label>
                    <select
                        id="personality-select"
                        value={personality}
                        onChange={(e) => setPersonality(e.target.value)}
                        disabled={isLoading}
                        className="w-full px-3 py-2 text-base text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                        aria-label="Select AI personality"
                    >
                        {personalityOptions.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="topic-select" className="block text-sm font-medium text-gray-700 mb-1">News Genre</label>
                    <select
                        id="topic-select"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        disabled={isLoading}
                        className="w-full px-3 py-2 text-base text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                        aria-label="Select news genre"
                    >
                        {topicOptions.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                        ))}
                    </select>
                </div>
            </div>
          </div>
          
          <VoiceInput onTranscriptReceived={handleNewUserMessage} disabled={isLoading} />
          <Translator onSend={handleNewUserMessage} disabled={isLoading} />
        </div>
        {/* Right Panel - Fills remaining space and allows ChatArea to scroll internally */}
        <div className="w-full md:w-2/3 lg:w-3/4 flex-1 flex flex-col min-h-0">
          <ChatArea 
            messages={messages} 
            isLoading={isLoading}
            newsHeadlines={newsHeadlines}
            showNewsSelector={showNewsSelector}
            onNewsSelect={handleNewsSelection}
          />
        </div>
      </main>
       <style>{`
            .custom-scrollbar::-webkit-scrollbar {
                width: 8px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
                background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background-color: #a3a3a3;
                border-radius: 20px;
                border: 2px solid #f0fdf4;
            }
             .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background-color: #737373;
            }
        `}</style>
    </div>
  );
}