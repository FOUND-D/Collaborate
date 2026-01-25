const express = require('express');
const http = require('http'); 
const { Server } = require("socket.io"); 
const Groq = require('groq-sdk');
const cors = require('cors'); 
const dotenv = require('dotenv'); 
const connectDB = require('./config/db'); 
const userRoutes = require('./routes/userRoutes');
const teamRoutes = require('./routes/teamRoutes');
const taskRoutes = require('./routes/taskRoutes');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const { protect } = require('./middleware/authMiddleware');
const Task = require('./models/Task');
const Team = require('./models/Team');

dotenv.config(); 

connectDB(); 

const app = express();

// ============================================================
// [START] REDIRECT MIDDLEWARE
// ============================================================
app.use((req, res, next) => {
  // Get the host from the request headers
  const host = req.get('host');

  // Check if the request is hitting the old Vercel domain
  if (host === 'collaborate-ashy.vercel.app') {
    // Redirect (301 Permanent) to the new domain, preserving the path/query
    return res.redirect(301, `https://collaborate-arin.vercel.app${req.originalUrl}`);
  }

  // If not the old domain, continue to the rest of the app
  next();
});
// ============================================================
// [END] REDIRECT MIDDLEWARE
// ============================================================

const server = http.createServer(app); 
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
}); 
const port = process.env.PORT || 3003;

app.use(cors()); 
app.use(express.json()); 

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY, 
});

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

const projectRoutes = require('./routes/projectRoutes');

app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/projects', projectRoutes);

app.use(notFound);
app.use(errorHandler);

server.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
