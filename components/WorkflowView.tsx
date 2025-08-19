import React, { useState, useCallback, useRef, useEffect } from 'react';
import { WorkflowItemType, Status, ChatMessage } from '../types';
import { INITIAL_WORKFLOW_ITEMS } from '../constants';
import WorkflowItem from './WorkflowItem';
import ChatModal from './AiSuggestionModal';
import RefineModal from './RefineModal';
import { getAi, getGeminiErrorText, generateImage } from '../services/geminiService';
import { getWorkflowItems, saveWorkflowItems, getChatHistory, saveChatHistory } from '../services/dbService';
import { speak, stop } from '../services/ttsService';

const WorkflowView: React.FC = () => {
  const [workflowItems, setWorkflowItems] = useState<WorkflowItemType[]>([]);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [activeChatItem, setActiveChatItem] = useState<WorkflowItemType | null>(null);
  const [refiningItem, setRefiningItem] = useState<WorkflowItemType | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [systemInstruction, setSystemInstruction] = useState<string>('');
  const [generatingImageId, setGeneratingImageId] = useState<number | null>(null);
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);
  const [speakingItemId, setSpeakingItemId] = useState<number | null>(null);
  const activeChatKey = useRef<string | null>(null);

  useEffect(() => {
    const loadItems = async () => {
      try {
        const items = await getWorkflowItems();
        setWorkflowItems(items);
      } catch (error) {
        console.error("Failed to load workflow items:", error);
        setWorkflowItems(INITIAL_WORKFLOW_ITEMS);
      }
    };
    loadItems();
  }, []);

  useEffect(() => {
    if (workflowItems.length > 0) {
      saveWorkflowItems(workflowItems);
    }
  }, [workflowItems]);

  useEffect(() => {
    // Cleanup TTS on unmount
    return () => {
      stop();
    };
  }, []);

  const handleStatusChange = useCallback((id: number, status: Status) => {
    setWorkflowItems(prevItems =>
      prevItems.map(item => (item.id === id ? { ...item, status } : item))
    );
  }, []);

  const handleDescriptionChange = useCallback((id: number, newDescription: string) => {
    setWorkflowItems(prevItems =>
      prevItems.map(item => (item.id === id ? { ...item, description: newDescription } : item))
    );
  }, []);

  const handleGenerateImage = useCallback(async (id: number) => {
    setGeneratingImageId(id);
    const item = workflowItems.find(i => i.id === id);
    if (!item) {
        console.error("Could not find item to generate image for.");
        setGeneratingImageId(null);
        return;
    }

    try {
        const gender = Math.random() < 0.5 ? 'Male' : 'Female';
        const prompt = `Professional executive portrait of a solo ${gender.toLowerCase()} software engineering leader. The setting is a modern, minimalist tech office. The style should be photorealistic, with a shallow depth of field, sharp focus on the person, and cinematic lighting. High resolution, detailed, professional headshot.`;
        const imageUrl = await generateImage(prompt);
        setWorkflowItems(prev => prev.map(i => i.id === id ? { ...i, imageUrl, imageGender: gender } : i));
    } catch (error) {
        console.error("Failed to generate image:", error);
        // You could add a user-facing error message here
    } finally {
        setGeneratingImageId(null);
    }
}, [workflowItems]);

  const handleBookmarkToggle = useCallback((id: number) => {
    setWorkflowItems(prev => 
        prev.map(item => 
            item.id === id ? { ...item, isBookmarked: !item.isBookmarked } : item
        )
    );
  }, []);

  const handleReadAloud = useCallback((item: WorkflowItemType) => {
      if (speakingItemId === item.id) {
          stop();
          setSpeakingItemId(null);
      } else {
          stop(); // Stop any currently playing audio
          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = item.description;
          const textToSpeak = `${item.title}. ${tempDiv.textContent || tempDiv.innerText || ""}`;

          speak({
              text: textToSpeak,
              gender: item.imageGender,
              onEnd: () => setSpeakingItemId(null)
          });
          setSpeakingItemId(item.id);
      }
  }, [speakingItemId]);

  const handleStartChat = useCallback(async (item: WorkflowItemType) => {
    const chatKey = `workflow-${item.id}`;
    activeChatKey.current = chatKey;
    
    setActiveChatItem(item);
    setIsChatOpen(true);
    
    const instruction = `You are Adam, the mastermind architect from the CASSA VEGAS family. Your persona is: "You see the big picture, predict every move, and build systems that never fail. Patient, calculating, and unflappable—you run the game before it’s even played." Your goal is to provide clear, strategic blueprints for setting up new software projects. When relevant, provide specific CLI commands (for git, npm, gcloud, etc.) and code snippets inside markdown code blocks. Format your responses for clarity and readability using markdown. The user is starting a conversation about "${item.title}".`;
    setSystemInstruction(instruction);
    
    try {
        const history = await getChatHistory(chatKey);
        if (history.length > 0) {
            setChatHistory(history);
        } else {
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = item.description;
            const descriptionText = tempDiv.textContent || tempDiv.innerText || "";
            const initialUserMessage = `I'm looking at the topic "${item.title}: ${descriptionText}". Could you give me a detailed breakdown of best practices, common pitfalls, and some concrete first steps I can take? If there are any relevant CLI commands to get started, please include them.`;
            setChatHistory([{ role: 'user', text: initialUserMessage }]);
        }
    } catch (error) {
        console.error("Failed to load chat history:", error);
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = item.description;
        const descriptionText = tempDiv.textContent || tempDiv.innerText || "";
        const initialUserMessage = `I'm looking at the topic "${item.title}: ${descriptionText}". Could you give me a detailed breakdown of best practices, common pitfalls, and some concrete first steps I can take? If there are any relevant CLI commands to get started, please include them.`;
        setChatHistory([{ role: 'user', text: initialUserMessage }]);
    }
  }, []);

  const handleStartRefine = (item: WorkflowItemType) => {
    setRefiningItem(item);
  };

  const handleSaveRefine = (updatedItem: WorkflowItemType) => {
    setWorkflowItems(prevItems =>
      prevItems.map(item => (item.id === updatedItem.id ? updatedItem : item))
    );
    setRefiningItem(null);
  };

  const runAiTurn = useCallback(async () => {
    if (isLoading) return;
    
    const lastMessage = chatHistory[chatHistory.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') return;

    setIsLoading(true);
    
    const historyForAi = [...chatHistory];
    setChatHistory(prev => [...prev, { role: 'model', text: '' }]);

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
        const geminiHistory = historyForAi
        .slice(0, -1) // all but last user message
        .filter(msg => msg.text)
        .map(msg => ({
          role: msg.role,
          parts: [{ text: msg.text }],
        }));
        
        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: { systemInstruction },
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
  }, [chatHistory, isLoading, systemInstruction]);

  useEffect(() => {
    if (isChatOpen && chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === 'user') {
        runAiTurn();
    }
  }, [chatHistory, isChatOpen, runAiTurn]);
  
  useEffect(() => {
    if (isChatOpen && activeChatKey.current && chatHistory.length > 0) {
      saveChatHistory(activeChatKey.current, chatHistory);
    }
  }, [chatHistory, isChatOpen]);


  const handleSendUserMessage = useCallback((message: string) => {
    if (isLoading) return;
    setChatHistory(prev => [...prev, { role: 'user', text: message }]);
  }, [isLoading]);

  const closeChat = useCallback(() => {
    setIsChatOpen(false);
    setActiveChatItem(null);
    setChatHistory([]);
    activeChatKey.current = null;
  }, []);

  const filteredItems = showBookmarkedOnly 
    ? workflowItems.filter(item => item.isBookmarked) 
    : workflowItems;

  return (
    <div className="animate-fade-in">
        <header className="text-center mb-8">
          <h1 className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-200 to-cyan-400">
            Project Workflow Assistant
          </h1>
        </header>

        <div className="flex justify-end items-center mb-6">
            <label htmlFor="bookmark-toggle" className="flex items-center cursor-pointer">
                <span className="mr-3 text-slate-300 font-semibold">Show Bookmarked Only</span>
                <div className="relative">
                    <input 
                        type="checkbox" 
                        id="bookmark-toggle" 
                        className="sr-only"
                        checked={showBookmarkedOnly}
                        onChange={() => setShowBookmarkedOnly(prev => !prev)}
                    />
                    <div className="block bg-slate-700 w-14 h-8 rounded-full"></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${showBookmarkedOnly ? 'transform translate-x-6 bg-cyan-400' : 'bg-slate-400'}`}></div>
                </div>
            </label>
        </div>

        <section className="grid grid-cols-1 gap-6">
          {filteredItems.map(item => (
            <WorkflowItem
              key={item.id}
              item={item}
              onStatusChange={handleStatusChange}
              onStartChat={handleStartChat}
              onStartRefine={handleStartRefine}
              onGenerateImage={handleGenerateImage}
              isGeneratingImage={generatingImageId === item.id}
              onBookmarkToggle={handleBookmarkToggle}
              onReadAloud={handleReadAloud}
              isSpeaking={speakingItemId === item.id}
              onDescriptionChange={handleDescriptionChange}
            />
          ))}
        </section>

      <ChatModal
        isOpen={isChatOpen}
        onClose={closeChat}
        title={activeChatItem?.title || 'AI Assistant'}
        chatHistory={chatHistory}
        onSendMessage={handleSendUserMessage}
        isLoading={isLoading}
      />
      {refiningItem && (
        <RefineModal 
            item={refiningItem}
            onClose={() => setRefiningItem(null)}
            onSave={handleSaveRefine}
        />
      )}
    </div>
  );
};

export default WorkflowView;