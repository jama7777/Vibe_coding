import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { ModelId, Attachment, GenerationConfig } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export class GeminiService {
  private chat: Chat | null = null;
  private currentModel: string = ModelId.FLASH;
  private currentConfig: GenerationConfig | undefined;

  constructor(model: string = ModelId.FLASH, systemInstruction?: string, config?: GenerationConfig) {
    this.currentModel = model;
    this.currentConfig = config;
    this.initChat(model, systemInstruction, config);
  }

  public initChat(model: string, systemInstruction?: string, config?: GenerationConfig) {
    this.currentModel = model;
    this.currentConfig = config;
    this.chat = ai.chats.create({
      model: model,
      config: {
        systemInstruction: systemInstruction,
        temperature: config?.temperature,
        topP: config?.topP,
        topK: config?.topK,
        maxOutputTokens: config?.maxOutputTokens,
      },
    });
  }

  public async sendMessageStream(
    message: string, 
    attachments: Attachment[],
    onChunk: (text: string) => void
  ): Promise<string> {
    if (!this.chat) {
      throw new Error("Chat session not initialized");
    }

    try {
      // Construct parts
      const parts: any[] = [];
      
      // Process attachments
      for (const att of attachments) {
        if (att.type === 'image' || att.type === 'audio') {
          const base64Data = att.data.includes('base64,') 
            ? att.data.split('base64,')[1] 
            : att.data;
            
          parts.push({
            inlineData: {
              mimeType: att.mimeType,
              data: base64Data
            }
          });
        } else if (att.type === 'text' || att.type === 'file') {
          parts.push({
            text: `[User uploaded file: ${att.name}]\n${att.data}`
          });
        }
      }

      if (message.trim()) {
        parts.push({ text: message });
      }

      const resultStream = await this.chat.sendMessageStream({ 
        message: parts.length === 1 && typeof parts[0].text === 'string' 
          ? parts[0].text 
          : parts 
      });
      
      let fullText = "";
      
      for await (const chunk of resultStream) {
        const c = chunk as GenerateContentResponse;
        const text = c.text;
        if (text) {
          fullText += text;
          onChunk(fullText);
        }
      }
      
      return fullText;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }
}
