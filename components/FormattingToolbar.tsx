import React from 'react';
import BoldIcon from './icons/BoldIcon';
import ItalicIcon from './icons/ItalicIcon';
import HeadingIcon from './icons/HeadingIcon';
import AlignLeftIcon from './icons/AlignLeftIcon';
import AlignCenterIcon from './icons/AlignCenterIcon';
import AlignRightIcon from './icons/AlignRightIcon';

interface FormattingToolbarProps {
  onFormat: (command: string, value?: string) => void;
}

const FormattingToolbar: React.FC<FormattingToolbarProps> = ({ onFormat }) => {
  
  const ToolbarButton = ({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) => (
    <button
        type="button"
        onMouseDown={(e) => { // Use onMouseDown to prevent the contentEditable from losing focus
            e.preventDefault();
            onClick();
        }}
        className="p-2 text-slate-300 hover:bg-slate-600 hover:text-white rounded-md transition-colors"
        title={title}
    >
        {children}
    </button>
  );

  return (
    <div className="absolute -top-12 left-0 bg-slate-800 border border-slate-700 rounded-lg shadow-lg flex items-center gap-1 p-1 z-10 animate-fade-in">
        <ToolbarButton onClick={() => onFormat('bold')} title="Bold">
            <BoldIcon className="w-5 h-5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => onFormat('italic')} title="Italic">
            <ItalicIcon className="w-5 h-5" />
        </ToolbarButton>
        
        <div className="w-px h-5 bg-slate-600 mx-1"></div>

        <ToolbarButton onClick={() => onFormat('formatBlock', '<h1>')} title="Heading 1">
            <HeadingIcon className="w-5 h-5" />
        </ToolbarButton>
         <ToolbarButton onClick={() => onFormat('formatBlock', '<h2>')} title="Heading 2">
            <span className="font-bold text-sm">H2</span>
        </ToolbarButton>
         <ToolbarButton onClick={() => onFormat('formatBlock', '<h3>')} title="Heading 3">
            <span className="font-bold text-xs">H3</span>
        </ToolbarButton>
        
        <div className="w-px h-5 bg-slate-600 mx-1"></div>

        <ToolbarButton onClick={() => onFormat('justifyLeft')} title="Align Left">
            <AlignLeftIcon className="w-5 h-5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => onFormat('justifyCenter')} title="Align Center">
            <AlignCenterIcon className="w-5 h-5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => onFormat('justifyRight')} title="Align Right">
            <AlignRightIcon className="w-5 h-5" />
        </ToolbarButton>
    </div>
  );
};

export default FormattingToolbar;
