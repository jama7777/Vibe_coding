import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Menu, Play, StopCircle, Paperclip, Save, Share2, Pencil, Check } from 'lucide-react';
import { GeminiService } from './services/geminiService';
import MessageBubble from './components/MessageBubble';
import Sidebar from './components/Sidebar';
import SettingsPanel from './components/SettingsPanel';
import AttachmentPreview from './components/AttachmentPreview';
import GetCodeModal from './components/GetCodeModal';
import { Message, Role, ModelId, Attachment, GenerationConfig, SavedPrompt } from './types';
import { AVAILABLE_MODELS, INITIAL_SYSTEM_INSTRUCTION } from './constants';

const generateId = () => Math.random().toString(36).substr(2, 9);

const DEFAULT_CONFIG: GenerationConfig = {
  temperature: 1.0,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
};

const App: React.FC = () => {
  // --- Workspace State ---
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [systemInstruction, setSystemInstruction] = useState(INITIAL_SYSTEM_INSTRUCTION);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(ModelId.FLASH);
  const [config, setConfig] = useState<GenerationConfig>(DEFAULT_CONFIG);
  
  // --- Library State ---
  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
  const [currentPromptId, setCurrentPromptId] = useState<string | null>(null);
  const [promptName, setPromptName] = useState('Untitled prompt');
  const [isEditingName, setIsEditingName] = useState(false);

  // --- UI State ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [showShareSuccess, setShowShareSuccess] = useState(false);
  
  const [geminiService] = useState(() => new GeminiService(ModelId.FLASH, INITIAL_SYSTEM_INSTRUCTION, DEFAULT_CONFIG));
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

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

  // Update service when settings change
  useEffect(() => {
    geminiService.initChat(selectedModel, systemInstruction, config);
  }, [selectedModel, systemInstruction, config, geminiService]);

  // Focus name input when editing
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isEditingName]);

  // Initialize with a default prompt if empty
  useEffect(() => {
    if (prompts.length === 0 && !currentPromptId) {
      handleNewChat();
    }
  }, []);

  // --- Actions ---

  const handleNewChat = () => {
    const newId = generateId();
    const newPrompt: SavedPrompt = {
      id: newId,
      name: 'Untitled prompt',
      messages: [],
      systemInstruction: INITIAL_SYSTEM_INSTRUCTION,
      config: DEFAULT_CONFIG,
      modelId: ModelId.FLASH,
      updatedAt: Date.now()
    };

    // Reset workspace
    setMessages([]);
    setSystemInstruction(INITIAL_SYSTEM_INSTRUCTION);
    setConfig(DEFAULT_CONFIG);
    setSelectedModel(ModelId.FLASH);
    setInputText('');
    setAttachments([]);
    setPromptName('Untitled prompt');
    
    // Update library state
    // We don't push to prompts array immediately to avoid clutter. 
    // It exists as "draft" state until saved, OR we can track it as active.
    // Let's track it as currentPromptId but NOT add to prompts until saved to act like "Unsaved" 
    // BUT for better UX in this clone, let's add it immediately so it feels persistent.
    setPrompts(prev => [newPrompt, ...prev]);
    setCurrentPromptId(newId);
    
    // Close sidebar on mobile
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleSelectPrompt = (id: string) => {
    const prompt = prompts.find(p => p.id === id);
    if (prompt) {
      setCurrentPromptId(id);
      setMessages(prompt.messages);
      setSystemInstruction(prompt.systemInstruction);
      setConfig(prompt.config);
      setSelectedModel(prompt.modelId);
      setPromptName(prompt.name);
      
      if (window.innerWidth < 768) setIsSidebarOpen(false);
    }
  };

  const handleDeletePrompt = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newPrompts = prompts.filter(p => p.id !== id);
    setPrompts(newPrompts);
    
    if (currentPromptId === id) {
      if (newPrompts.length > 0) {
        handleSelectPrompt(newPrompts[0].id);
      } else {
        handleNewChat();
      }
    }
  };

  const handleSave = () => {
    if (!currentPromptId) return;

    setPrompts(prev => prev.map(p => {
      if (p.id === currentPromptId) {
        return {
          ...p,
          name: promptName,
          messages: messages,
          systemInstruction: systemInstruction,
          config: config,
          modelId: selectedModel,
          updatedAt: Date.now()
        };
      }
      return p;
    }));

    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 2000);
  };

  const handleShare = () => {
    // Mock share
    navigator.clipboard.writeText(window.location.href);
    setShowShareSuccess(true);
    setTimeout(() => setShowShareSuccess(false), 2000);
  };

  const handleRename = () => {
    if (isEditingName) {
      // Save name change
      if (currentPromptId) {
        setPrompts(prev => prev.map(p => p.id === currentPromptId ? { ...p, name: promptName } : p));
      }
    }
    setIsEditingName(!isEditingName);
  };

  const handleKeyDownName = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    }
  };

  // --- File Logic ---
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await processFiles(Array.from(e.target.files));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFiles = async (files: File[]) => {
    const newAttachments: Attachment[] = [];
    for (const file of files) {
      try {
        const id = generateId();
        const isImage = file.type.startsWith('image/');
        const isAudio = file.type.startsWith('audio/');
        
        let data = '';
        let type: Attachment['type'] = 'file';

        if (isImage) {
          type = 'image';
          data = await readFileAsDataURL(file);
        } else if (isAudio) {
          type = 'audio';
          data = await readFileAsDataURL(file);
        } else {
          try {
             data = await readFileAsText(file);
             type = 'text';
          } catch {
             data = "Binary content";
             type = 'file';
          }
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

  // --- Chat Logic ---
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

    const newMessages = [...messages, userMessage, tempAiMessage];
    setMessages(newMessages);
    
    // Auto save to state prompt list to keep sync roughly
    if (currentPromptId) {
      setPrompts(prev => prev.map(p => p.id === currentPromptId ? { ...p, messages: newMessages } : p));
    }

    setInputText('');
    setAttachments([]);
    setIsLoading(true);

    try {
      await geminiService.sendMessageStream(userMessage.text, currentAttachments, (chunkText) => {
        setMessages(prev => prev.map(msg => 
          msg.id === tempAiMessageId 
            ? { ...msg, text: chunkText } 
            : msg
        ));
      });
      
      setMessages(prev => {
        const updated = prev.map(msg => 
          msg.id === tempAiMessageId 
            ? { ...msg, isStreaming: false } 
            : msg
        );
        // Final sync
        if (currentPromptId) {
          setPrompts(oldPrompts => oldPrompts.map(p => p.id === currentPromptId ? { ...p, messages: updated } : p));
        }
        return updated;
      });

    } catch (error) {
      setMessages(prev => prev.map(msg => 
        msg.id === tempAiMessageId 
          ? { ...msg, isStreaming: false, error: true, text: "Error: " + error } 
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  }, [inputText, attachments, isLoading, geminiService, messages, currentPromptId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-gray-100 font-sans overflow-hidden">
      
      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onNewChat={handleNewChat}
        prompts={prompts}
        currentPromptId={currentPromptId || ''}
        onSelectPrompt={handleSelectPrompt}
        onDeletePrompt={handleDeletePrompt}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        
        {/* Top Header */}
        <header className="h-14 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 bg-white dark:bg-[#1e1e1e] flex-shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded md:hidden"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 group">
               {isEditingName ? (
                 <input 
                   ref={nameInputRef}
                   type="text"
                   value={promptName}
                   onChange={(e) => setPromptName(e.target.value)}
                   onBlur={handleRename}
                   onKeyDown={handleKeyDownName}
                   className="font-medium text-sm bg-gray-100 dark:bg-gray-800 border-none outline-none rounded px-2 py-1 min-w-[150px]"
                 />
               ) : (
                 <span 
                   onClick={handleRename}
                   className="font-medium text-sm cursor-pointer hover:underline underline-offset-4 decoration-gray-400"
                 >
                   {promptName}
                 </span>
               )}
               <button onClick={handleRename} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
                 {isEditingName ? <Check size={14} /> : <Pencil size={14} />}
               </button>
               <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">Chat</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            >
               {showSaveSuccess ? <Check size={16} className="text-green-500" /> : <Save size={16} />}
               <span className="hidden md:inline">{showSaveSuccess ? 'Saved' : 'Save'}</span>
            </button>
            <button 
              onClick={handleShare}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            >
               {showShareSuccess ? <Check size={16} className="text-green-500" /> : <Share2 size={16} />}
               <span className="hidden md:inline">{showShareSuccess ? 'Copied' : 'Share'}</span>
            </button>
            <button 
              onClick={() => setIsCodeModalOpen(true)}
              className="ml-2 flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
            >
               <span>Get code</span>
            </button>
          </div>
        </header>

        {/* Workspace Body */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Center Canvas */}
          <div className="flex-1 flex flex-col bg-white dark:bg-[#1e1e1e] relative">
            
            {/* System Instructions */}
            <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1e1e1e]">
              <div className="max-w-4xl mx-auto w-full">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  System Instructions
                </label>
                <textarea 
                  value={systemInstruction}
                  onChange={(e) => setSystemInstruction(e.target.value)}
                  className="w-full bg-white dark:bg-[#252526] border border-gray-200 dark:border-gray-700 rounded-md p-3 text-sm text-gray-800 dark:text-gray-200 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none"
                  rows={2}
                  placeholder="Give the model a role or set of rules..."
                />
              </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto scroll-smooth">
               <div className="max-w-4xl mx-auto w-full pb-4">
                 {messages.length === 0 ? (
                   <div className="h-64 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600">
                      <p>Run a prompt to generate content</p>
                   </div>
                 ) : (
                   messages.map((msg) => (
                     <MessageBubble key={msg.id} message={msg} />
                   ))
                 )}
                 <div ref={messagesEndRef} />
               </div>
            </div>

            {/* Input Area */}
            <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1e1e1e]">
              <div className="max-w-4xl mx-auto w-full relative">
                 {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2 p-2 bg-gray-50 dark:bg-[#252526] rounded-md border border-gray-100 dark:border-gray-800">
                    {attachments.map(att => (
                      <AttachmentPreview 
                        key={att.id} 
                        attachment={att} 
                        onRemove={() => removeAttachment(att.id)} 
                      />
                    ))}
                  </div>
                )}

                <div className="flex items-end gap-2 bg-gray-50 dark:bg-[#252526] border border-gray-200 dark:border-gray-700 rounded-lg p-2 shadow-sm focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
                  <input 
                    type="file" 
                    multiple 
                    ref={fileInputRef}
                    className="hidden" 
                    onChange={handleFileSelect}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
                  >
                    <Paperclip size={20} />
                  </button>
                  
                  <textarea
                    ref={textareaRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type something..."
                    className="flex-1 bg-transparent border-0 focus:ring-0 resize-none py-2 px-1 text-sm md:text-base text-gray-900 dark:text-gray-100 placeholder:text-gray-400 leading-6"
                    rows={1}
                  />

                  <button
                    onClick={handleSendMessage}
                    disabled={(!inputText.trim() && attachments.length === 0) || isLoading}
                    className={`p-2 rounded-md transition-all duration-200 flex items-center gap-2 ${
                      (inputText.trim() || attachments.length > 0) && !isLoading
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <StopCircle size={18} className="animate-pulse" />
                        <span className="text-xs font-semibold uppercase hidden md:inline">Stop</span>
                      </>
                    ) : (
                      <>
                         <Play size={18} fill="currentColor" />
                         <span className="text-xs font-semibold uppercase hidden md:inline">Run</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="flex justify-between mt-2 px-1">
                   <span className="text-xs text-gray-400">CMD+ENTER to run</span>
                   <span className="text-xs text-gray-400">{inputText.length} chars</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar (Settings) */}
          <SettingsPanel 
            config={config} 
            onConfigChange={setConfig} 
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
        </div>
      </div>
      
      {/* Code Modal */}
      <GetCodeModal 
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        prompt={{
          systemInstruction,
          messages,
          config,
          modelId: selectedModel
        }}
      />
    </div>
  );
};

export default App;
