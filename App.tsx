import React, { useState } from 'react';
import WorkflowView from './components/WorkflowView';
import AgentsView from './components/AgentsView';
import ClipboardListIcon from './components/icons/ClipboardListIcon';
import UsersIcon from './components/icons/UsersIcon';

type Tab = 'workflow' | 'agents';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('workflow');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'workflow':
        return <WorkflowView />;
      case 'agents':
        return <AgentsView />;
      default:
        return null;
    }
  };

  const TabButton = ({ tabName, label, icon }: { tabName: Tab; label: string; icon: React.ReactNode }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`flex h-full items-center gap-2.5 px-4 font-semibold border-b-4 transition-colors duration-300 ${
        activeTab === tabName
          ? 'border-cyan-400 text-white'
          : 'border-transparent text-slate-400 hover:text-white'
      }`}
      role="tab"
      aria-selected={activeTab === tabName}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 glass">
        <div className="w-[95%] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
                <div className="flex items-center gap-2 mr-8">
                    <ClipboardListIcon className="h-8 w-8 text-cyan-400"/>
                    <span className="text-xl font-bold">Project Workflow Assistant</span>
                </div>
                <nav className="flex items-center gap-4 h-full" role="tablist">
                    <TabButton tabName="workflow" label="Project Workflow" icon={<ClipboardListIcon className="w-5 h-5" />} />
                    <TabButton tabName="agents" label="AI Family Agents" icon={<UsersIcon className="w-5 h-5" />} />
                </nav>
            </div>
        </div>
      </header>
      
      <main className="w-[95%] mx-auto p-4 sm:p-6 lg:p-8">
        {renderTabContent()}
      </main>
    </div>
  );
};

export default App;