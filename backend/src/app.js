require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const { startScraper } = require('./scraper/mikrotik.scraper');
const statsRoutes = require('./routes/stats.routes');



const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:4200',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/stats', statsRoutes);

// Connexion MongoDB
mongoose.connect(process.env.MONGO_URI, { family: 4 })
  .then(() => console.log('✅ MongoDB connecté'))
  .catch(err => console.error('❌ MongoDB erreur:', err));

// Routes
const devicesRoutes = require('./routes/devices.routes');
const aliasRoutes = require('./routes/alias.routes');
app.use('/api/alias', aliasRoutes);
app.use('/api/devices', devicesRoutes);

// Socket.IO
io.on('connection', (socket) => {
  console.log('🔌 Client connecté:', socket.id);
  socket.on('disconnect', () => {
    console.log('🔌 Client déconnecté:', socket.id);
  });
});

// Démarrer le scraper en lui passant io pour émettre en temps réel
startScraper(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});