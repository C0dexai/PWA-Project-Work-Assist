import React, { useState } from 'react';
import { WorkflowItemType } from '../types';
import { getSuggestion } from '../services/geminiService';
import LightbulbIcon from './icons/LightbulbIcon';
import SpinnerIcon from './icons/SpinnerIcon';

interface RefineModalProps {
  item: WorkflowItemType;
  onClose: () => void;
  onSave: (updatedItem: WorkflowItemType) => void;
}

const RefineModal: React.FC<RefineModalProps> = ({ item, onClose, onSave }) => {
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description);
  const [isSuggestingTitle, setIsSuggestingTitle] = useState(false);
  const [isSuggestingDescription, setIsSuggestingDescription] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...item,
      title: title.trim(),
      description: description.trim(),
    });
  };

  const handleSuggestTitle = async () => {
    setIsSuggestingTitle(true);
    try {
        const prompt = `Based on the following title and description, generate a new, more concise and impactful title.
        
        Current Title: "${title}"
        Current Description: "${description}"

        Respond with only the new title text, without any quotes.`;
        const newTitle = await getSuggestion(prompt);
        setTitle(newTitle.trim().replace(/"/g, ''));
    } catch (error) {
        console.error("Failed to suggest title:", error);
    } finally {
        setIsSuggestingTitle(false);
    }
  };

  const handleSuggestDescription = async () => {
    setIsSuggestingDescription(true);
    try {
        const prompt = `Rewrite and expand upon the following description for the software development task titled "${title}". 
        Your response should be a well-structured summary. 
        Crucially, you must:
        1. Include at least three important points or a list of key considerations, with each point formatted as a markdown blockquote (e.g., "> This is a key point.").
        2. Ensure there is a line break (a blank line) between each paragraph for readability.

        Current Description: "${description}"

        New, detailed description:`;
        const newDescription = await getSuggestion(prompt);
        setDescription(newDescription.trim());
    } catch (error) {
        console.error("Failed to suggest description:", error);
    } finally {
        setIsSuggestingDescription(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4 animate-fade-in">
      <div className="glass glass-strong neon w-full max-w-2xl flex flex-col">
        <header className="flex justify-between items-center p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-slate-200">Refine Subject</h2>
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
        
        <form onSubmit={handleSave}>
          <main className="p-6 space-y-4">
            <div>
                <div className="flex justify-between items-center mb-1">
                    <label htmlFor="title" className="block text-sm font-medium text-slate-400">
                        Title / Subject
                    </label>
                    <button
                        type="button"
                        onClick={handleSuggestTitle}
                        disabled={isSuggestingTitle || isSuggestingDescription}
                        className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSuggestingTitle ? <SpinnerIcon className="w-4 h-4 animate-spin"/> : <LightbulbIcon className="w-4 h-4" />}
                        <span>Suggest</span>
                    </button>
                </div>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <div>
                <div className="flex justify-between items-center mb-1">
                    <label htmlFor="description" className="block text-sm font-medium text-slate-400">
                        Description / Personal Diary
                    </label>
                    <button
                        type="button"
                        onClick={handleSuggestDescription}
                        disabled={isSuggestingTitle || isSuggestingDescription}
                        className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSuggestingDescription ? <SpinnerIcon className="w-4 h-4 animate-spin"/> : <LightbulbIcon className="w-4 h-4" />}
                        <span>Suggest</span>
                    </button>
                </div>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={10}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </main>
          
          <footer className="p-4 border-t border-slate-700 flex justify-end items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-600 text-white py-2 px-4 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !description.trim() || isSuggestingTitle || isSuggestingDescription}
              className="bg-slate-200 text-slate-900 py-2 px-4 rounded-lg disabled:bg-slate-500 disabled:text-slate-400 disabled:cursor-not-allowed hover:bg-slate-300 transition-colors"
            >
              Save Changes
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default RefineModal;