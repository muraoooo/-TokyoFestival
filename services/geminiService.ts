import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { ChatMessage, MessageSender, NewsHeadline } from '../types';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
console.log("API Key status:", apiKey && apiKey !== 'PLACEHOLDER_API_KEY' ? "Found (configured)" : "Not configured or placeholder");

if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
  console.warn("⚠️ VITE_GEMINI_API_KEY is not properly configured. Please set a valid Gemini API key in .env.local file.");
  console.warn("To get an API key, visit: https://makersuite.google.com/app/apikey");
}

const ai = apiKey && apiKey !== 'PLACEHOLDER_API_KEY' ? new GoogleGenAI({ apiKey }) : null;

const chatHistoryToGeminiHistory = (history: ChatMessage[]) => {
    return history.map(msg => ({
        role: msg.sender === MessageSender.USER ? 'user' : 'model',
        parts: [{ text: msg.englishText }]
    }));
};

const personalityInstructions: { [key: string]: string } = {
  'standard': "You are a friendly and encouraging English conversation partner for a Japanese speaker.",
  'charismatic-sarcastic': "You are an English conversation partner for a Japanese speaker. Your persona is 'Charismatic and passionate, but with a sarcastic edge'.",
  'calm-sharp': "You are an English conversation partner for a Japanese speaker. Your persona is 'Calm and intellectual, but with a sharp, biting wit'.",
  'hyper-dark': "You are an English conversation partner for a Japanese speaker. Your persona is 'High-energy and cheerful, but loves to make dark jokes'.",
  'easygoing-honest': "You are an English conversation partner for a Japanese speaker. Your persona is 'Easy-going and relaxed, but brutally and uncomfortably honest'.",
  'hearty-direct': "You are an English conversation partner for a Japanese speaker. Your persona is 'Hearty, bold, and laughs loudly, with a very direct and unfiltered way of speaking'.",
};

const topicInstructions: { [key: string]: string } = {
  'world': "You must try to steer the conversation towards topics related to World & Politics.",
  'business': "You must try to steer the conversation towards topics related to Business & Economy.",
  'science': "You must try to steer the conversation towards topics related to Science & Technology.",
  'culture': "You must try to steer the conversation towards topics related to Culture & Lifestyle.",
  'human': "You must try to steer the conversation towards topics related to Human Stories & Others.",
};

// This list is used to generate a more user-friendly prompt for the news greeting.
const topicOptions = [
  { value: 'world', label: 'World & Politics' },
  { value: 'business', label: 'Business & Economy' },
  { value: 'science', label: 'Science & Technology' },
  { value: 'culture', label: 'Culture & Lifestyle' },
  { value: 'human', label: 'Human Stories & Others' },
];

