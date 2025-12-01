export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface Attachment {
  id: string;
  type: 'image' | 'text' | 'audio' | 'file';
  mimeType: string;
  name: string;
  data: string; // Base64 string for images/audio, plain text for text files
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

export interface ChatSessionConfig {
  model: string;
  systemInstruction?: string;
}

export enum ModelId {
  FLASH = 'gemini-2.5-flash',
  PRO = 'gemini-3-pro-preview',
  FLASH_THINKING = 'gemini-2.5-flash-thinking' 
}
