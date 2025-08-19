import React from 'react';
import { Agent } from '../types';

interface AgentCardProps {
  agent: Agent;
  onSelect: () => void;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent, onSelect }) => (
  <div 
    className="glass neon p-5 flex flex-col justify-between cursor-pointer group"
    onClick={onSelect}
    role="button"
    tabIndex={0}
    onKeyPress={(e) => e.key === 'Enter' && onSelect()}
  >
    <div>
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-xl font-bold text-slate-100 pr-4 group-hover:text-cyan-400 transition-colors">{agent.name}</h3>
        <span className="text-sm font-medium text-slate-400 text-right">{agent.role}</span>
      </div>
      <p className="text-slate-300 text-sm mb-4 font-mono italic">
        "{agent.personality}"
      </p>
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-slate-200 mb-2">Skills:</h4>
        <div className="flex flex-wrap gap-2">
          {agent.skills.map(skill => (
            <span key={skill} className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-700 text-slate-300">
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
    <div className="text-center mt-auto pt-4 border-t border-slate-700/50">
       <span className="text-cyan-400 font-semibold group-hover:underline">Engage Agent</span>
    </div>
  </div>
);

export default AgentCard;