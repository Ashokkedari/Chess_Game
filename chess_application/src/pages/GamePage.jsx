import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import ChessBoard from '../components/ChessBoard';
import MoveHistory from '../components/MoveHistory';
import { Chess } from 'chess.js';
import socket from '../socket';
import ReactCanvasConfetti from 'react-canvas-confetti';
import { v4 as uuidv4 } from 'uuid';

// Generate or retrieve persistent playerId
let playerId = localStorage.getItem('chessPlayerId');
if (!playerId) {
  playerId = uuidv4();
  localStorage.setItem('chessPlayerId', playerId);
}

function GamePage() {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [playerColor, setPlayerColor] = useState(null);
  const [promotionMove, setPromotionMove] = useState(null);
  
  // Try to recover session from localStorage if location.state is missing
  if (!location.state) {
    const saved = localStorage.getItem('chessSession');
    if (saved) {
      const parsed = JSON.parse(saved);
      navigate(`/game/${parsed.sessionId}`, { state: parsed, replace: true });
      return null;
    }
  }

  const [gameState, setGameState] = useState({
    sessionId: sessionId,
    playerName: location.state?.playerName || 'Player',
    isHost: location.state?.isHost || false,
    opponentName: location.state?.isHost ? 'Waiting for opponent...' : 'Host',
    currentTurn: 'white',
    gameStarted: false, // Always false initially, only true when opponent connects
    gameOver: false,
    winner: null,
    drawReason: null,
    connected: false // Add connection status
  });

  // Use a ref to persist the Chess instance
  const chessRef = useRef(new Chess());
  const [board, setBoard] = useState(chessRef.current.board());
  const [moveHistory, setMoveHistory] = useState([]);
  const [gameStartTime, setGameStartTime] = useState(null);
  const confettiRef = useRef(null);

  // Function to join session when socket is connected
  const joinSession = () => {
    if (socket.connected) {
      console.log('Joining session:', sessionId, 'as', location.state?.playerName, 'playerId:', playerId);
      socket.emit('joinSession', {
        sessionId,
        playerName: location.state?.playerName || 'Player',
        playerId, // Send playerId for reconnection tracking
      });

      // Request current game state after joining
      setTimeout(() => {
        socket.emit('requestGameState', { sessionId });
      }, 1000); // Small delay to ensure we're properly joined
    } else {
      console.log('Socket not connected, waiting for connection...');
      // Wait for connection and try again
      setTimeout(joinSession, 1000);
    }
  };

  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('chessSession', JSON.stringify({
      sessionId,
      playerName: location.state?.playerName || 'Player',
      isHost: location.state?.isHost || false,
      playerId, // Persist playerId for reconnect
    }));

    // Listen for socket connection status
    const handleConnect = () => {
      console.log('✅ Socket connected, joining session...');
      setGameState(prev => ({ ...prev, connected: true }));
      joinSession();
    };

    const handleDisconnect = () => {
      console.log('❌ Socket disconnected');
      setGameState(prev => ({ ...prev, connected: false }));
    };

    // Add connection event listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // If already connected, join immediately
    if (socket.connected) {
      handleConnect();
    }

    // Listen for the full game state from the backend
    socket.on('gameState', (state) => {
      console.log('Received game state from server:', state);
      
      // Restore the chess board state
      if (state.board) {
        try {
          chessRef.current.load(state.board);
          setBoard(chessRef.current.board());
        } catch (error) {
          console.error('Error loading board state:', error);
        }
      }
      
      // Restore move history
      if (state.moveHistory && Array.isArray(state.moveHistory)) {
        setMoveHistory(state.moveHistory);
      }
      
      // Restore game state
      setGameState(prev => ({
        ...prev,
        currentTurn: state.currentTurn || prev.currentTurn,
        gameOver: state.gameOver || false,
        winner: state.winner || null,
        drawReason: state.drawReason || null
      }));
      
      // If we have a game state, the game has started
      if (state.board && state.moveHistory && state.moveHistory.length > 0) {
        setGameState(prev => ({
          ...prev,
          gameStarted: true
        }));
        
        // Set game start time if not already set
        if (!gameStartTime) {
          setGameStartTime(new Date());
        }
      }
    });

    // Listen for opponent moves
    socket.on('opponentMove', (move) => {
      const chess = chessRef.current;
      const moveResult = chess.move(move);
      if (moveResult) {
        completeMove(moveResult);
      }
    });

    // Listen for playerJoined (optional: update opponent name)
    socket.on('playerJoined', ({ players }) => {
      const myId = socket.id;
      console.log('playerJoined event:', players, 'myId:', myId);
      const me = players.find(p => p.id === myId);
      const opponent = players.find(p => p.id !== myId);
      console.log('me:', me, 'opponent:', opponent);

      // Set player color from backend assignment
      if (me && playerColor !== me.color) setPlayerColor(me.color);

      // Set player and opponent names based on color
      let whiteName = '';
      let blackName = '';
      if (players.length === 2) {
        whiteName = players.find(p => p.color === 'white')?.name || 'White';
        blackName = players.find(p => p.color === 'black')?.name || 'Black';
      } else {
        // Only one player, assign accordingly
        if (me?.color === 'white') {
          whiteName = me.name;
          blackName = 'Waiting for opponent...';
        } else {
          blackName = me?.name;
          whiteName = 'Waiting for opponent...';
        }
      }

      setGameState(prev => ({
        ...prev,
        playerName: me?.name || prev.playerName,
        opponentName: opponent?.name || (prev.isHost ? 'Waiting for opponent...' : 'Host'),
        whiteName,
        blackName,
        gameStarted: players.length === 2,
      }));

      if (players.length === 2 && !gameStartTime) setGameStartTime(new Date());
    });

    // Listen for explicit player leave (game should end)
    socket.on('playerExplicitlyLeft', ({ playerId }) => {
      console.log('Player explicitly left the game:', playerId);
      
      // Determine the winner based on who left
      const remainingPlayer = gameState.playerName;
      const winner = remainingPlayer;
      
      setGameState(prev => ({
        ...prev,
        gameOver: true,
        winner: winner,
        opponentName: 'Opponent left',
        drawReason: null
      }));
    });

    // Listen for temporary disconnect (don't end game, just show status)
    socket.on('playerTemporarilyDisconnected', ({ playerId }) => {
      console.log('Player temporarily disconnected:', playerId);
      setGameState(prev => ({
        ...prev,
        opponentName: 'Opponent disconnected - waiting for reconnection...',
      }));
    });

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('gameState');
      socket.off('opponentMove');
      socket.off('playerJoined');
      socket.off('playerExplicitlyLeft');
      socket.off('playerTemporarilyDisconnected');
    };
  }, [sessionId, location.state?.playerName, playerColor, gameStartTime]);

  useEffect(() => {
    if (gameState.gameStarted && !gameStartTime) {
      setGameStartTime(new Date());
    }
  }, [gameState.gameStarted, gameStartTime]);

  function getSquareNotation(row, col) {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    return files[col] + ranks[row];
  }

  const completeMove = (move) => {
    const chess = chessRef.current;
    if (!move) return; // Invalid move
    setBoard(chess.board());
    // Add move to moveHistory
    setMoveHistory(prev => [
      ...prev,
      {
        id: prev.length + 1,
        moveNumber: Math.floor((prev.length) / 2) + 1,
        player: move.color === 'w' ? 'white' : 'black',
        from: move.from,
        to: move.to,
        piece: move.piece,
        pieceColor: move.color === 'w' ? 'white' : 'black',
        notation: move.san,
        capturedPiece: move.captured || null,
        timestamp: new Date(),
        boardState: chess.fen(),
        moveTime: gameStartTime ? new Date() - gameStartTime : 0
      }
    ]);

    const isGameOver = chess.isGameOver();
    let winner = null;
    let drawReason = null;

    if (isGameOver) {
      if (chess.isCheckmate()) {
        winner = move.color === 'w' ? 'White' : 'Black';
      } else if (chess.isStalemate()) {
        drawReason = "Stalemate";
      } else if (chess.isThreefoldRepetition()) {
        drawReason = "Threefold Repetition";
      } else if (chess.isInsufficientMaterial()) {
        drawReason = "Insufficient Material";
      } else if (chess.isDraw()) {
        drawReason = "50-move rule";
      }
    }

    setGameState(prev => ({
      ...prev,
      currentTurn: chess.turn() === 'w' ? 'white' : 'black',
      gameOver: isGameOver,
      winner: winner,
      drawReason: drawReason
    }));
  }

  function handleMove(fromRow, fromCol, toRow, toCol) {
    if (!gameState.gameStarted || gameState.gameOver) return;
    const chess = chessRef.current;
    // Turn enforcement
    if (chess.turn() !== playerColor?.charAt(0)) {
      return; // Not player's turn
    }
    const from = getSquareNotation(fromRow, fromCol);
    const to = getSquareNotation(toRow, toCol);
    const piece = chess.get(from);
    if (piece?.type === 'p' && ((piece.color === 'w' && toRow === 0) || (piece.color === 'b' && toRow === 7))) {
      setPromotionMove({ from, to });
      return;
    }
    const move = chess.move({ from, to });
    if (move) {
      // Complete the move locally first
      completeMove(move);
      
      // Get the updated move history after the move is completed
      const updatedMoveHistory = [
        ...moveHistory,
        {
          id: moveHistory.length + 1,
          moveNumber: Math.floor((moveHistory.length) / 2) + 1,
          player: move.color === 'w' ? 'white' : 'black',
          from: move.from,
          to: move.to,
          piece: move.piece,
          pieceColor: move.color === 'w' ? 'white' : 'black',
          notation: move.san,
          capturedPiece: move.captured || null,
          timestamp: new Date(),
          boardState: chess.fen(),
          moveTime: gameStartTime ? new Date() - gameStartTime : 0
        }
      ];
      
      // Send move and current game state to server
      socket.emit('move', { 
        sessionId, 
        move: { from, to },
        gameState: {
          board: chess.fen(),
          moveHistory: updatedMoveHistory,
          currentTurn: chess.turn() === 'w' ? 'white' : 'black',
          gameOver: chess.isGameOver(),
          winner: chess.isCheckmate() ? (move.color === 'w' ? 'White' : 'Black') : null,
          drawReason: chess.isStalemate() ? 'Stalemate' : 
                     chess.isThreefoldRepetition() ? 'Threefold Repetition' :
                     chess.isInsufficientMaterial() ? 'Insufficient Material' :
                     chess.isDraw() ? '50-move rule' : null
        }
      });
    }
  }

  const handlePromotion = (promotionPiece) => {
    if (!promotionMove) return;
    const { from, to } = promotionMove;
    const chess = chessRef.current;
    const move = chess.move({ from, to, promotion: promotionPiece });
    if (move) {
      // Complete the move locally first
      completeMove(move);
      
      // Get the updated move history after the move is completed
      const updatedMoveHistory = [
        ...moveHistory,
        {
          id: moveHistory.length + 1,
          moveNumber: Math.floor((moveHistory.length) / 2) + 1,
          player: move.color === 'w' ? 'white' : 'black',
          from: move.from,
          to: move.to,
          piece: move.piece,
          pieceColor: move.color === 'w' ? 'white' : 'black',
          notation: move.san,
          capturedPiece: move.captured || null,
          timestamp: new Date(),
          boardState: chess.fen(),
          moveTime: gameStartTime ? new Date() - gameStartTime : 0
        }
      ];
      
      // Send promotion move and current game state to server
      socket.emit('move', { 
        sessionId, 
        move: { from, to, promotion: promotionPiece },
        gameState: {
          board: chess.fen(),
          moveHistory: updatedMoveHistory,
          currentTurn: chess.turn() === 'w' ? 'white' : 'black',
          gameOver: chess.isGameOver(),
          winner: chess.isCheckmate() ? (move.color === 'w' ? 'White' : 'Black') : null,
          drawReason: chess.isStalemate() ? 'Stalemate' : 
                     chess.isThreefoldRepetition() ? 'Threefold Repetition' :
                     chess.isInsufficientMaterial() ? 'Insufficient Material' :
                     chess.isDraw() ? '50-move rule' : null
        }
      });
    }
    setPromotionMove(null);
  };

  const getPieceSymbol = (piece) => {
    if (!piece) return '';
    
    const symbols = {
      king: 'K',
      queen: 'Q',
      rook: 'R',
      bishop: 'B',
      knight: 'N',
      pawn: ''
    };
    
    return symbols[piece.type] || '';
  };

  const getPromotionPieceSymbol = (piece) => {
    const symbols = { q: '♕', r: '♖', b: '♗', n: '♘' };
    return symbols[piece] || '';
  }

  const generateMoveNotation = (fromRow, fromCol, toRow, toCol, piece, capturedPiece) => {
    const fromSquare = getSquareNotation(fromRow, fromCol);
    const toSquare = getSquareNotation(toRow, toCol);
    const pieceSymbol = getPieceSymbol(piece);
    
    let notation = pieceSymbol + fromSquare + toSquare;
    
    if (capturedPiece) {
      notation = pieceSymbol + fromSquare + 'x' + toSquare;
    }
    
    // Add check/checkmate detection (simplified)
    // You can enhance this with proper chess logic
    if (piece.type === 'king' && Math.abs(fromCol - toCol) > 1) {
      // Castling
      notation = toCol > fromCol ? 'O-O' : 'O-O-O';
    }
    
    return notation;
  };

  const copySessionId = () => {
    navigator.clipboard.writeText(sessionId);
    alert('Session ID copied to clipboard!');
  };

  const exportGameRecord = () => {
    const gameRecord = {
      sessionId: sessionId,
      startTime: gameStartTime,
      endTime: new Date(),
      players: {
        white: gameState.whiteName,
        black: gameState.blackName
      },
      moves: moveHistory,
      finalBoard: board,
      gameResult: gameState.gameOver ? (gameState.winner || 'Draw') : 'In Progress'
    };
    
    const dataStr = JSON.stringify(gameRecord, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chess-game-${sessionId}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const leaveGame = () => {
    if (confirm('Are you sure you want to leave the game?')) {
      localStorage.removeItem('chessSession');
      navigate('/');
    }
  };

  // Add FEN/PGN export helpers
  const getFEN = () => chessRef.current.fen();
  const getPGN = () => chessRef.current.pgn();

  function fireFireworks() {
    if (confettiRef.current) {
      confettiRef.current({
        origin: { y: 1 }, // bottom of the screen
        particleCount: 200,
        spread: 120,
        startVelocity: 40,
        gravity: 0.8,
        ticks: 100,
        colors: ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93'],
      });
    }
  }

  useEffect(() => {
    if (gameState.gameOver && (gameState.winner === gameState.playerName || gameState.winner === gameState.whiteName || gameState.winner === gameState.blackName)) {
      fireFireworks();
    }
  }, [gameState.gameOver, gameState.winner]);

  if (!location.state) {
    return (
      <div className="min-h-screen flex items-center justify-center p-5">
        <div className="bg-white rounded-2xl p-12 shadow-xl border border-slate-200 max-w-lg w-full text-center">
          <h2 className="text-3xl font-black text-red-600 mb-5">Invalid Access</h2>
          <p className="text-gray-600 mb-8 text-lg leading-relaxed">
            Please create or join a game from the home page.
          </p>
          <button 
            onClick={() => navigate('/')} 
            className="px-8 py-4 bg-blue-700 text-white font-bold rounded-xl text-lg transition hover:scale-105 hover:shadow-lg"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden pt-[90px] pb-5 px-5 flex flex-col gap-6 relative">
      {/* Clean Background Design */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
        {/* Clean White Background */}
        <div className="absolute inset-0 bg-pink-50"></div>
        
        {/* Subtle Diagonal Lines */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="diagonal-lines" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 0 10 L 10 0" stroke="#b07b3c" strokeWidth="5" fill="none"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#diagonal-lines)"/>
          </svg>
        </div>
      </div>
      
      {/* Game Header */}
      <div className="flex justify-center items-center w-full mb-6 mt-10">
        <div className="w-full md:w-[85%] h-[60px] bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 px-8 py-4 transition-all">
          {/* Left: Chess + Session ID */}
          <div className="flex items-center justify-center gap-3 min-w-[200px] pl-10 ml-1 h-full">
            <span className="text-4xl font-extrabold text-blue-900 tracking-tight select-none drop-shadow -mt-2">Chess</span>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-mono text-base font-bold shadow-sm border border-blue-200">
              <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a5 5 0 00-10 0v2a2 2 0 00-2 2v7a2 2 0 002 2h10a2 2 0 002-2v-7a2 2 0 00-2-2z" /></svg>
              {sessionId}
            </span>
            {gameState.isHost && !gameState.gameStarted && (
              <button 
                onClick={copySessionId} 
                className="ml-2 px-3 py-1.5 bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow hover:bg-blue-800 transition"
                aria-label="Copy Session ID"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15V5a2 2 0 012-2h10" /></svg>
                Copy
              </button>
            )}
          </div>
          {/* Center: Player Info + Current Turn/Status */}
          <div className="flex flex-col md:flex-row items-center gap-4 flex-1 justify-center min-w-[220px]">
            <div className="flex flex-row items-center gap-6">
              <div className="flex flex-col items-center gap-1 p-3 bg-gradient-to-br from-blue-50 to-white rounded-xl border border-slate-200 min-w-24 shadow-inner">
                <span className="font-bold text-base text-blue-900">{gameState.whiteName || 'White'}</span>
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">White</span>
          </div>
              <div className="text-xl font-black text-blue-700">VS</div>
              <div className="flex flex-col items-center gap-1 p-3 bg-gradient-to-br from-slate-100 to-white rounded-xl border border-slate-200 min-w-24 shadow-inner">
                <span className="font-bold text-base text-slate-900">{gameState.blackName || 'Black'}</span>
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Black</span>
        </div>
            </div>
            <div className="ml-6">
          {!gameState.gameStarted ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-200 text-slate-600 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse mr-2"></span>
                  Waiting for opponent...
            </div>
          ) : gameState.gameOver ? (
                <div className="inline-flex flex-col items-center px-4 py-2 bg-red-50 rounded-full border border-red-200 text-red-700 shadow-sm">
                  <span className="font-black text-red-600">Game Over!</span>
                  <span>
                    {gameState.winner ? (
                      <>
                        {gameState.winner} wins!
                        {chessRef.current.isCheckmate() && <span className="ml-1 text-xs">(Checkmate)</span>}
                      </>
                    ) : (
                      <>
                        It's a draw! {gameState.drawReason ? `(${gameState.drawReason})` : ''}
                      </>
                    )}
                  </span>
            </div>
          ) : chessRef.current.inCheck() ? (
                <div className="inline-flex items-center px-4 py-2 bg-yellow-50 rounded-full border border-yellow-200 text-yellow-800 shadow-sm">
                  <svg className="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="font-bold">Check!</span>
                </div>
          ) : (
                <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full border border-blue-200 font-bold text-blue-900 shadow-sm">
                  <svg className="w-7 h-7 mr-2 text-blue-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                  Current Turn:
                  <span className="ml-2 font-bold text-blue-900">
                  {gameState.currentTurn === playerColor
                    ? (playerColor === 'white' ? gameState.whiteName : gameState.blackName)
                      : (playerColor === 'white' ? gameState.blackName : gameState.whiteName)}
                    <span className="ml-1 text-xs text-blue-700">({gameState.currentTurn.charAt(0).toUpperCase() + gameState.currentTurn.slice(1)})</span>
                </span>
            </div>
          )}
        </div>
          </div>
          {/* Right: Export + Leave */}
          <div className="flex flex-row gap-3 items-center min-w-[180px] pr-8 -mr-10">
          {moveHistory.length > 0 && (
            <button 
              onClick={exportGameRecord} 
                className="px-5 py-2 w-[100px] h-[40px] bg-slate-800 text-white font-bold rounded-xl flex items-center gap-2 shadow hover:bg-slate-900 transition"
                aria-label="Export Game"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" /></svg>
                Export
            </button>
          )}
          <button 
            onClick={leaveGame} 
              className="px-5 py-2 w-[100px] h-[40px] bg-red-600 text-white font-bold rounded-xl flex items-center gap-2 shadow hover:bg-red-700 transition"
              aria-label="Leave Game"
          >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
              Leave
          </button>
          </div>
        </div>
      </div>

      {/* Game Content */}
      {gameState.gameStarted && playerColor ? (
        <div className="flex gap-12 justify-center items-start flex-1 min-h-0 overflow-hidden">
          {/* Chess Board (left) */}
          <div className="flex justify-end items-start flex-shrink-0">
            <ChessBoard 
              board={board}
              onMove={handleMove}
              currentTurn={gameState.currentTurn}
              gameStarted={gameState.gameStarted}
              chess={chessRef.current}
              inCheck={chessRef.current.inCheck()}
              inCheckmate={chessRef.current.isCheckmate()}
              moveHistory={moveHistory}
              playerColor={playerColor}
              boardSize={650}
              gridSize={600}
            />
          </div>
          {/* Move History Sidebar (right) */}
          <div className="flex flex-col h-[700px] w-[420px] overflow-hidden">
            <MoveHistory 
              moves={moveHistory}
              currentTurn={gameState.currentTurn}
              gameStarted={gameState.gameStarted}
              playerColor={playerColor}
              opponentName={gameState.opponentName}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-1 justify-center items-center min-h-0 overflow-hidden">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-300 border-t-blue-700 rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="text-2xl font-bold text-blue-900 mb-2">Waiting for opponent to join...</h3>
            <p className="text-slate-600">Share your session ID with your friend to start the game.</p>
          </div>
        </div>
      )}
      {/* Promotion Modal */}
      {promotionMove && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[100]">
          <div className="bg-white p-8 rounded-lg shadow-xl text-center">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">Promote Pawn</h3>
            <div className="flex gap-4">
              {['q', 'r', 'b', 'n'].map(p => (
                <button
                  key={p}
                  onClick={() => handlePromotion(p)}
                  className="w-20 h-20 bg-slate-200 rounded-lg text-5xl flex justify-center items-center transition hover:bg-blue-300 hover:scale-110"
                >
                  {p === 'q' ? '♕' : p === 'r' ? '♖' : p === 'b' ? '♗' : '♘'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <ReactCanvasConfetti
        refConfetti={confettiRef}
        style={{
          position: 'fixed',
          pointerEvents: 'none',
          width: '100vw',
          height: '100vh',
          bottom: 0,
          left: 0,
          zIndex: 9999,
        }}
      />
    </div>
  );
}

export default GamePage;