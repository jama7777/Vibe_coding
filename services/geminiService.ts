import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { ModelId, Attachment } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export class GeminiService {
  private chat: Chat | null = null;
  private currentModel: string = ModelId.FLASH;

  constructor(model: string = ModelId.FLASH, systemInstruction?: string) {
    this.currentModel = model;
    this.initChat(model, systemInstruction);
  }

  public initChat(model: string, systemInstruction?: string) {
    this.currentModel = model;
    this.chat = ai.chats.create({
      model: model,
      config: {
        systemInstruction: systemInstruction,
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
          // Remove data URL prefix if present for the API
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

      // Add the main text message
      if (message.trim()) {
        parts.push({ text: message });
      }

      // If no text but we have attachments, we still need a prompt structure in some cases, 
      // but Gemini handles multimodal parts well. 
      // If we only have an image, we can just send it.
      
      // Use sendMessageStream with parts. 
      // Note: chat.sendMessageStream takes a string OR a list of parts in 'message' usually, 
      // but the SDK type definition for `message` in `sendMessageStream` can be string | Part[].
      
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

  public switchModel(model: string, systemInstruction?: string) {
    this.initChat(model, systemInstruction);
  }
}