export const getInitialGreeting = async (personality: string): Promise<{ english: string; japanese: string; suggestions: { english: string; japanese: string }[] }> => {
    if (!ai) {
        return {
            english: "Hello! I'm working in demo mode. Please set up your Gemini API key to unlock full conversation features. How are you today?",
            japanese: "こんにちは！現在デモモードで動作しています。完全な会話機能を利用するには、Gemini APIキーを設定してください。今日の調子はどうですか？",
            suggestions: [
                { english: "I'm doing great!", japanese: "元気です！" },
                { english: "How do I set up the API key?", japanese: "APIキーの設定方法は？" },
                { english: "Tell me more about this app.", japanese: "このアプリについて教えて。" }
            ]
        };
    }
    
    try {
        const model = 'gemini-2.5-flash';
        const personalityInstruction = personalityInstructions[personality] || personalityInstructions['standard'];

        const greetingPrompt = `You are an AI English conversation partner with the persona '${personalityInstruction}'. Your task is to start a friendly, open-ended conversation. Keep your entire response natural, engaging, and around 1-2 sentences. Do not ask about the news.`;

        const greetingResponse = await ai.models.generateContent({
            model,
            contents: greetingPrompt,
        });
        
        const englishGreeting = greetingResponse.text;
        if (!englishGreeting) {
            throw new Error("Failed to generate greeting.");
        }
        
        const detailsResponse = await ai.models.generateContent({
            model: model,
            contents: `For the following English text, provide its Japanese translation and three simple English reply suggestions (each with its own Japanese translation). Your ENTIRE output must be a single, valid JSON object with no extra text. English text: "${englishGreeting}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        japaneseTranslation: { type: Type.STRING },
                        replySuggestions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    english: { type: Type.STRING },
                                    japanese: { type: Type.STRING }
                                },
                                required: ["english", "japanese"]
                            }
                        }
                    },
                    required: ["japaneseTranslation", "replySuggestions"]
                }
            }
        });
        
        const detailsData = JSON.parse(detailsResponse.text);

        return {
            english: englishGreeting,
            japanese: detailsData.japaneseTranslation,
            suggestions: detailsData.replySuggestions,
        };
    } catch (error) {
        console.error("Error getting initial greeting:", error);
        return {
            english: "Hello! How are you doing today?",
            japanese: "こんにちは！今日の調子はどうですか？",
            suggestions: [
                { english: "I'm doing great!", japanese: "元気です！" },
                { english: "Not too bad.", japanese: "まあまあです。" },
                { english: "A little tired.", japanese: "少し疲れています。" }
            ]
        };
    }
};

export const getNewsHeadlines = async (topic: string): Promise<NewsHeadline[]> => {
    if (!ai) {
        return [];
    }
    
    try {
        const model = 'gemini-2.5-flash';
        const topicLabel = topicOptions.find(o => o.value === topic)?.label || topic;
        
        // Step 1: Get news articles in English using Google Search
        const searchResponse = await ai.models.generateContent({
            model: model,
            contents: `Find three recent, interesting, and distinct news articles related to '${topicLabel}'.
For each article, provide its title, a one-sentence summary, and the source URI from your search results.
Your response MUST be a valid JSON array of objects, with no other text, where each object has "title", "summary", and "uri" keys.`,
            config: {
                tools: [{googleSearch: {}}],
            }
        });

        let text = searchResponse.text.trim();
        // Clean up markdown ```json ... ```
        if (text.startsWith('```json')) {
            text = text.substring(7, text.length - 3).trim();
        } else if (text.startsWith('```')) {
            text = text.substring(3, text.length - 3).trim();
        }
        
        const englishArticles = JSON.parse(text);
        if (!Array.isArray(englishArticles) || englishArticles.length === 0) {
            console.error("Parsed data is not a valid array:", englishArticles);
            return [];
        }
        
        const articlesToTranslate = englishArticles.slice(0, 3);

        // Step 2: Get Japanese translations for the articles
        const translationPrompt = `For each news article object in the following JSON array, add a "japaneseTitle" and a "japaneseSummary" field containing the Japanese translation of the "title" and "summary" respectively. Return the entire array as a single, valid JSON object with no extra text.
        
Input JSON:
${JSON.stringify(articlesToTranslate)}`;

        const translationResponse = await ai.models.generateContent({
            model: model,
            contents: translationPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            summary: { type: Type.STRING },
                            uri: { type: Type.STRING },
                            japaneseTitle: { type: Type.STRING },
                            japaneseSummary: { type: Type.STRING }
                        },
                        required: ["title", "summary", "uri", "japaneseTitle", "japaneseSummary"]
                    }
                }
            }
        });
        
        const translatedData = JSON.parse(translationResponse.text);
        return translatedData;

    } catch (error) {
        console.error("Error getting news headlines:", error);
        return [];
    }
};

