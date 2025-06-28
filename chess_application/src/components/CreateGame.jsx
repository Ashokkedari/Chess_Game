import { useState } from 'react';

function CreateGame({ onCreate }) {
  const [playerName, setPlayerName] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [copied, setCopied] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const generateSessionId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreate = () => {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }
    setShowSuccess(false);
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
    setShowSuccess(true);
    if (onCreate) onCreate({ sessionId: newSessionId, playerName });
    navigator.clipboard.writeText(newSessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-[350px] h-[250px] flex flex-col justify-center items-center transition-all duration-300 px-4 relative overflow-hidden">
      <div className="relative w-full flex flex-col items-center pt-10">
        <div className="flex flex-col items-center w-full gap-3">
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full p-3 shadow-lg z-10 animate-fade-in" />
          <h2 className="text-2xl font-bold text-blue-800 tracking-tight text-center drop-shadow animate-fade-in">
            Create a New Game
          </h2>
          <p className="text-xs text-slate-500 text-center font-mono">
            invite a friend to join
          </p>
          {!sessionId && (
            <form
              className="w-75 flex flex-col gap-3 animate-fade-in items-center"
              onSubmit={e => { e.preventDefault(); handleCreate(); }}
            >
              <div className="w-full">
                <label
                  htmlFor="playerName"
                  className="block text-xs font-medium text-slate-500 mb-1 font-mono"
                >
                  Your Name
                </label>
                <input
                  type="text"
                  id="playerName"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  maxLength={20}
                  className="w-full px-5 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 text-slate-800 text-base shadow-sm transition-all placeholder:text-slate-400 text-center"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="w-full px-5 py-3 rounded-xl text-base font-semibold transition-all shadow-md mt-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 hover:shadow-lg disabled:bg-blue-200 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                Create Game
              </button>
            </form>
          )}
          {sessionId && (
            <div className="flex flex-col items-center justify-center space-y-5 animate-fade-in w-full mt-2">
              {showSuccess && (
                <div className="flex flex-col items-center mb-1 animate-scale-in">
                  <div className="bg-green-100 rounded-full p-2 mb-1">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-green-700 font-medium text-sm">Game Created!</span>
                </div>
              )}
              <div className="text-center space-y-1 w-full">
                <div className="text-xs font-medium text-slate-500">Session ID</div>
                <div className="relative inline-block w-full">
                  <span className="block text-lg font-mono font-semibold text-blue-700 bg-white rounded-xl px-5 py-3 border border-blue-100 select-all transition-all duration-200 w-full text-center">
                    {sessionId}
                  </span>
                  <button
                    onClick={handleCopy}
                    className={`mt-3 w-full px-5 py-3 rounded-xl bg-blue-50 text-blue-700 font-medium hover:bg-blue-100 transition text-sm border border-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-200`}
                  >
                    {copied ? (
                      <span className="flex items-center justify-center gap-1">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Copied!
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <rect x="9" y="9" width="13" height="13" rx="2" />
                          <rect x="3" y="3" width="13" height="13" rx="2" />
                        </svg>
                        Copy
                      </span>
                    )}
                  </button>
                </div>
              </div>
              <button
                onClick={() => {
                  setSessionId('');
                  setPlayerName('');
                  setShowSuccess(false);
                }}
                className="w-full px-5 py-3 rounded-xl bg-slate-100 text-slate-700 font-normal hover:bg-slate-200 transition text-sm mt-2"
              >
                Create Another Game
              </button>
            </div>
          )}
        </div>
      </div>
      <style>{`
        .animate-fade-in { animation: fadeIn 0.5s; }
        .animate-scale-in { animation: scaleIn 0.4s; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(16px);} to { opacity: 1; transform: none; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.8);} to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}

export default CreateGame;