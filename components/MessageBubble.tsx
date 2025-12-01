import React from 'react';
import { Message, Role } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import AttachmentPreview from './AttachmentPreview';
import { Bot, User, AlertCircle } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === Role.USER;
  const hasAttachments = message.attachments && message.attachments.length > 0;

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} py-6 px-4 md:px-8 group hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-200`}>
      <div className={`flex max-w-3xl w-full gap-4 md:gap-6 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-sm ${
          isUser 
            ? 'bg-gray-200 text-gray-600' 
            : message.error 
              ? 'bg-red-100 text-red-600'
              : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
        }`}>
          {isUser ? <User size={20} /> : message.error ? <AlertCircle size={20} /> : <Bot size={20} />}
        </div>

        {/* Content */}
        <div className={`flex-1 min-w-0 ${isUser ? 'text-right' : 'text-left'}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-sm font-semibold ${isUser ? 'ml-auto' : ''} text-gray-900 dark:text-gray-100`}>
              {isUser ? 'You' : 'Gemini'}
            </span>
          </div>

          <div className={`text-gray-800 dark:text-gray-200 ${isUser ? 'bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tr-sm px-5 py-3 inline-block text-left' : ''}`}>
            
            {/* Attachments Display */}
            {hasAttachments && (
              <div className="flex flex-wrap gap-2 mb-3">
                {message.attachments!.map((att) => (
                  <AttachmentPreview key={att.id} attachment={att} compact={true} />
                ))}
              </div>
            )}

            {message.error ? (
              <div className="text-red-600 dark:text-red-400">
                {message.text}
              </div>
            ) : (
              message.text && <MarkdownRenderer content={message.text} />
            )}
            
            {message.isStreaming && !message.error && (
              <span className="inline-block w-2 h-4 bg-gray-400 ml-1 animate-pulse align-middle"></span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
