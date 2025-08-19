import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import SpinnerIcon from './icons/SpinnerIcon';
import SendIcon from './icons/SendIcon';
import CodeBlock from './CodeBlock';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  chatHistory: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose, title, chatHistory, onSendMessage, isLoading }) => {
  const [newMessage, setNewMessage] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  if (!isOpen) {
    return null;
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };
  
  const renderMessageContent = (text: string) => {
    // 1. Split out code blocks first
    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
        if (!part) return null;

        // Handle code blocks (odd indices)
        if (index % 2 === 1) {
            const codeBlockMatch = part.match(/```(?:[\w\s]*)?\n([\s\S]*?)```/s);
            if (codeBlockMatch && codeBlockMatch[1]) {
                return <CodeBlock key={`code-${index}`} code={codeBlockMatch[1].trim()} />;
            }
            return null;
        }
        
        // Handle markdown text (even indices)
        const formatInline = (str: string) => str.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        const lines = part.trim().split('\n');
        const elements: JSX.Element[] = [];
        let group: { type: 'p' | 'ul' | 'ol' | 'bq', lines: string[] } | null = null;

        const flushGroup = () => {
            if (!group) return;

            if (group.type === 'p') {
                elements.push(<p key={`el-${elements.length}`} className="my-3" dangerouslySetInnerHTML={{ __html: formatInline(group.lines.join(' ')) }} />);
            } else if (group.type === 'bq') {
                const bqContent = group.lines.map(l => formatInline(l.replace(/^>\s?/, ''))).join('<br />');
                elements.push(<blockquote key={`el-${elements.length}`} className="border-l-4 border-slate-500 pl-4 my-4" dangerouslySetInnerHTML={{ __html: bqContent }} />);
            } else { // ul or ol
                const ListTag = group.type;
                const listClass = ListTag === 'ul' ? 'list-disc list-inside' : 'list-decimal list-inside';
                elements.push(
                    <blockquote key={`el-${elements.length}`} className="border-l-4 border-slate-500 pl-4 my-4">
                        <ListTag className={listClass}>
                            {group.lines.map((line, i) => {
                                const cleanLine = line.replace(/^\s*([-*]|\d+\.)\s*/, '');
                                return <li key={i} dangerouslySetInnerHTML={{ __html: formatInline(cleanLine) }} />;
                            })}
                        </ListTag>
                    </blockquote>
                );
            }
            group = null;
        };

        for (const line of lines) {
            if (line.trim() === '') {
                flushGroup();
                continue;
            }
            
            let lineType: 'p' | 'ul' | 'ol' | 'bq' = 'p';
            if (/^>\s?/.test(line)) lineType = 'bq';
            else if (/^\s*[-*]\s/.test(line)) lineType = 'ul';
            else if (/^\s*\d+\.\s/.test(line)) lineType = 'ol';
            
            if (group && group.type === lineType) {
                group.lines.push(line);
            } else {
                flushGroup();
                group = { type: lineType, lines: [line] };
            }
        }
        flushGroup();

        return <div key={`part-${index}`}>{elements}</div>;
    });
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4 animate-fade-in">
      <div className="glass glass-strong neon w-full max-w-6xl h-[90vh] flex flex-col">
        <header className="flex justify-between items-center p-4 border-b border-slate-700 flex-shrink-0">
          <h2 className="text-xl font-bold text-cyan-300">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 rounded-full"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        
        <main ref={chatContainerRef} className="p-6 flex-grow overflow-y-auto space-y-6">
          {chatHistory.map((msg, index) => (
            <div key={index} className={`flex items-start gap-3 w-full animate-slide-in-bottom ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-cyan-500 flex-shrink-0" aria-label="AI avatar"></div>}
              <div className={`p-4 rounded-lg max-w-[85%] ${msg.role === 'user' ? 'bg-slate-600 text-white rounded-br-none' : 'bg-stone-100 text-slate-800 rounded-bl-none'}`}>
                 {renderMessageContent(msg.text)}
              </div>
               {msg.role === 'user' && <div className="w-8 h-8 rounded-full bg-slate-600 flex-shrink-0" aria-label="User avatar"></div>}
            </div>
          ))}
          {isLoading && chatHistory.length > 0 && chatHistory[chatHistory.length -1].role === 'user' && (
             <div className="flex items-start gap-3 max-w-4xl">
                <div className="w-8 h-8 rounded-full bg-cyan-500 flex-shrink-0" aria-label="AI avatar"></div>
                <div className="p-4 rounded-lg bg-stone-100 text-slate-800 rounded-bl-none flex items-center">
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse " style={{animationDelay: '0s'}}></div>
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse ml-1" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse ml-1" style={{animationDelay: '0.4s'}}></div>
                </div>
             </div>
          )}
        </main>
        
        <footer className="p-4 border-t border-slate-700 flex-shrink-0">
          <form onSubmit={handleSendMessage} className="flex items-center gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Ask a follow-up question..."
              className="flex-grow bg-slate-700 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-shadow"
              disabled={isLoading}
              aria-label="Chat input"
            />
            <button
              type="submit"
              disabled={isLoading || !newMessage.trim()}
              className="bg-slate-200 text-slate-900 p-3 rounded-lg disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed hover:bg-slate-300 transition-colors"
              aria-label="Send message"
            >
              <SendIcon className="w-6 h-6"/>
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
};

export default ChatModal;