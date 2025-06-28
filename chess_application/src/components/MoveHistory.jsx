import { useState, useRef, useEffect } from 'react';

function MoveHistory({ moves, currentTurn, gameStarted, playerColor, opponentName }) {
  const [expandedMoveId, setExpandedMoveId] = useState(null);
  const movesEndRef = useRef(null);

  useEffect(() => {
    if (movesEndRef.current) {
      movesEndRef.current.scrollTop = movesEndRef.current.scrollHeight;
    }
  }, [moves]);

  // Formatters
  const formatTime = (timestamp) => new Date(timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formatMoveTime = (moveTime) => {
    const seconds = Math.floor(moveTime / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  const getPieceIcon = (pieceType, color) => {
    const icons = { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' };
    return <span className={`text-xl align-middle ${color === 'white' ? 'text-blue-700' : 'text-gray-700'}`}>{icons[pieceType] || ''}</span>;
  };
  const getMoveLabel = (move) => {
    if (!move) return '';
    if (move.pieceColor === playerColor) return 'You';
    return opponentName || (move.pieceColor === 'white' ? 'White' : 'Black');
  };
  const getAvatar = (color) => (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold shadow ${color === 'white' ? 'bg-blue-100 text-blue-700' : 'bg-blue-100 text-blue-700'}`}>{color === 'white' ? 'W' : 'B'}</span>
  );

  // Group moves by move number
  const groupedMoves = [];
  for (let i = 0; i < moves.length; i += 2) {
    groupedMoves.push([moves[i], moves[i + 1]]);
  }

  // Copy all moves as PGN
  const handleCopyAll = () => {
              const fullNotation = moves.map(move => `${move.moveNumber}. ${move.notation}`).join(' ');
              navigator.clipboard.writeText(fullNotation);
              alert('Full game notation copied to clipboard!');
  };

  return (
    <div className="relative bg-white backdrop-blur-md rounded-xl sm:rounded-2xl lg:rounded-3xl border-2 sm:border-4 border-[#e8cade] overflow-hidden flex flex-col w-full max-w-sm sm:max-w-md md:max-w-lg lg:w-[400px] h-[400px] sm:h-[450px] md:h-[500px] lg:h-[500px]">
      {/* Glassy Sticky Header */}
      <div className="sticky top-0 z-10 bg-white/70 h-[40px] sm:h-[50px] backdrop-blur-md border-b border-slate-200 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-3 sm:py-5 gap-2 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3">
          <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold text-gray-500 tracking-tight">Move History</h3>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 px-2 sm:px-4 py-3 sm:py-6 space-y-4 sm:space-y-6 lg:space-y-8 relative overflow-y-auto" ref={movesEndRef}>
        {!gameStarted ? (
          <div className="flex flex-col items-center justify-center py-8 sm:py-16 text-slate-400">
            <span className="text-2xl sm:text-3xl lg:text-4xl animate-pulse mb-2 sm:mb-3">⏳</span>
            <span className="font-medium text-sm sm:text-base lg:text-lg text-center px-2">Waiting for game to start...</span>
          </div>
        ) : moves.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 sm:py-16 text-slate-400">
            <span className="text-2xl sm:text-3xl lg:text-4xl mb-2 sm:mb-3">♟️</span>
            <span className="font-medium text-sm sm:text-base lg:text-lg text-center px-2">No moves yet</span>
            <span className="mt-2 text-xs sm:text-sm text-center px-2">
              Current turn: <span className="font-bold text-blue-700">{currentTurn}</span>
            </span>
          </div>
        ) : (
          <ol className="relative border-l-2 sm:border-l-4 border-blue-200 pl-4 sm:pl-6 lg:pl-8 space-y-12 sm:space-y-16 lg:space-y-24">
            {groupedMoves.map(([whiteMove, blackMove], idx) => (
              <li key={idx} className="relative group">
                {/* Timeline dot */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-6 items-stretch">
                  {/* White move bubble */}
                  {whiteMove && (
                    <MoveBubble
                      move={whiteMove}
                      color="white"
                      expandedMoveId={expandedMoveId}
                      setExpandedMoveId={setExpandedMoveId}
                      getPieceIcon={getPieceIcon}
                      formatTime={formatTime}
                      formatMoveTime={formatMoveTime}
                      getMoveLabel={getMoveLabel}
                      getAvatar={getAvatar}
                      align="left"
                      className="w-full sm:w-auto"
                    />
                  )}
                  {/* Black move bubble */}
                  {blackMove && (
                    <MoveBubble
                      move={blackMove}
                      color="black"
                      expandedMoveId={expandedMoveId}
                      setExpandedMoveId={setExpandedMoveId}
                      getPieceIcon={getPieceIcon}
                      formatTime={formatTime}
                      formatMoveTime={formatMoveTime}
                      getMoveLabel={getMoveLabel}
                      getAvatar={getAvatar}
                      align="right"
                      className="w-full sm:w-auto"
                    />
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Floating Copy Button (mobile) */}
      {moves.length > 0 && (
        <button
          onClick={handleCopyAll}
          className="fixed bottom-4 sm:bottom-8 right-4 sm:right-8 z-30 md:hidden rounded-full bg-blue-600 text-white shadow-xl hover:bg-blue-700 transition p-3 sm:p-4 flex items-center gap-2 text-sm sm:text-lg font-semibold"
          aria-label="Copy all moves as PGN (mobile)"
        >
          <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" /><rect x="3" y="3" width="13" height="13" rx="2" /></svg>
        </button>
      )}

      {/* Footer Stats */}
      {moves.length > 0 && (
        <div className="mt-0 pt-2 sm:pt-4 border-t border-slate-200 flex w-full h-[40px] sm:h-[50px] flex-col sm:flex-row justify-between gap-1 sm:gap-0 bg-white/80 rounded-b-xl sm:rounded-b-2xl lg:rounded-b-3xl shadow-inner px-4 sm:px-6 lg:px-8 pb-3 sm:pb-5">
          <div className="flex-1 text-center p-1 sm:p-2 rounded bg-pink-100 shadow-inner border border-slate-400">
            <div className="text-sm sm:text-lg font-bold text-white-700">{moves.length}</div>
            <div className="text-xs text-slate-700 font-medium">Total Moves</div>
          </div>
          <div className="flex-1 text-center p-1 sm:p-2 rounded bg-pink-100 border border-slate-400">
            <div className="text-sm sm:text-lg font-bold text-white-700">{moves.filter(m => m.player === 'white').length}</div>
            <div className="text-xs text-blue-700 font-medium">White Moves</div>
          </div>
          <div className="flex-1 text-center p-1 sm:p-2 rounded bg-pink-100 border border-slate-400">
            <div className="text-sm sm:text-lg font-bold text-white-700">{moves.filter(m => m.player === 'black').length}</div>
            <div className="text-xs text-blue-700 font-medium">Black Moves</div>
          </div>
        </div>
      )}
    </div>
  );
}

// MoveBubble: visually rich move bubble with avatar, color, and popover
function MoveBubble({ move, color, expandedMoveId, setExpandedMoveId, getPieceIcon, formatTime, formatMoveTime, getMoveLabel, getAvatar, align }) {
  if (!move) return null;
  const isExpanded = expandedMoveId === move.id;
  return (
    <div className={`relative flex-1 flex ${align === 'right' ? 'justify-end' : 'justify-start'} group`}>  
      <div className={`flex items-center gap-3 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
        {getAvatar(color)}
        <button
          className={`relative px-6 py-10 rounded-2xl shadow-lg border-2 transition-all duration-200 text-center font-semibold text-base focus:outline-none focus:ring-2 focus:ring-blue-400 w-32 bg-[#b07b3c] border-[#f0d9b5] opacity-85 text-white flex flex-col items-center justify-center ${isExpanded ? 'scale-105 ring-2 ring-blue-400 z-20' : 'hover:scale-105 hover:ring-2 hover:ring-blue-200'} animate-fade-in`}
          aria-expanded={isExpanded}
          aria-controls={`move-details-${move.id}`}
          onClick={() => setExpandedMoveId(isExpanded ? null : move.id)}
        >
          <div className="flex flex-col items-center gap-1">
            <span className="font-bold text-lg font-mono">{move.from} → {move.to}</span>
            <span className={`text-xs font-bold text-white`}>{getMoveLabel(move)}</span>
          </div>
          {isExpanded && (
            <div id={`move-details-${move.id}`} className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-3 w-72 z-30 bg-white border border-blue-200 rounded-2xl shadow-2xl p-4 text-xs text-slate-700 animate-fade-in`}> 
              <div className="mb-1 flex items-center gap-2"><span className="font-medium">From:</span> <span className="font-mono">{move.from}</span> <span className="ml-2 font-medium">To:</span> <span className="font-mono">{move.to}</span></div>
              <div className="mb-1 flex items-center gap-2"><span className="font-medium">Piece:</span> {getPieceIcon(move.piece, color)} {move.piece} ({move.pieceColor})</div>
              {move.capturedPiece && (
                <div className="mb-1 flex items-center gap-2"><span className="font-medium text-red-500">Captured:</span> {getPieceIcon(move.capturedPiece, color === 'white' ? 'black' : 'white')} {move.capturedPiece}</div>
              )}
              <div className="mb-1 flex items-center gap-2"><span className="font-medium">Move Time:</span> <span className="font-mono">{formatMoveTime(move.moveTime)}</span></div>
              <button
                onClick={() => { navigator.clipboard.writeText(`${move.moveNumber}. ${move.notation}`); alert('Move notation copied to clipboard!'); }}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition"
              >
                Copy Move
              </button>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}

export default MoveHistory;
