import React, { useState, useRef } from 'react';
import { WorkflowItemType, Status } from '../types';
import LightbulbIcon from './icons/LightbulbIcon';
import PhotographIcon from './icons/PhotographIcon';
import SparklesIcon from './icons/SparklesIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import PencilIcon from './icons/PencilIcon';
import BookmarkIcon from './icons/BookmarkIcon';
import SpeakerIcon from './icons/SpeakerIcon';
import StopIcon from './icons/StopIcon';
import CopyIcon from './icons/CopyIcon';
import CheckIcon from './icons/CheckIcon';
import FormattingToolbar from './FormattingToolbar';

interface WorkflowItemProps {
  item: WorkflowItemType;
  onStatusChange: (id: number, status: Status) => void;
  onStartChat: (item: WorkflowItemType) => void;
  onStartRefine: (item: WorkflowItemType) => void;
  onGenerateImage: (id: number) => void;
  isGeneratingImage: boolean;
  onBookmarkToggle: (id: number) => void;
  onReadAloud: (item: WorkflowItemType) => void;
  isSpeaking: boolean;
  onDescriptionChange: (id: number, newDescription: string) => void;
}

const statusConfig = {
  [Status.ToDo]: {
    bg: 'bg-slate-600',
    text: 'text-slate-200',
    options: [Status.InProgress, Status.Done],
  },
  [Status.InProgress]: {
    bg: 'bg-yellow-600',
    text: 'text-yellow-100',
    options: [Status.ToDo, Status.Done],
  },
  [Status.Done]: {
    bg: 'bg-green-600',
    text: 'text-green-100',
    options: [Status.ToDo, Status.InProgress],
  },
};

const WorkflowItem: React.FC<WorkflowItemProps> = ({ item, onStatusChange, onStartChat, onStartRefine, onGenerateImage, isGeneratingImage, onBookmarkToggle, onReadAloud, isSpeaking, onDescriptionChange }) => {
  const config = statusConfig[item.status];
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const descriptionRef = useRef<HTMLDivElement>(null);

  const handleCopy = () => {
    // For rich text, we need to get the text content
    const textToCopy = `${item.title}\n\n${descriptionRef.current?.textContent || ''}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleDescriptionBlur = () => {
    setIsEditing(false);
    if (descriptionRef.current) {
      onDescriptionChange(item.id, descriptionRef.current.innerHTML);
    }
  };
  
  const handleFormat = (command: string, value: string | null = null) => {
    document.execCommand(command, false, value);
    descriptionRef.current?.focus(); // Keep focus on the editor
  };

  return (
    <div className="glass neon flex flex-col md:flex-row gap-5">
      {/* Left side: Image Generation */}
      <div className="w-full md:w-1/3 flex-shrink-0 bg-slate-900/50 rounded-l-2xl flex justify-center items-center p-4">
          <div className="w-full aspect-square relative group">
            {isGeneratingImage ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
                    <SpinnerIcon className="w-8 h-8 animate-spin" />
                    <span className="text-sm">Generating...</span>
                 </div>
            ) : item.imageUrl ? (
                <>
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover rounded-md" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex justify-center items-center rounded-md">
                        <button
                            onClick={() => onGenerateImage(item.id)}
                            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-md transition-all duration-200 transform hover:scale-105"
                            disabled={isGeneratingImage}
                        >
                            <SparklesIcon className="w-5 h-5" />
                            <span>Regenerate</span>
                        </button>
                    </div>
                </>
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-slate-500">
                    <PhotographIcon className="w-12 h-12" />
                    <button
                        onClick={() => onGenerateImage(item.id)}
                        className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-md transition-all duration-200 transform hover:scale-105"
                        disabled={isGeneratingImage}
                    >
                        <SparklesIcon className="w-5 h-5" />
                        <span>Generate Image</span>
                    </button>
                </div>
            )}
         </div>
      </div>

      {/* Right side: Content */}
      <div className="flex-grow p-5 pt-0 md:pt-5 flex flex-col justify-between">
          <div className="relative">
             {isEditing && <FormattingToolbar onFormat={handleFormat} />}
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-bold text-slate-100 pr-4">{item.title}</h3>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${config.bg} ${config.text}`}>
                {item.status}
              </span>
            </div>
             <div
                ref={descriptionRef}
                contentEditable={true}
                suppressContentEditableWarning={true}
                className="text-slate-300 text-sm mb-4 prose-like p-2 -m-2 cursor-text"
                onFocus={() => setIsEditing(true)}
                onBlur={handleDescriptionBlur}
                dangerouslySetInnerHTML={{ __html: item.description }}
            />
          </div>
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-700/50">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Change status:</span>
              {config.options.map(status => (
                <button
                  key={status}
                  onClick={() => onStatusChange(item.id, status)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${statusConfig[status].bg} bg-opacity-30 hover:bg-opacity-100 text-white`}
                >
                  {status}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
                <button
                  title="Bookmark"
                  onClick={() => onBookmarkToggle(item.id)}
                  className={`p-2 rounded-md transition-colors ${item.isBookmarked ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                >
                  <BookmarkIcon className="w-5 h-5" filled={!!item.isBookmarked} />
                </button>
                <button
                  title="Copy Text"
                  onClick={handleCopy}
                  className="p-2 rounded-md bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
                >
                  {copied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <CopyIcon className="w-5 h-5" />}
                </button>
                <button
                  title={isSpeaking ? "Stop" : "Read Aloud"}
                  onClick={() => onReadAloud(item)}
                  className="p-2 rounded-md bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
                >
                  {isSpeaking ? <StopIcon className="w-5 h-5" /> : <SpeakerIcon className="w-5 h-5" />}
                </button>

                <div className="w-px h-6 bg-slate-700 mx-1"></div>

                <button
                onClick={() => onStartRefine(item)}
                className="flex items-center gap-2 bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-md transition-all duration-200 transform hover:scale-105"
                >
                <PencilIcon className="w-5 h-5" />
                <span>Refine</span>
                </button>
                <button
                onClick={() => onStartChat(item)}
                className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold py-2 px-4 rounded-md transition-all duration-200 transform hover:scale-105"
                >
                <LightbulbIcon className="w-5 h-5" />
                <span>Ask AI</span>
                </button>
            </div>
          </div>
      </div>
    </div>
  );
};

export default WorkflowItem;