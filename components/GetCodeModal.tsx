import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { Message, GenerationConfig, Role, SavedPrompt } from '../types';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface GetCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: {
    systemInstruction: string;
    messages: Message[];
    config: GenerationConfig;
    modelId: string;
  };
}

const GetCodeModal: React.FC<GetCodeModalProps> = ({ isOpen, onClose, prompt }) => {
  const [activeTab, setActiveTab] = useState<'js' | 'python' | 'curl'>('js');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(generateCode(activeTab));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateCode = (lang: string) => {
    const { systemInstruction, messages, config, modelId } = prompt;
    
    // Filter out empty model messages that might be currently streaming
    const validMessages = messages.filter(m => m.text.trim() !== '' || (m.attachments && m.attachments.length > 0));

    if (lang === 'js') {
      return `const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

async function run() {
  const model = ai.models.getGenerativeModel({
    model: "${modelId}",
    systemInstruction: ${JSON.stringify(systemInstruction)},
  });

  const generationConfig = {
    temperature: ${config.temperature},
    topP: ${config.topP},
    topK: ${config.topK},
    maxOutputTokens: ${config.maxOutputTokens},
  };

  const chatSession = model.startChat({
    generationConfig,
    history: [
${validMessages.map(m => `      {
        role: "${m.role}",
        parts: [
          ${m.attachments?.map(a => `{ inlineData: { mimeType: "${a.mimeType}", data: "..." } },`).join('\n          ') || ''}{ text: ${JSON.stringify(m.text)} },
        ],
      },`).join('\n')}
    ],
  });

  const result = await chatSession.sendMessage("INSERT_USER_MESSAGE_HERE");
  console.log(result.response.text());
}

run();`;
    } 
    
    if (lang === 'python') {
      return `import os
import google.generativeai as genai

genai.configure(api_key=os.environ["GEMINI_API_KEY"])

def upload_to_gemini(path, mime_type=None):
  """Uploads the given file to Gemini."""
  file = genai.upload_file(path, mime_type=mime_type)
  print(f"Uploaded file '{file.display_name}' as: {file.uri}")
  return file

generation_config = {
  "temperature": ${config.temperature},
  "top_p": ${config.topP},
  "top_k": ${config.topK},
  "max_output_tokens": ${config.maxOutputTokens},
  "response_mime_type": "text/plain",
}

model = genai.GenerativeModel(
  model_name="${modelId}",
  generation_config=generation_config,
  system_instruction=${JSON.stringify(systemInstruction)},
)

chat_session = model.start_chat(
  history=[
${validMessages.map(m => `    {
      "role": "${m.role}",
      "parts": [
        ${m.attachments ? '# Attachments would go here\n        ' : ''}${JSON.stringify(m.text)},
      ],
    },`).join('\n')}
  ]
)

response = chat_session.send_message("INSERT_USER_MESSAGE_HERE")

print(response.text)`;
    }

    return "cURL generation is simplified for this preview.";
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-3xl rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Get Code</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex items-center gap-4 px-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#252526]">
          {['js', 'python'].map((lang) => (
            <button
              key={lang}
              onClick={() => setActiveTab(lang as any)}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === lang 
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {lang === 'js' ? 'JavaScript' : 'Python'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto relative bg-[#1e1e1e]">
          <button 
            onClick={handleCopy}
            className="absolute top-4 right-4 p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors z-10"
            title="Copy to clipboard"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
          <SyntaxHighlighter
            language={activeTab === 'js' ? 'javascript' : 'python'}
            style={vscDarkPlus}
            customStyle={{ margin: 0, padding: '1.5rem', height: '100%', fontSize: '14px' }}
            showLineNumbers={true}
          >
            {generateCode(activeTab)}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  );
};

export default GetCodeModal;
