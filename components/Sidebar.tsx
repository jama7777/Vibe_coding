import React from 'react';
import { Plus, MessageSquare, Code2, Trash2 } from 'lucide-react';
import { SavedPrompt } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  prompts: SavedPrompt[];
  currentPromptId: string;
  onSelectPrompt: (id: string) => void;
  onDeletePrompt: (id: string, e: React.MouseEvent) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  onNewChat,
  prompts,
  currentPromptId,
  onSelectPrompt,
  onDeletePrompt
}) => {
  return (
    <div className={`
      fixed inset-y-0 left-0 w-64 bg-gray-50 dark:bg-[#1e1e1e] border-r border-gray-200 dark:border-gray-800 z-50 flex flex-col
      transition-transform duration-300 ease-in-out md:translate-x-0 md:relative
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <div className="p-4 flex items-center gap-2 border-b border-gray-200 dark:border-gray-800">
        <div className="bg-blue-600 text-white p-1 rounded">
          <Code2 size={20} />
        </div>
        <span className="font-semibold text-gray-900 dark:text-white tracking-tight">AI Studio Clone</span>
      </div>

      <div className="p-3">
        <button 
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors text-sm font-medium shadow-sm"
        >
          <Plus size={16} />
          <span>Create new</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">My Library</div>
        
        {prompts.length === 0 ? (
          <div className="px-4 py-4 text-sm text-gray-400 text-center italic">
            No saved prompts yet.
          </div>
        ) : (
          <div className="space-y-0.5">
            {prompts.map((prompt) => (
              <button
                key={prompt.id}
                onClick={() => onSelectPrompt(prompt.id)}
                className={`w-full group flex items-center gap-2 px-4 py-2 transition-colors text-sm text-left ${
                  currentPromptId === prompt.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-r-2 border-blue-600'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2d2d2d]'
                }`}
              >
                <MessageSquare size={16} className="flex-shrink-0" />
                <span className="truncate flex-1">{prompt.name || 'Untitled prompt'}</span>
                
                <div 
                  onClick={(e) => onDeletePrompt(prompt.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-red-500 transition-all"
                >
                  <Trash2 size={14} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500">
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-green-500"></div>
           API Key: Active
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
