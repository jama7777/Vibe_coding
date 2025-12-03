export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface Attachment {
  id: string;
  type: 'image' | 'text' | 'audio' | 'file';
  mimeType: string;
  name: string;
  data: string;
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: number;
  attachments?: Attachment[];
  isStreaming?: boolean;
  error?: boolean;
}

export interface GenerationConfig {
  temperature: number;
  topP: number;
  topK: number;
  maxOutputTokens: number;
}

export interface ChatSessionConfig {
  model: string;
  systemInstruction?: string;
  generationConfig?: GenerationConfig;
}

export interface SavedPrompt {
  id: string;
  name: string;
  messages: Message[];
  systemInstruction: string;
  config: GenerationConfig;
  modelId: string;
  updatedAt: number;
}

export enum ModelId {
  FLASH = 'gemini-2.5-flash',
  PRO = 'gemini-3-pro-preview',
  FLASH_THINKING = 'gemini-2.5-flash-thinking' 
}
