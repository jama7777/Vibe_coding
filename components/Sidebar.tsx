import React from 'react';
import { Plus, MessageSquare, Settings, Menu, X, Github } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onNewChat }) => {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed top-0 left-0 bottom-0 w-72 bg-gray-900 text-gray-100 z-50 transform transition-transform duration-300 ease-in-out flex flex-col
        md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        {/* Header */}
        <div className="p-4 flex items-center justify-between md:hidden">
          <span className="font-semibold text-lg">Menu</span>
          <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded">
            <X size={20} />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button 
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors text-sm font-medium"
          >
            <Plus size={18} />
            <span>New Chat</span>
          </button>
        </div>

        {/* Recent Chats List (Mock) */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Recent</div>
          
          {/* Mock history items */}
          <button className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-800 rounded-lg transition-colors text-sm text-gray-300 text-left truncate">
            <MessageSquare size={16} className="flex-shrink-0" />
            <span className="truncate">Explain Quantum Physics</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-800 rounded-lg transition-colors text-sm text-gray-300 text-left truncate">
            <MessageSquare size={16} className="flex-shrink-0" />
            <span className="truncate">React Component Help</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-800 rounded-lg transition-colors text-sm text-gray-300 text-left truncate">
            <MessageSquare size={16} className="flex-shrink-0" />
            <span className="truncate">Dinner Recipes for Two</span>
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
           <div className="flex items-center gap-3 px-2 py-2 text-sm text-gray-400 hover:text-white cursor-pointer transition-colors">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
              U
            </div>
            <div className="flex-1">
              <div className="font-medium text-white">User</div>
              <div className="text-xs">Free Plan</div>
            </div>
            <Settings size={18} />
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
