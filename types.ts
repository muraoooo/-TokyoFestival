
export enum MessageSender {
  USER = 'user',
  AI = 'ai',
}

export interface NewsHeadline {
  title: string;
  summary: string;
  uri: string;
  japaneseTitle?: string;
  japaneseSummary?: string;
}

export interface ChatMessage {
  id: string;
  sender: MessageSender;
  englishText: string;
  japaneseText?: string;
  replySuggestions?: { english: string; japanese: string }[];
  source?: {
    uri: string;
    title: string;
  };
}