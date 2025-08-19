import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Agent, ChatMessage } from '../types';
import { getAi, getGeminiErrorText } from '../services/geminiService';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import SendIcon from './icons/SendIcon';
import CodeBlock from './CodeBlock';
import { getChatHistory, saveChatHistory } from '../services/dbService';

interface AgentChatProps {
  agent: Agent;
  onBack: () => void;
}

const AgentChat: React.FC<AgentChatProps> = ({ agent, onBack }) => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatKey = `agent-${agent.name}`;
  
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
                elements.push(<blockquote key={`el-${elements.length}`} className="border-l-4 border-slate-600 pl-4 my-4" dangerouslySetInnerHTML={{ __html: bqContent }} />);
            } else { // ul or ol
                const ListTag = group.type;
                const listClass = ListTag === 'ul' ? 'list-disc list-inside' : 'list-decimal list-inside';
                elements.push(
                    <blockquote key={`el-${elements.length}`} className="border-l-4 border-slate-600 pl-4 my-4">
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

  
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      try {
        const history = await getChatHistory(chatKey);
        setChatHistory(history);
      } catch (error) {
        console.error(`Failed to load chat history for ${agent.name}:`, error);
        setChatHistory([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadHistory();
  }, [agent, chatKey]);

  useEffect(() => {
    // Save history when it changes, but not during an API call or initial load.
    if (chatHistory.length > 0 && !isLoading) {
      saveChatHistory(chatKey, chatHistory);
    }
  }, [chatHistory, isLoading, chatKey]);
  
  const sendMessage = useCallback(async (message: string) => {
    if (!message || isLoading) return;

    const userMessage = { role: 'user' as const, text: message };
    const historyForAi = [...chatHistory, userMessage];

    setIsLoading(true);
    setChatHistory(prev => [...prev, userMessage, { role: 'model', text: '' }]);

    const updateHistoryWithText = (text: string) => {
      setChatHistory(prev => {
        const newHistory = [...prev];
        if (newHistory.length > 0 && newHistory[newHistory.length - 1].role === 'model') {
            newHistory[newHistory.length - 1].text = text;
        }
        return newHistory;
      });
    };
    
    const updateHistoryWithError = (message: string) => {
      setChatHistory(prev => {
        const newHistory = [...prev];
        if (newHistory.length > 0 && newHistory[newHistory.length - 1].role === 'model') {
            newHistory[newHistory.length - 1].text = message;
        } else {
            newHistory.push({ role: 'model', text: message });
        }
        return newHistory;
      });
    };

    try {
      const ai = getAi();
      const lastMessage = historyForAi[historyForAi.length - 1];
      const geminiHistory = historyForAi
          .slice(0, -1)
          .filter(msg => msg.text)
          .map(msg => ({
              role: msg.role,
              parts: [{ text: msg.text }],
          }));
      
      const chat = ai.chats.create({
          model: 'gemini-2.5-flash',
          config: { systemInstruction: agent.personality_prompt },
          history: geminiHistory,
      });

      const stream = await chat.sendMessageStream({ message: lastMessage.text });
      
      let text = '';
      updateHistoryWithText(text);

      for await (const chunk of stream) {
          text += chunk.text;
          updateHistoryWithText(text);
      }
    } catch (geminiError) {
      console.error("Error during Gemini call:", geminiError);
      const geminiErrorText = getGeminiErrorText(geminiError);
      updateHistoryWithError(geminiErrorText);
    } finally {
      setIsLoading(false);
    }
  }, [agent.personality_prompt, chatHistory, isLoading, chatKey]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  return (
    <div className="flex flex-col h-[85vh] glass neon animate-fade-in">
        <header className="flex items-center p-4 border-b border-slate-700 flex-shrink-0">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-700 transition-colors mr-4">
              <ArrowLeftIcon className="w-6 h-6 text-slate-300" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-cyan-300">{agent.name}</h2>
            <p className="text-sm text-slate-400">{agent.role}</p>
          </div>
        </header>

        <main ref={chatContainerRef} className="p-6 flex-grow overflow-y-auto space-y-6 font-mono">
            {chatHistory.map((msg, index) => (
              <div key={index} className={`flex items-start gap-3 w-full animate-slide-in-bottom`}>
                {msg.role === 'model' && <div className="w-8 h-8 rounded-sm bg-cyan-500 flex-shrink-0 text-center font-bold leading-8" aria-label="AI avatar">{agent.name.charAt(0)}</div>}
                <div className={`p-4 rounded-lg max-w-[85%] ${msg.role === 'user' ? 'bg-slate-600 text-white ml-auto' : 'bg-stone-100 text-slate-800'}`}>
                   {msg.role === 'user' && <span className="text-slate-300 mr-2">$</span>}
                   {renderMessageContent(msg.text)}
                </div>
              </div>
            ))}
            {isLoading && chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === 'model' && chatHistory[chatHistory.length -1].text === '' && (
               <div className="flex items-start gap-3 max-w-4xl">
                  <div className="w-8 h-8 rounded-sm bg-cyan-500 flex-shrink-0 text-center font-bold leading-8" aria-label="AI avatar">{agent.name.charAt(0)}</div>
                  <div className="p-4 rounded-lg bg-stone-100 text-slate-800 flex items-center">
                      <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse " style={{animationDelay: '0s'}}></div>
                      <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse ml-1.5" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse ml-1.5" style={{animationDelay: '0.4s'}}></div>
                  </div>
               </div>
            )}
        </main>
        
        <footer className="p-4 border-t border-slate-700 flex-shrink-0">
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
             <span className="text-slate-300 font-mono text-lg pl-2">$</span>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message ${agent.name}...`}
              className="flex-grow bg-transparent font-mono text-white placeholder-slate-500 focus:outline-none"
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
  );
};

export default AgentChat;