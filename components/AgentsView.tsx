import React, { useState, useEffect } from 'react';
import { Agent } from '../types';
import { AGENTS } from '../constants';
import AgentCard from './AgentCard';
import AgentChat from './AgentChat';

type AnimationStage = 'loading' | 'greeting' | 'showingAgents';

const AgentsView: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [animationStage, setAnimationStage] = useState<AnimationStage>('loading');

  useEffect(() => {
    let stageTimer: NodeJS.Timeout;
    if (animationStage === 'loading') {
      stageTimer = setTimeout(() => {
        setAnimationStage('greeting');
      }, 3000); // 3 seconds for the loading screen
    } else if (animationStage === 'greeting') {
      stageTimer = setTimeout(() => {
        setAnimationStage('showingAgents');
      }, 2000); // 2 seconds for the greeting
    }
    return () => clearTimeout(stageTimer);
  }, [animationStage]);


  if (selectedAgent) {
    return <AgentChat agent={selectedAgent} onBack={() => setSelectedAgent(null)} />;
  }
  
  // Use key prop to force re-render and re-trigger animation on stage change
  if (animationStage === 'loading') {
    return (
        <div key="loading" className="fixed inset-0 flex justify-center items-center bg-black z-50 animate-fade-in">
            <div className="intro-animation glass neon p-8 text-center">
                <h1 className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-200 to-cyan-400">
                    CASSA VEGAS
                </h1>
            </div>
        </div>
    );
  }
  
  if (animationStage === 'greeting') {
      return (
        <div key="greeting" className="fixed inset-0 flex justify-center items-center bg-black z-50 animate-fade-in">
            <div className="text-center">
                <h1 className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-200 to-cyan-400">
                    Welcome to the Family
                </h1>
                <p className="mt-4 text-lg text-slate-300">Meet the crew.</p>
            </div>
        </div>
      );
  }

  return (
    <div className="animate-fade-in">
       <header className="text-center mb-12 animate-fade-in">
          <h1 className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-200 to-cyan-400">
            CASSA VEGAS: AI Family
          </h1>
          <p className="mt-4 text-lg text-slate-300 max-w-3xl mx-auto">
            Select an agent to engage. Each member of the family brings a unique set of skills and personality to the table.
          </p>
        </header>
      <div className="grid grid-cols-1 gap-6">
        {AGENTS.map((agent, index) => (
          <div 
             key={agent.name}
             className="animate-slide-in-bottom-staggered"
             style={{ animationDelay: `${index * 100}ms` }}
          >
            <AgentCard agent={agent} onSelect={() => setSelectedAgent(agent)} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentsView;