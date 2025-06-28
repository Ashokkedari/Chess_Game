import { useState } from 'react';

function ChessBoard({ board, onMove, currentTurn, gameStarted, chess, inCheck, inCheckmate, moveHistory, playerColor, boardSize = 550, gridSize = 436 }) {
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [hoveredSquare, setHoveredSquare] = useState(null); // { row, col } or null

  // Map chess.js piece format to expected format
  const typeMap = {
    p: 'pawn',
    r: 'rook',
    n: 'knight',
    b: 'bishop',
    q: 'queen',
    k: 'king',
  };
  const colorMap = {
    w: 'white',
    b: 'black',
  };

  const getPieceSymbol = (piece) => {
    if (!piece) return '';
    const symbols = {
      king: { white: '♔', black: '♚' },
      queen: { white: '♕', black: '♛' },
      rook: { white: '♖', black: '♜' },
      bishop: { white: '♗', black: '♝' },
      knight: { white: '♘', black: '♞' },
      pawn: { white: '♙', black: '♟' }
    };
    return symbols[piece.type][piece.color];
  };

  const getSquareColor = (row, col) => {
    return (row + col) % 2 === 0 ? 'white' : 'black';
  };

  const isSquareSelected = (row, col) => {
    return selectedSquare && selectedSquare.row === row && selectedSquare.col === col;
  };

  const isValidMove = (row, col) => {
    return validMoves.some(move => move.row === row && move.col === col);
  };

  // Helper to get square notation
  const getSquareNotation = (row, col) => {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    return files[col] + ranks[row];
  };

  // Find king position for highlighting if in check
  let kingPos = null;
  if (inCheck) {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const rawPiece = board[row][col];
        if (rawPiece && rawPiece.type === 'k' && colorMap[rawPiece.color] === currentTurn) {
          kingPos = { row, col };
        }
      }
    }
  }

  // Get last move squares for highlighting
  let lastMoveFrom = null, lastMoveTo = null;
  if (moveHistory && moveHistory.length > 0) {
    const last = moveHistory[moveHistory.length - 1];
    if (last) {
      // Convert algebraic to row/col
      const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
      const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
      lastMoveFrom = {
        row: ranks.indexOf(last.from[1]),
        col: files.indexOf(last.from[0])
      };
      lastMoveTo = {
        row: ranks.indexOf(last.to[1]),
        col: files.indexOf(last.to[0])
      };
    }
  }

  const handleSquareClick = (row, col) => {
    if (!gameStarted) return;
    const rawPiece = board[row][col];
    const piece = rawPiece
      ? { type: typeMap[rawPiece.type], color: colorMap[rawPiece.color] }
      : null;
    // Only allow selecting your own pieces on your turn
    if (!selectedSquare && piece && piece.color === playerColor && currentTurn === playerColor) {
      setSelectedSquare({ row, col });
      // Use chess.js to get legal moves for this piece
      if (chess) {
        const from = getSquareNotation(row, col);
        const moves = chess.moves({ square: from, verbose: true });
        setValidMoves(moves.map(move => {
          // Convert to row/col
          const to = move.to;
          const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
          const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
          const toCol = files.indexOf(to[0]);
          const toRow = ranks.indexOf(to[1]);
          return { row: toRow, col: toCol };
        }));
      } else {
        setValidMoves([]);
      }
      return;
    }
    if (selectedSquare) {
      if (selectedSquare.row === row && selectedSquare.col === col) {
        setSelectedSquare(null);
        setValidMoves([]);
        return;
      }
      if (isValidMove(row, col)) {
        onMove(selectedSquare.row, selectedSquare.col, row, col);
        setSelectedSquare(null);
        setValidMoves([]);
        return;
      }
      // Only allow switching selection to another of your own pieces
      if (piece && piece.color === playerColor && currentTurn === playerColor) {
        setSelectedSquare({ row, col });
        // Use chess.js to get legal moves for this piece
        if (chess) {
          const from = getSquareNotation(row, col);
          const moves = chess.moves({ square: from, verbose: true });
          setValidMoves(moves.map(move => {
            const to = move.to;
            const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
            const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
            const toCol = files.indexOf(to[0]);
            const toRow = ranks.indexOf(to[1]);
            return { row: toRow, col: toCol };
          }));
        } else {
          setValidMoves([]);
        }
        return;
      }
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  const isBlack = playerColor === 'black';
  // For grid: 9x9, first row/col are labels
  const files = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const ranks = [8, 7, 6, 5, 4, 3, 2, 1];

  return (
    <div className="flex flex-col items-center justify-center bg-pink-50 min-h-[500px]">
      {/* Outer box for the board */}
      <div className="w-[600px] h-[600px] rounded-2xl shadow-2xl bg-white border-4 border-[#f5d7eb] flex flex-col items-center justify-center relative">
        {/* Gradient top border */}
        <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"></div>
        {/* 9x9 grid: first row/col are labels */}
        <div className="grid grid-cols-9 grid-rows-9 w-[540px] h-[540px] select-none" style={{gap: 0}}>
          {/* Top-left empty cell */}
          <div></div>
          {/* File labels (A-H) */}
          {(isBlack ? [...files].reverse() : files).map((file, i) => (
            <div
              key={file}
              className={
                `flex items-center justify-center rounded-full w-12 h-6 font-bold text-gray-800 text-base bg-white/80 border border-gray-400 transition ` +
                (
                  selectedSquare && selectedSquare.col === (isBlack ? 7 - i : i)
                    ? 'bg-yellow-400 text-yellow-900 ring-2 ring-yellow-600'
                    : hoveredSquare && hoveredSquare.col === (isBlack ? 7 - i : i)
                      ? 'bg-yellow-200 text-yellow-900 ring-2 ring-yellow-400'
                      : ''
                )
              }
            >
              {file}
            </div>
          ))}
          {/* Ranks and board */}
          {ranks.map((rank, rowIdx) => [
            // Rank label
            <div
              key={rank}
              className={
                `flex items-center justify-center rounded-full w-6 h-12 font-bold text-gray-800 text-base bg-white/80 border border-gray-400 transition ` +
                (
                  selectedSquare && selectedSquare.row === (isBlack ? 7 - rowIdx : rowIdx)
                    ? 'bg-yellow-400 text-yellow-900 ring-2 ring-yellow-600'
                    : hoveredSquare && hoveredSquare.row === (isBlack ? 7 - rowIdx : rowIdx)
                      ? 'bg-yellow-200 text-yellow-900 ring-2 ring-yellow-400'
                      : ''
                )
              }
            >
              {rank}
            </div>,
            // Board squares for this row
            ...(isBlack ? [...files].reverse() : files).map((_, colIdx) => {
              const boardRow = isBlack ? 7 - rowIdx : rowIdx;
              const boardCol = isBlack ? 7 - colIdx : colIdx;
              const rawPiece = board[boardRow][boardCol];
              const piece = rawPiece
                ? { type: typeMap[rawPiece.type], color: colorMap[rawPiece.color] }
                : null;
              return (
                <div
                  key={rowIdx + '-' + colIdx}
                  className={
                    `flex items-center justify-center w-15 h-15 cursor-pointer transition-all duration-300 relative z-20 ` +
                    (inCheck && kingPos && boardRow === kingPos.row && boardCol === kingPos.col
                      ? 'bg-red-500 border-4 border-red-300 z-40'
                      : (getSquareColor(rowIdx, colIdx) === 'white'
                        ? 'bg-[#f0d9b5]'
                        : 'bg-[#b58863]')) +
                    (isSquareSelected(boardRow, boardCol)
                      ? ' shadow-lg scale-105 z-30 ring-2 ring-blue-300 ring-offset-1'
                      : '') +
                    ' hover:scale-110 hover:shadow-2xl hover:z-30 hover:ring-2 hover:ring-blue-200/50'
                  }
                  onClick={() => handleSquareClick(boardRow, boardCol)}
                  onMouseEnter={() => setHoveredSquare({ row: boardRow, col: boardCol })}
                  onMouseLeave={() => setHoveredSquare(null)}
                >
                  {/* Valid move indicator */}
                  {isValidMove(boardRow, boardCol) && !isSquareSelected(boardRow, boardCol) && (
                    <div className="absolute w-5 h-5 bg-gradient-to-br from-emerald-400/60 to-emerald-600/60 rounded-full animate-pulse ring-2 ring-emerald-300/50 shadow-lg"></div>
                  )}
                  {piece && (
                    <div className={
                      `text-4xl font-bold select-none transition-all duration-300 filter drop-shadow-md ` +
                      (piece.color === 'black'
                        ? 'text-slate-800 drop-shadow-[1px_1px_2px_rgba(255,255,255,0.9)]'
                        : 'text-slate-100 drop-shadow-[1px_1px_2px_rgba(0,0,0,0.9)]') +
                      (isSquareSelected(boardRow, boardCol)
                        ? ' scale-110 drop-shadow-[0_6px_12px_rgba(0,0,0,0.5)]'
                        : '') +
                      ' hover:scale-125 hover:drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]'
                    }>
                      {getPieceSymbol(piece)}
                    </div>
                  )}
                </div>
              );
            })
          ])}
        </div>
      </div>
      <div className="text-center mt-4 font-bold text-lg backdrop-blur-sm  px-6 py-3">
        You are playing as <span className={`font-extrabold ${playerColor === 'white' ? 'text-blue-700' : 'text-gray-800'}`}>
          {playerColor.charAt(0).toUpperCase() + playerColor.slice(1)}
        </span>
      </div>
    </div>
  );
}

export default ChessBoard;