import { useState, useRef, useEffect } from 'react';

function JoinGame({ onJoin }) {
  const [playerName, setPlayerName] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [sessionError, setSessionError] = useState('');
  const sessionInputRef = useRef(null);

  useEffect(() => {
    sessionInputRef.current?.focus();
  }, []);

  const handleJoin = () => {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }
    if (sessionId.length !== 6) {
      setSessionError('Session ID must be 6 characters');
      return;
    }
    setSessionError('');
    if (onJoin) onJoin({ sessionId, playerName });
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-[350px] h-[250px] flex flex-col justify-center items-center transition-all duration-300 py-10 px-4 md:px-8 relative overflow-hidden">
      <div className="relative w-full flex flex-col items-center pt-10">
        <div className="w-full flex flex-col gap-3 items-center">
        <h2 className="text-2xl font-bold text-blue-800 tracking-tight text-center drop-shadow animate-fade-in">
            Join a  Game
          </h2>
          <p className="text-xs text-slate-500 text-center font-mono">
            meet our friend
          </p>
          <form className="w-full flex flex-col gap-1 animate-fade-in items-center" onSubmit={e => { e.preventDefault(); handleJoin(); }}>
            <div className="w-full max-w-[300px] mx-auto">
              <label htmlFor="playerName" className="block text-xs font-medium text-slate-500 mb-1 font-mono">
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
              />
            </div>
            <div className="w-full max-w-[300px] mx-auto">
              <label htmlFor="sessionId" className="block text-xs font-medium text-slate-500 mb-1 font-mono">
                Session ID
              </label>
              <input
                type="text"
                id="sessionId"
                ref={sessionInputRef}
                value={sessionId}
                onChange={(e) => {
                  setSessionId(e.target.value.toUpperCase());
                  if (e.target.value.length !== 6) {
                    setSessionError('Session ID must be 6 characters');
                  } else {
                    setSessionError('');
                  }
                }}
                placeholder="Enter Session ID"
                maxLength={6}
                className={`w-full px-5 py-3 rounded-xl border text-base shadow-sm focus:outline-none focus:ring-2 transition-all placeholder:text-slate-400 text-center ${
                  sessionError
                    ? 'border-red-400 ring-red-200 text-red-800 placeholder:text-red-400'
                    : 'border-slate-300 focus:ring-blue-200 text-slate-800'
                }`}
              />
              {sessionError && <p className="text-red-400 text-sm mb-1">{sessionError}</p>}
            </div><br/>
            <button
              type="submit"
              className="w-[170px] max-w-[300px] mx-auto px-5 py-3 rounded-xl text-base font-semibold transition-all shadow-md mt-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 hover:shadow-lg disabled:bg-blue-200 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              Join Game
            </button>
          </form>
        </div>
      </div>
      {/* Animations */}
      <style>{`
        .animate-fade-in { animation: fadeIn 0.5s; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(16px);} to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}

export default JoinGame; 