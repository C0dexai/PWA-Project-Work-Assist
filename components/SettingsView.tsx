import React, { useState, useEffect } from 'react';

const SettingsView: React.FC = () => {
  const [apiName, setApiName] = useState('');
  const [apiKeyStatus, setApiKeyStatus] = useState({ configured: false, message: 'Checking...' });
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    // In a real frontend app, this check is tricky. process.env is a Node.js concept.
    // In this Vite-like setup, it's replaced at build time. So we can check it.
    // We assume the key is either present or an empty string/undefined after build.
    const key = process.env.API_KEY;
    if (key && key.length > 0) {
      setApiKeyStatus({ configured: true, message: 'Configured' });
    } else {
      setApiKeyStatus({ configured: false, message: 'Not Configured' });
    }

    // Load saved API_NAME from localStorage if it exists
    const savedApiName = localStorage.getItem('API_NAME');
    if (savedApiName) {
        setApiName(savedApiName);
    }
  }, []);

  const handleSave = () => {
    // Persist API_NAME to localStorage
    localStorage.setItem('API_NAME', apiName);
    setSaveStatus('Settings saved successfully!');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  return (
    <div className="animate-fade-in">
      <header className="text-center mb-12">
        <h1 className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-200 to-cyan-400">
          Settings
        </h1>
        <p className="mt-4 text-lg text-slate-300 max-w-3xl mx-auto">
          Manage application settings and environment variables.
        </p>
      </header>

      <div className="max-w-2xl mx-auto">
        <div className="glass neon p-8 space-y-6">
          <h2 className="text-2xl font-bold text-slate-100 border-b border-slate-700 pb-3">Environment Variables</h2>
          
          {/* API_NAME Input */}
          <div>
            <label htmlFor="api-name" className="block text-sm font-medium text-slate-300 mb-2">
              API Name
            </label>
            <input
              id="api-name"
              type="text"
              value={apiName}
              onChange={(e) => setApiName(e.target.value)}
              placeholder="e.g., My Project API"
              className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-shadow"
            />
             <p className="text-xs text-slate-500 mt-1">A custom name for your API setup (stored locally).</p>
          </div>

          {/* API_KEY Status */}
          <div>
             <label className="block text-sm font-medium text-slate-300 mb-2">
              Gemini API Key
            </label>
            <div className="flex items-center gap-3 bg-slate-800 border border-slate-600 rounded-lg p-3">
                <div className={`w-3 h-3 rounded-full ${apiKeyStatus.configured ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={`font-semibold ${apiKeyStatus.configured ? 'text-green-400' : 'text-red-400'}`}>
                    {apiKeyStatus.message}
                </span>
            </div>
            {!apiKeyStatus.configured && (
                 <p className="text-xs text-slate-500 mt-1">
                    The API Key must be provided as an environment variable (`API_KEY`) to the application runtime. It cannot be set here.
                 </p>
            )}
          </div>

          <div className="pt-4 border-t border-slate-700/50 flex justify-end items-center gap-4">
              {saveStatus && <p className="text-sm text-green-400 animate-fade-in">{saveStatus}</p>}
              <button
                onClick={handleSave}
                className="bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold py-2 px-4 rounded-md transition-all duration-200 transform hover:scale-105"
              >
                Save Settings
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;