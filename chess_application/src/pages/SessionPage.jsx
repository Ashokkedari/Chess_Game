import { useNavigate } from 'react-router-dom';
import CreateGame from '../components/CreateGame.jsx';
import JoinGame from '../components/JoinGame.jsx';

function SessionPage() {
  const navigate = useNavigate();

  const handleCreate = ({ sessionId, playerName }) => {
    navigate(`/game/${sessionId}`, {
      state: { sessionId, playerName, isHost: true },
    });
  };

  const handleJoin = ({ sessionId, playerName }) => {
    navigate(`/game/${sessionId}`, {
      state: { sessionId, playerName, isHost: false },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden pt-[50px]">
      {/* Subtle chessboard background pattern */}
      <div className="absolute inset-0 w-full h-full opacity-20 pointer-events-none z-0">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 8 8"
          preserveAspectRatio="none"
          className="w-full h-full"
          style={{ minWidth: '100vw', minHeight: '100vh', display: 'block' }}
        >
          {[...Array(8)].map((_, i) =>
            [...Array(8)].map((_, j) => (
              <rect
                key={i + '-' + j}
                x={i}
                y={j}
                width={1}
                height={1}
                fill={(i + j) % 2 === 0 ? '#b07b3c' : '#f7d59c'}
              />
            ))
          )}
        </svg>
      </div>
      <div className="w-[900px] h-[500px] rounded-3xl shadow-2xl border border-slate-200 bg-white/90 overflow-hidden py-12 px-4 md:px-12 z-10 flex flex-col">
        <div className="flex flex-col items-center mb-10"><br/>
          <h1 className="text-5xl md:text-5xl font-extrabold text-blue-900 text-center tracking-tight drop-shadow">Chess</h1>
          <p className="text-center text-slate-600 mt-2 text-lg md:text-xl font-medium">Play chess with a friend!</p>
        </div>
        <br/><br/>
        <div className="flex flex-col md:flex-row justify-center items-stretch gap-0 md:gap-8 pt-[50px]">
          {/* Create Game Card */}
          <div className="flex-1 flex items-center justify-center mb-8 md:mb-0">
            <div className="w-full max-w-md bg-white rounded-2xl p-8 flex flex-col items-center">
              <p className="text-slate-500 mb-6 text-center">Start a new chess game and invite a friend to join your session.</p>
              <CreateGame onCreate={handleCreate} />
            </div>
          </div>
          {/* Divider */}
          <div className="flex items-center justify-center md:px-0 px-8">
            <div className="hidden md:block h-64 w-1 bg-slate-200 rounded-full"></div>
            <div className="md:hidden flex items-center justify-center my-8">
              <span className="inline-block px-6 py-2 bg-slate-200 rounded-full text-slate-500 font-bold text-lg shadow">OR</span>
            </div>
          </div>
          {/* Join Game Card */}
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-md bg-white rounded-2xl p-8 flex flex-col items-center">
              <p className="text-slate-500 mb-6 text-center">Enter a session ID to join your friend's chess game and have fun</p>
              <JoinGame onJoin={handleJoin} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SessionPage;
