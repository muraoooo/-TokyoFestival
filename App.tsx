import React, { useState, useCallback, useEffect } from 'react';
import { ChatArea } from './components/ChatArea';
import { VoiceInput } from './components/VoiceInput';
import { Translator } from './components/Translator';
import { SettingsPanel } from './components/SettingsPanel';
import { ChatMessage, MessageSender, NewsHeadline, CustomOption } from './types';
import { getAIResponse, getNewsHeadlines, getGreetingForSelectedNews, getInitialGreeting, getWebSearchResults, translateUserMessage } from './services/geminiService';

const personalityOptions = [
  { value: 'standard', label: 'フレンドリー（標準）' },
  { value: 'charismatic-sarcastic', label: 'カリスマ熱血 × 皮肉屋' },
  { value: 'calm-sharp', label: '冷静知的 × 毒舌' },
  { value: 'hyper-dark', label: 'ハイテンション × ブラックジョーク' },
  { value: 'easygoing-honest', label: 'おっとり × 怖いくらい正直' },
  { value: 'hearty-direct', label: '豪快 × 直球毒舌' },
];

const topicOptions = [
  { value: 'world', label: '世界・政治 (World & Politics)' },
  { value: 'business', label: 'ビジネス・経済 (Business & Economy)' },
  { value: 'science', label: '科学・テクノロジー (Science & Technology)' },
  { value: 'culture', label: '文化・生活 (Culture & Lifestyle)' },
  { value: 'human', label: '人間ドラマ・その他 (Human Stories & Others)' },
];

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [personality, setPersonality] = useState(personalityOptions[0].value);
  const [topic, setTopic] = useState(topicOptions[1].value); // Default to Business
  const [newsHeadlines, setNewsHeadlines] = useState<NewsHeadline[]>([]);
  const [showNewsSelector, setShowNewsSelector] = useState(false);

  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<NewsHeadline[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const [showSettings, setShowSettings] = useState(false);
  const [customPersonalities, setCustomPersonalities] = useState<CustomOption[]>([]);
  const [customTopics, setCustomTopics] = useState<CustomOption[]>([]);



  // Initialize speech synthesis and detect Mac system voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = speechSynthesis.getVoices();
        console.log(`🎙️ Loaded ${voices.length} total voices`);
        
        // Find Mac system voices
        const systemVoices = voices.filter(v => v.localService === true);
        const englishSystemVoices = systemVoices.filter(v => 
          v.lang === 'en-US' || v.lang.startsWith('en')
        );
        
        console.log(`🖥️ Mac system voices: ${systemVoices.length}`);
        console.log(`🇺🇸 English system voices: ${englishSystemVoices.length}`);
        
        // Log available Mac voices
        const macVoiceNames = ['Samantha', 'Alex', 'Victoria', 'Allison', 'Ava', 'Susan', 'Zoe', 'Tom'];
        macVoiceNames.forEach(name => {
          const voice = voices.find(v => 
            v.name.toLowerCase().includes(name.toLowerCase()) && v.localService
          );
          if (voice) {
            console.log(`✅ Found Mac voice: ${voice.name} (${voice.lang})`);
          }
        });
        
        // Set a flag if we have good voices
        if (englishSystemVoices.length > 0) {
          console.log('🎉 Mac system voices are available for use');
        } else {
          console.warn('⚠️ No Mac system voices found, will use browser default');
        }
      };
      
      // Both Chrome and Safari need this
      speechSynthesis.addEventListener('voiceschanged', loadVoices);
      
      // Also try loading immediately
      if (speechSynthesis.getVoices().length > 0) {
        loadVoices();
      }
    }
  }, []);

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

    // Add user message immediately without waiting for translation
    const newUserMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: MessageSender.USER,
      englishText: englishText,
      japaneseText: undefined, // Will be added later
    };

    setMessages(prev => [...prev, newUserMessage]);
    
    // Translate in background and update message
    translateUserMessage(englishText).then(japaneseTranslation => {
      if (japaneseTranslation) {
        setMessages(prev => prev.map(msg => 
          msg.id === newUserMessage.id 
            ? { ...msg, japaneseText: japaneseTranslation }
            : msg
        ));
      }
    });
    setIsLoading(true);
    setShowSearchResults(false); // Hide old results on new message

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

    // If AI response triggers a search, start it asynchronously
    if (aiResponse.triggerSearch) {
        setIsSearching(true);
        // Don't await this, let it run in the background
        getWebSearchResults(englishText).then(results => {
            if (results.length > 0) {
                setSearchResults(results);
                setShowSearchResults(true);
            }
        }).catch(error => {
            console.error("Web search failed:", error);
            // Optionally, inform the user about the failure in a future update
        }).finally(() => {
            setIsSearching(false);
        });
    }
    
    // After user's 3rd message (history length: AI, User, AI, User, AI, User = 6)
    if (currentHistory.length === 6 && newsHeadlines.length > 0) {
        setShowNewsSelector(true);
    }
    
    setIsLoading(false);
  }, [isLoading, messages, personality, topic, newsHeadlines]);
  
  const handleArticleSelection = useCallback(async (article: NewsHeadline) => {
    if (isLoading) return;

    setIsLoading(true);
    setShowNewsSelector(false); // Hide news selector
    setShowSearchResults(false); // Hide search results selector

    const response = await getGreetingForSelectedNews(article, personality);

    const articleAiMessage: ChatMessage = {
      id: `ai-article-${Date.now()}`,
      sender: MessageSender.AI,
      englishText: response.english,
      japaneseText: response.japanese,
      replySuggestions: response.suggestions,
      source: response.source,
    };

    setMessages(prev => [...prev, articleAiMessage]);
    setNewsHeadlines([]); // Clear headlines so they don't appear again
    setIsLoading(false);
  }, [isLoading, personality]);

  const handleAddCustomPersonality = (option: CustomOption) => {
    setCustomPersonalities(prev => [...prev, option]);
    setPersonality(option.value);
  };

  const handleAddCustomTopic = (option: CustomOption) => {
    setCustomTopics(prev => [...prev, option]);
    setTopic(option.value);
  };

  const handleDeleteCustomPersonality = (id: string) => {
    setCustomPersonalities(prev => prev.filter(p => p.id !== id));
  };

  const handleDeleteCustomTopic = (id: string) => {
    setCustomTopics(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="h-screen font-sans flex flex-col p-3">
      <main className="flex-grow flex flex-col gap-3 max-w-7xl w-full mx-auto overflow-y-hidden">
        
        {/* Header Section */}
        <header className="flex-shrink-0 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div>
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-green-600">
              英会話バディ
            </h1>
            <p className="text-gray-500 text-sm">あなたのAI英会話パートナー</p>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm font-medium">設定</span>
          </button>
        </header>
        
        {/* Chat Area - Stretches to fill space */}
        <div className="flex-1 min-h-0">
          <ChatArea 
            messages={messages} 
            isLoading={isLoading}
            isSearching={isSearching}
            newsHeadlines={newsHeadlines}
            showNewsSelector={showNewsSelector}
            searchResults={searchResults}
            showSearchResults={showSearchResults}
            onArticleSelect={handleArticleSelection}
          />
        </div>

        {/* Input Section */}
        <footer className="flex-shrink-0 grid grid-cols-1 md:grid-cols-2 gap-3">
          <VoiceInput onTranscriptReceived={handleNewUserMessage} disabled={isLoading || isSearching} />
          <Translator onSend={handleNewUserMessage} disabled={isLoading || isSearching} />
        </footer>
      </main>
      
      {/* Settings Panel */}
      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        personality={personality}
        topic={topic}
        customPersonalities={customPersonalities}
        customTopics={customTopics}
        onPersonalityChange={setPersonality}
        onTopicChange={setTopic}
        onAddCustomPersonality={handleAddCustomPersonality}
        onAddCustomTopic={handleAddCustomTopic}
        onDeleteCustomPersonality={handleDeleteCustomPersonality}
        onDeleteCustomTopic={handleDeleteCustomTopic}
      />
    </div>
  );
}