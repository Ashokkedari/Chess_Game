♟️ Real-Time Multiplayer Chess Game

A real-time, two-player chess game built with React, Node.js, and Socket.IO, featuring move validation, history tracking, and a sleek responsive design.

🚀 Features
♟️ Real-time multiplayer gameplay (WebSocket)

✅ Accurate move validation via chess.js

📱 Responsive UI for desktop and mobile

💾 Persistent game state across sessions

📜 Move history tracking

⬇️ Game export functionality (.PGN support coming soon!)

🛠 Tech Stack
Layer	Tech Stack
Frontend	React, Vite, Socket.IO Client
Backend	Node.js, Express, Socket.IO
Chess Logic	chess.js
Styling	CSS3, Flexbox/Grid, Responsive Design

⚙️ Getting Started
✅ Prerequisites
Node.js v14+

npm or yarn

📦 Installation
bash
Copy
Edit
# Clone the repo
git clone https://github.com/Ashokkedari/Chess_Game.git
cd Chess_Game

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../chess_application
npm install
▶️ Running the App
bash
Copy
Edit
# Start backend
cd backend
npm run dev
bash
Copy
Edit
# Start frontend
cd ../chess_application
npm run dev
Now open your browser and go to:
🔗 http://localhost:5173

🕹️ How to Play
Create or join a game with a Session ID

Share the Session ID with your opponent

Enjoy real-time chess with validated moves and history tracking

📁 Folder Structure
bash
Copy
Edit
Chess_Game/
├── backend/                # Express + Socket.IO backend
│   └── server.js
├── chess_application/      # React frontend with game logic
│   ├── components/
│   ├── pages/
│   └── socket.js
└── README.md
📸 Demo / Screenshots
(Add gameplay screenshots or a screen recording here for maximum impact)

📝 License
This project is licensed under the MIT License.
You are free to use, modify, and distribute it.

🙌 Contributing
Pull requests are welcome!
Open an issue to suggest features or report bugs.
