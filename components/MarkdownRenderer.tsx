import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none break-words text-sm md:text-base leading-relaxed">
      <ReactMarkdown
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <div className="rounded-md overflow-hidden my-4 shadow-sm">
                <div className="bg-gray-800 text-gray-200 text-xs px-4 py-1.5 flex justify-between items-center border-b border-gray-700">
                  <span className="font-mono">{match[1]}</span>
                </div>
                <SyntaxHighlighter
                  {...props}
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{ margin: 0, borderRadius: 0 }}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code {...props} className={`${className} bg-gray-200 dark:bg-gray-800 rounded px-1.5 py-0.5 text-sm font-mono`}>
                {children}
              </code>
            );
          },
          ul({children}) {
            return <ul className="list-disc pl-5 my-3 space-y-1">{children}</ul>
          },
          ol({children}) {
            return <ol className="list-decimal pl-5 my-3 space-y-1">{children}</ol>
          },
          p({children}) {
            return <p className="mb-3 last:mb-0">{children}</p>
          },
          a({href, children}) {
            return <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">{children}</a>
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default React.memo(MarkdownRenderer);