export const getGreetingForSelectedNews = async (
    article: NewsHeadline, 
    personality: string
): Promise<{ english: string; japanese: string; suggestions: { english: string; japanese: string }[]; source: { uri: string; title: string; } }> => {
    if (!ai) {
        return {
            english: `I was just looking at an article titled "${article.title}", but I'm having a little trouble formulating my thoughts. What do you think about this topic in general?`,
            japanese: `「${article.title}」という記事を見ていたのですが、ちょっと考えがまとまりません。このトピック全般についてどう思いますか？`,
            suggestions: [
                { english: "It's an interesting topic.", japanese: "面白いトピックですね。" },
                { english: "I don't know much about it.", japanese: "それについてはあまり知りません。" },
                { english: "Can you tell me more?", japanese: "もっと詳しく教えてくれますか？" }
            ],
            source: { uri: article.uri, title: article.title }
        };
    }
    
    try {
        const model = 'gemini-2.5-flash';
        const personalityInstruction = personalityInstructions[personality] || personalityInstructions['standard'];

        // Step 1: Generate conversation starter
        const greetingPrompt = `You are an AI English conversation partner with the persona '${personalityInstruction}'.
Seamlessly transition the conversation to this news article that the user has just selected:
Title: "${article.title}"
Summary: "${article.summary}"
Your task:
1. Acknowledge the user's choice (e.g., "Oh, that's an interesting one.").
2. Ask an open-ended question to continue the conversation about it.
Keep your entire response natural, engaging, and around 1-3 sentences.`;

        const greetingResponse = await ai.models.generateContent({
            model,
            contents: greetingPrompt,
        });
        
        const englishGreeting = greetingResponse.text;
        if (!englishGreeting) {
            throw new Error("Failed to generate greeting for selected news.");
        }

        // Step 2: Get Japanese translation and reply suggestions
        const detailsResponse = await ai.models.generateContent({
            model: model,
            contents: `For the following English text, provide its Japanese translation and three simple English reply suggestions (each with its own Japanese translation). Your ENTIRE output must be a single, valid JSON object with no extra text. English text: "${englishGreeting}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        japaneseTranslation: { type: Type.STRING },
                        replySuggestions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    english: { type: Type.STRING },
                                    japanese: { type: Type.STRING }
                                },
                                required: ["english", "japanese"]
                            }
                        }
                    },
                    required: ["japaneseTranslation", "replySuggestions"]
                }
            }
        });

        const detailsData = JSON.parse(detailsResponse.text);

        return {
            english: englishGreeting,
            japanese: detailsData.japaneseTranslation,
            suggestions: detailsData.replySuggestions,
            source: { uri: article.uri, title: article.title }
        };

    } catch (error) {
        console.error("Error getting greeting for selected news:", error);
        // Provide a generic fallback
        return {
            english: `I was just looking at an article titled "${article.title}", but I'm having a little trouble formulating my thoughts. What do you think about this topic in general?`,
            japanese: `「${article.title}」という記事を見ていたのですが、ちょっと考えがまとまりません。このトピック全般についてどう思いますか？`,
            suggestions: [
                { english: "It's an interesting topic.", japanese: "面白いトピックですね。" },
                { english: "I don't know much about it.", japanese: "それについてはあまり知りません。" },
                { english: "Can you tell me more?", japanese: "もっと詳しく教えてくれますか？" }
            ],
            source: { uri: article.uri, title: article.title }
        };
    }
};


export const getAIResponse = async (history: ChatMessage[], userMessage: string, personality: string, topic: string): Promise<{ english: string; japanese: string; suggestions: { english: string; japanese: string }[] }> => {
  if (!ai) {
    return { 
        english: "I'm in demo mode. To have real conversations, please configure your Gemini API key in the .env.local file.", 
        japanese: "デモモードです。実際の会話を楽しむには、.env.localファイルにGemini APIキーを設定してください。",
        suggestions: [
            { english: "I understand.", japanese: "わかりました。" },
            { english: "Where can I get an API key?", japanese: "APIキーはどこで入手できますか？" },
            { english: "Is there a guide?", japanese: "ガイドはありますか？" }
        ]
    };
  }
  
  try {
    const model = 'gemini-2.5-flash';

    const personalityInstruction = personalityInstructions[personality] || personalityInstructions['standard'];
    const topicInstruction = topicInstructions[topic] || "";
    const baseInstruction = "Keep your responses natural and engaging (around 1-3 sentences). Your entire output MUST be a single JSON object. Provide your English reply, its Japanese translation, and three simple English phrase suggestions for how the user could reply. For each suggestion, provide both the English phrase and its Japanese translation.";
    const systemInstruction = `${personalityInstruction} ${topicInstruction} ${baseInstruction}`;

    const response = await ai.models.generateContent({
        model: model,
        contents: [
            ...chatHistoryToGeminiHistory(history),
            { role: 'user', parts: [{ text: userMessage }] }
        ],
        config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    englishResponse: { type: Type.STRING, description: "Your conversational reply in English." },
                    japaneseTranslation: { type: Type.STRING, description: "The Japanese translation of your English reply." },
                    replySuggestions: {
                        type: Type.ARRAY,
                        description: "Three simple English phrases the user could say next, each with its Japanese translation.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                english: { type: Type.STRING, description: "The English reply suggestion." },
                                japanese: { type: Type.STRING, description: "The Japanese translation of the suggestion." }
                            },
                            required: ["english", "japanese"]
                        }
                    }
                },
                required: ["englishResponse", "japaneseTranslation", "replySuggestions"]
            }
        }
    });
    
    const data = JSON.parse(response.text);

    return { 
        english: data.englishResponse, 
        japanese: data.japaneseTranslation,
        suggestions: data.replySuggestions
    };

  } catch (error) {
    console.error("Error getting AI response:", error);
    return { 
        english: "I'm sorry, I encountered an error. Please try again.", 
        japanese: "申し訳ありませんが、エラーが発生しました。もう一度お試しください。",
        suggestions: []
    };
  }
};

export const translateJapaneseToEnglish = async (japaneseText: string): Promise<{ main: string }> => {
  if (!japaneseText.trim()) {
    return { main: "" };
  }
  
  if (!ai) {
    return { main: "Translation failed." };
  }
  
  try {
    const model = 'gemini-2.5-flash';
    const response = await ai.models.generateContent({
        model: model,
        contents: `Translate the following Japanese text into a single, natural, fluent English phrase for a casual conversation. IMPORTANT: Provide ONLY the English translation, with no extra text, explanations, or quotation marks. Japanese text: "${japaneseText}"`,
        config: {
            // Disable thinking for faster, more direct translation.
            thinkingConfig: { thinkingBudget: 0 }
        }
    });

    return {
        main: response.text.trim()
    };

  } catch (error) {
    console.error("Error translating Japanese to English:", error);
    return { main: "Translation failed." };
  }
};