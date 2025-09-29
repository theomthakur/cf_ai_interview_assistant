// frontend/src/components/MessageList.tsx
import { User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  codeBlock?: {
    language: string;
    code: string;
  };
}

interface MessageListProps {
  messages: Message[];
}

export default function MessageList({ messages }: MessageListProps) {
  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex gap-3 ${
            message.role === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          {message.role !== 'user' && (
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Bot size={18} className="text-white" />
            </div>
          )}
          
          <div
            className={`max-w-2xl rounded-lg p-4 ${
              message.role === 'user'
                ? 'bg-blue-600 text-white'
                : message.role === 'system'
                ? 'bg-yellow-100 text-yellow-900'
                : 'bg-white border border-gray-200 text-gray-900'
            }`}
          >
            <div className={`prose prose-slate max-w-none ${
              message.role === 'user' 
                ? 'prose-invert' 
                : 'prose-headings:text-gray-900 prose-p:text-gray-900 prose-strong:text-gray-900 prose-li:text-gray-900'
            }`}>
              <ReactMarkdown
                components={{
                  code: (props) => {
                    const { className, children } = props;
                    const match = /language-(\w+)/.exec(className || '');
                    
                    if (!match) {
                      // Inline code
                      return (
                        <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-gray-900">
                          {children}
                        </code>
                      );
                    }
                    
                    // Code block
                    return (
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={match[1]}
                        PreTag="div"
                        className="rounded-md"
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    );
                  },
                  pre: ({ children }) => (
                    <div className="overflow-x-auto">
                      {children}
                    </div>
                  )
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
            
            {message.codeBlock && (
              <div className="mt-3 rounded-md overflow-hidden">
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={message.codeBlock.language}
                  PreTag="div"
                >
                  {message.codeBlock.code}
                </SyntaxHighlighter>
              </div>
            )}
            
            <div className={`text-xs mt-2 ${
              message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
            }`}>
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          </div>
          
          {message.role === 'user' && (
            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
              <User size={18} className="text-white" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}