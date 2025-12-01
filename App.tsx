import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Menu, Sparkles, StopCircle, ArrowDown, Paperclip, Mic } from 'lucide-react';
import { GeminiService } from './services/geminiService';
import MessageBubble from './components/MessageBubble';
import Sidebar from './components/Sidebar';
import AttachmentPreview from './components/AttachmentPreview';
import { Message, Role, ModelId, Attachment } from './types';
import { AVAILABLE_MODELS, INITIAL_SYSTEM_INSTRUCTION } from './constants';

// polyfill simple ID
const generateId = () => Math.random().toString(36).substr(2, 9);

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(ModelId.FLASH);
  const [geminiService] = useState(() => new GeminiService(ModelId.FLASH, INITIAL_SYSTEM_INSTRUCTION));
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputText]);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, isLoading]);

  // Handle scroll button visibility
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    }
  };

  // File Handling
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await processFiles(Array.from(e.target.files));
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFiles = async (files: File[]) => {
    const newAttachments: Attachment[] = [];

    for (const file of files) {
      try {
        const id = generateId();
        const isImage = file.type.startsWith('image/');
        const isAudio = file.type.startsWith('audio/');
        const isText = file.type.startsWith('text/') || 
                       file.name.endsWith('.js') || 
                       file.name.endsWith('.ts') || 
                       file.name.endsWith('.py') || 
                       file.name.endsWith('.json') ||
                       file.name.endsWith('.md');
        
        let data = '';
        let type: Attachment['type'] = 'file';

        if (isImage) {
          type = 'image';
          data = await readFileAsDataURL(file);
        } else if (isAudio) {
          type = 'audio';
          data = await readFileAsDataURL(file);
        } else if (isText) {
          type = 'text';
          data = await readFileAsText(file);
        } else {
          // For binary files like FBX, we treat them as generic files.
          // Since we can't easily parse them in browser without libs, we'll
          // just inform the model about their existence via text prompt augmentation
          // or if they are text-based formats (like some OBJ), we try to read.
          // For now, assume generic file.
          type = 'file';
          // We can't really read binary to string properly for the prompt context 
          // unless we base64 it, but Flash doesn't support generic file documents yet 
          // via API inlineData (only PDF/Image/Audio/Video).
          // So we will just use the name for context.
          data = "Binary file content not displayable directly.";
        }

        newAttachments.push({
          id,
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          type,
          data
        });
      } catch (error) {
        console.error("Error reading file:", error);
      }
    }

    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const handleSendMessage = useCallback(async () => {
    if ((!inputText.trim() && attachments.length === 0) || isLoading) return;

    const currentAttachments = [...attachments];
    const userMessage: Message = {
      id: generateId(),
      role: Role.USER,
      text: inputText.trim(),
      attachments: currentAttachments,
      timestamp: Date.now(),
    };

    const tempAiMessageId = generateId();
    const tempAiMessage: Message = {
      id: tempAiMessageId,
      role: Role.MODEL,
      text: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    setMessages(prev => [...prev, userMessage, tempAiMessage]);
    setInputText('');
    setAttachments([]); // Clear attachments
    setIsLoading(true);

    try {
      await geminiService.sendMessageStream(userMessage.text, currentAttachments, (chunkText) => {
        setMessages(prev => prev.map(msg => 
          msg.id === tempAiMessageId 
            ? { ...msg, text: chunkText } 
            : msg
        ));
      });
      
      setMessages(prev => prev.map(msg => 
        msg.id === tempAiMessageId 
          ? { ...msg, isStreaming: false } 
          : msg
      ));
    } catch (error) {
      setMessages(prev => prev.map(msg => 
        msg.id === tempAiMessageId 
          ? { ...msg, isStreaming: false, error: true, text: "Sorry, I encountered an error processing your request." } 
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  }, [inputText, attachments, isLoading, geminiService]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    geminiService.initChat(selectedModel, INITIAL_SYSTEM_INSTRUCTION);
    setInputText('');
    setAttachments([]);
    setIsSidebarOpen(false);
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    geminiService.initChat(modelId, INITIAL_SYSTEM_INSTRUCTION);
    setMessages([]);
    setAttachments([]);
  };

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 overflow-hidden text-gray-900 dark:text-gray-100 font-sans">
      
      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onNewChat={handleNewChat}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative w-full">
        
        {/* Top Bar */}
        <header className="flex-shrink-0 h-14 md:h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-30">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-1.5 rounded-lg transition-colors group relative">
              <span className="font-semibold text-lg tracking-tight">Gemini Clone</span>
              <span className="text-xs text-gray-500 font-medium px-2 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full">
                {AVAILABLE_MODELS.find(m => m.id === selectedModel)?.name}
              </span>
              
              {/* Model Dropdown */}
              <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all z-50 p-1">
                {AVAILABLE_MODELS.map(model => (
                  <button
                    key={model.id}
                    onClick={() => handleModelChange(model.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-start gap-3 transition-colors ${selectedModel === model.id ? 'bg-gray-50 dark:bg-gray-700' : ''}`}
                  >
                    <Sparkles size={16} className={`mt-1 ${selectedModel === model.id ? 'text-blue-600' : 'text-gray-400'}`} />
                    <div>
                      <div className={`font-medium text-sm ${selectedModel === model.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}`}>
                        {model.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{model.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
              <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex items-center justify-center mb-6">
                <Sparkles size={32} className="text-indigo-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">How can I help you today?</h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-md">
                I can help you build games, analyze images, debug code, and more. Try uploading a file!
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 w-full max-w-2xl">
                {['Plan a trip to Japan', 'Write a Three.js game script', 'Explain this code file', 'Debug this Python code'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInputText(suggestion);
                      textareaRef.current?.focus();
                    }}
                    className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all text-sm text-left text-gray-600 dark:text-gray-300"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col pb-4">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>

        {/* Scroll Button */}
        {showScrollButton && (
          <button 
            onClick={scrollToBottom}
            className="absolute bottom-24 right-6 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-all z-20"
          >
            <ArrowDown size={20} />
          </button>
        )}

        {/* Input Area */}
        <div className="flex-shrink-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-20">
          <div className="max-w-3xl mx-auto relative">
            
            {/* Attachments Preview Area */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-3 px-2">
                {attachments.map(att => (
                  <AttachmentPreview 
                    key={att.id} 
                    attachment={att} 
                    onRemove={() => removeAttachment(att.id)} 
                  />
                ))}
              </div>
            )}

            <div className="relative flex items-end gap-2 bg-gray-100 dark:bg-gray-800 rounded-3xl p-2 border border-transparent focus-within:border-gray-300 dark:focus-within:border-gray-600 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-900/30 transition-all shadow-sm">
              
              {/* File Input Button */}
              <input 
                type="file" 
                multiple 
                ref={fileInputRef}
                className="hidden" 
                onChange={handleFileSelect}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-full mb-1 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="Attach files"
              >
                <Paperclip size={20} />
              </button>
              
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Gemini..."
                className="w-full max-h-[200px] bg-transparent border-0 focus:ring-0 resize-none py-3 px-2 text-base text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                rows={1}
              />
              
              {/* Mic Button (Placeholder for now) */}
               <button
                className="p-2.5 rounded-full mb-1 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="Voice Input (Coming Soon)"
              >
                <Mic size={20} />
              </button>

              <button
                onClick={handleSendMessage}
                disabled={(!inputText.trim() && attachments.length === 0) || isLoading}
                className={`p-2.5 rounded-full mb-1 transition-all duration-200 flex-shrink-0 ${
                  (inputText.trim() || attachments.length > 0) && !isLoading
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90'
                    : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <StopCircle size={20} className="animate-pulse" />
                ) : (
                  <Send size={20} />
                )}
              </button>
            </div>
            <div className="text-center mt-2">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Gemini can make mistakes. Check important info.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
