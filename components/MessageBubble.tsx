import React from 'react';
import { Message, Role } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import AttachmentPreview from './AttachmentPreview';
import { Bot, User, AlertCircle, Copy, Check } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === Role.USER;
  const hasAttachments = message.attachments && message.attachments.length > 0;
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`group relative flex gap-4 p-6 border-b border-gray-100 dark:border-gray-800 ${isUser ? 'bg-white dark:bg-[#1e1e1e]' : 'bg-gray-50 dark:bg-[#252526]'}`}>
      {/* Icon Column */}
      <div className="flex-shrink-0 pt-1">
        <div className={`w-6 h-6 rounded flex items-center justify-center ${isUser ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300' : 'text-blue-600'}`}>
          {isUser ? <span className="text-xs font-bold">U</span> : <Bot size={20} />}
        </div>
      </div>

      {/* Content Column */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            {isUser ? 'User' : 'Model'}
          </span>
          <button 
            onClick={handleCopy}
            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-opacity"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>

        {/* Attachments */}
        {hasAttachments && (
          <div className="flex flex-wrap gap-2">
            {message.attachments!.map((att) => (
              <AttachmentPreview key={att.id} attachment={att} compact={true} />
            ))}
          </div>
        )}

        {/* Text */}
        <div className="text-sm md:text-base text-gray-800 dark:text-gray-200 leading-relaxed">
          {message.error ? (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded border border-red-200 dark:border-red-800">
              <AlertCircle size={16} />
              {message.text}
            </div>
          ) : (
             <MarkdownRenderer content={message.text} />
          )}
           {message.isStreaming && !message.error && (
              <span className="inline-block w-1.5 h-4 bg-blue-500 ml-1 animate-pulse align-middle"></span>
            )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
