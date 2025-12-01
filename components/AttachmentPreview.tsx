import React from 'react';
import { X, FileText, Image as ImageIcon, Music, Box } from 'lucide-react';
import { Attachment } from '../types';

interface AttachmentPreviewProps {
  attachment: Attachment;
  onRemove?: () => void;
  compact?: boolean; // If true, shows a smaller version for chat history
}

const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({ attachment, onRemove, compact = false }) => {
  const isImage = attachment.type === 'image';
  
  if (isImage) {
    return (
      <div className={`relative group inline-block ${compact ? 'mr-2 mb-2' : ''}`}>
        <div className={`rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 ${compact ? 'w-32 h-32' : 'w-24 h-24'}`}>
          <img 
            src={attachment.data} 
            alt={attachment.name} 
            className="w-full h-full object-cover"
          />
        </div>
        {!compact && onRemove && (
          <button 
            onClick={onRemove}
            className="absolute -top-1.5 -right-1.5 bg-gray-900 text-white rounded-full p-0.5 shadow-md hover:bg-gray-700 transition-colors"
          >
            <X size={12} />
          </button>
        )}
      </div>
    );
  }

  // Generic file/text/audio view
  return (
    <div className={`
      relative group inline-flex items-center gap-3 p-3 
      rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800
      ${compact ? 'mr-2 mb-2 max-w-full' : 'w-48'}
    `}>
      <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0 text-indigo-600 dark:text-indigo-400">
        {attachment.mimeType.startsWith('audio') ? <Music size={20} /> : 
         attachment.name.endsWith('.fbx') || attachment.name.endsWith('.obj') ? <Box size={20} /> :
         <FileText size={20} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" title={attachment.name}>
          {attachment.name}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {attachment.type.toUpperCase()}
        </div>
      </div>
      {!compact && onRemove && (
        <button 
          onClick={onRemove}
          className="absolute -top-1.5 -right-1.5 bg-gray-900 text-white rounded-full p-0.5 shadow-md hover:bg-gray-700 transition-colors"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
};

export default AttachmentPreview;
