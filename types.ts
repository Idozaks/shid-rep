
export enum VoiceName {
  ZEPHYR = 'Zephyr',
  PUCK = 'Puck',
  CHARON = 'Charon',
  KORE = 'Kore',
  FENRIR = 'Fenrir'
}

export interface KnowledgeFile {
  id: string;
  name: string;
  mimeType: string;
  data: string; // base64
}

export interface JourneyStep {
  field: string;
  question: string;
  type: 'text' | 'tel' | 'textarea' | 'select' | 'summary';
  options?: string[];
}

export interface CompanyProfile {
  id: string;
  name: string;
  industry: string;
  knowledgeBase: string;
  instructions: string;
  tone: string;
  voice: VoiceName;
  files?: KnowledgeFile[];
  websiteUrl?: string;
  isExample?: boolean;
  themeColor?: string; // Hex color
  iconName?: string;   // Identifier for the vector icon
  bannerUrl?: string;  // Image URL for the card banner
  hasJourney?: boolean; // If true, show the ticket journey button
  journeySteps?: JourneyStep[]; // Custom steps for the chatbot journey
}

export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

export interface CallState {
  isActive: boolean;
  isConnecting: boolean;
  isProcessingKnowledge: boolean;
  transcription: string[];
  error: string | null;
  isTextMode: boolean; // New: true if in text chat mode, false if in voice mode
  textChatHistory: ChatMessage[]; // New: Stores chat messages when in text mode
  isBotTyping: boolean; // New: Indicator for bot typing in text mode
}

export interface TicketData {
  [key: string]: string;
}
