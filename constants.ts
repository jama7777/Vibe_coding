import { ModelId } from './types';

export const AVAILABLE_MODELS = [
  {
    id: ModelId.FLASH,
    name: 'Gemini 2.5 Flash',
    description: 'Fast and versatile for most tasks'
  },
  {
    id: ModelId.PRO,
    name: 'Gemini 3.0 Pro',
    description: 'High intelligence for complex reasoning'
  }
];

export const INITIAL_SYSTEM_INSTRUCTION = "You are a helpful, clever, and harmless AI assistant. You respond with clear markdown formatting. If asked to write code, provide it in code blocks with language identifiers.";
