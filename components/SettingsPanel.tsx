import React from 'react';
import { Settings, Info, ChevronDown } from 'lucide-react';
import { GenerationConfig, ModelId } from '../types';
import { AVAILABLE_MODELS } from '../constants';

interface SettingsPanelProps {
  config: GenerationConfig;
  onConfigChange: (newConfig: GenerationConfig) => void;
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
  config, 
  onConfigChange,
  selectedModel,
  onModelChange
}) => {
  const handleChange = (key: keyof GenerationConfig, value: number) => {
    onConfigChange({ ...config, [key]: value });
  };

  return (
    <div className="w-80 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1e1e1e] flex flex-col h-full overflow-y-auto text-sm">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-200">
        <Settings size={16} />
        Run settings
      </div>

      <div className="p-4 space-y-6">
        {/* Model Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Model</label>
          <div className="relative">
            <select 
              value={selectedModel}
              onChange={(e) => onModelChange(e.target.value)}
              className="w-full appearance-none bg-gray-50 dark:bg-[#2d2d2d] border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded px-3 py-2 pr-8 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {AVAILABLE_MODELS.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-2.5 text-gray-500 pointer-events-none" size={14} />
          </div>
        </div>

        {/* Temperature */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-gray-700 dark:text-gray-300">Temperature</label>
            <input 
              type="number" 
              value={config.temperature}
              step={0.1}
              max={2}
              min={0}
              onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
              className="w-16 bg-transparent text-right border-b border-gray-300 dark:border-gray-600 focus:border-blue-500 outline-none"
            />
          </div>
          <input 
            type="range" 
            min="0" 
            max="2" 
            step="0.1"
            value={config.temperature}
            onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
            className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        {/* Top K */}
        <div className="space-y-3">
           <div className="flex justify-between items-center">
            <label className="text-gray-700 dark:text-gray-300">Top K</label>
            <input 
              type="number" 
              value={config.topK}
              onChange={(e) => handleChange('topK', parseInt(e.target.value))}
              className="w-16 bg-transparent text-right border-b border-gray-300 dark:border-gray-600 focus:border-blue-500 outline-none"
            />
          </div>
           <input 
            type="range" 
            min="1" 
            max="100" 
            step="1"
            value={config.topK}
            onChange={(e) => handleChange('topK', parseInt(e.target.value))}
            className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        {/* Top P */}
        <div className="space-y-3">
           <div className="flex justify-between items-center">
            <label className="text-gray-700 dark:text-gray-300">Top P</label>
            <input 
              type="number" 
              value={config.topP}
              step={0.01}
              max={1}
              min={0}
              onChange={(e) => handleChange('topP', parseFloat(e.target.value))}
              className="w-16 bg-transparent text-right border-b border-gray-300 dark:border-gray-600 focus:border-blue-500 outline-none"
            />
          </div>
           <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01"
            value={config.topP}
            onChange={(e) => handleChange('topP', parseFloat(e.target.value))}
            className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        {/* Max Output Tokens */}
        <div className="space-y-3">
           <div className="flex justify-between items-center">
            <label className="text-gray-700 dark:text-gray-300">Output Length</label>
            <input 
              type="number" 
              value={config.maxOutputTokens}
              step={100}
              onChange={(e) => handleChange('maxOutputTokens', parseInt(e.target.value))}
              className="w-16 bg-transparent text-right border-b border-gray-300 dark:border-gray-600 focus:border-blue-500 outline-none"
            />
          </div>
           <input 
            type="range" 
            min="100" 
            max="8192" 
            step="100"
            value={config.maxOutputTokens}
            onChange={(e) => handleChange('maxOutputTokens', parseInt(e.target.value))}
            className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>
      </div>

       <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500">
          <div className="flex gap-2 items-start">
            <Info size={14} className="mt-0.5 flex-shrink-0" />
            <p>Settings are applied to the next message sent in the chat.</p>
          </div>
       </div>
    </div>
  );
};

export default SettingsPanel;
