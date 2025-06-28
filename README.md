# Chess Game

A real-time multiplayer chess game built with React, Node.js, and Socket.IO.

## Features

- Real-time multiplayer gameplay
- Move validation using chess.js
- Game state persistence
- Responsive design
- Move history tracking
- Game export functionality

## Tech Stack

- **Frontend**: React, Vite, Socket.IO Client
- **Backend**: Node.js, Express, Socket.IO
- **Chess Logic**: chess.js
- **Styling**: CSS3 with modern design

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Ashokkedari/Chess_Game.git
cd chess-game
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../chess_application
npm install
```

### Running the Application

1. Start the backend server:
```bash
cd backend
npm start
```

2. Start the frontend development server:
```bash
cd chess_application
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

## How to Play

1. Create a new game or join an existing one using a session ID
2. Share the session ID with your opponent
3. Start playing chess!

## License

This project is licensed under the MIT License.
