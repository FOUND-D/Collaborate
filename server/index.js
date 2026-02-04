const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http'); // Import http module
const { Server } = require("socket.io"); // Import Server from socket.io
const Groq = require('groq-sdk');
const cors = require('cors'); // Import cors
const dotenv = require('dotenv'); // Import dotenv
const connectDB = require('./config/db'); // Import connectDB
const userRoutes = require('./routes/userRoutes');
const teamRoutes = require('./routes/teamRoutes');
const taskRoutes = require('./routes/taskRoutes');
const messageRoutes = require('./routes/messageRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const { protect } = require('./middleware/authMiddleware');
const Task = require('./models/Task');

const Team = require('./models/Team');





dotenv.config(); // Load environment variables



connectDB(); // Connect to MongoDB



const app = express();

const server = http.createServer(app); // Create http server

const io = new Server(server, {

  cors: {

    origin: "*", // Allow all origins for now, refine later

    methods: ["GET", "POST"]

  }

}); // Initialize socket.io

const port = process.env.PORT || 3003;



app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})); // Use cors middleware



app.use(express.json({ limit: '50mb' })); // For parsing application/json with increased limit



app.use(express.urlencoded({ limit: '50mb', extended: true })); // For parsing application/x-www-form-urlencoded with increased limit







const groq = new Groq({

  apiKey: process.env.GROQ_API_KEY, // Use environment variable in production

});



const participants = {}; // Structure: { teamId: { userId: { socketId, ...userInfo, cameraOn, micOn } } }
const socketToTeamMap = {}; // Global map: { socket.id: teamId }

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('joinTeamRoom', (teamId) => {
    socket.join(teamId);
    console.log(`User joined team room: ${teamId}`);
    socketToTeamMap[socket.id] = teamId; // Store teamId for this socket

    const clients = io.sockets.adapter.rooms.get(teamId);
    const otherUsers = [];
    if (clients) {
      for (const clientId of clients) {
        if (clientId !== socket.id) {
          const userInRoom = Object.values(participants[teamId] || {}).find(p => p.socketId === clientId);
          if (userInRoom) {
            otherUsers.push({ socketId: clientId, userId: userInRoom._id, cameraOn: userInRoom.cameraOn, micOn: userInRoom.micOn }); // Include media status
          } else {
            console.warn(`User with socketId ${clientId} in room ${teamId} not found in participants map when preparing otherUsers list.`);
          }
        }
      }
    }

    // Tell the new user about all the other users
    if(otherUsers.length > 0) {
      socket.emit('other-users', otherUsers);
    }

    // Emit updated participants list to everyone in the room
    if (participants[teamId]) {
      io.to(teamId).emit('participantsUpdated', Object.values(participants[teamId]));
    }

    // Tell the other users about the new user
    const newUserEntry = Object.values(participants[teamId] || {}).find(p => p.socketId === socket.id);
    if(newUserEntry) {
      socket.to(teamId).emit('user-connected', { socketId: socket.id, userId: newUserEntry._id, cameraOn: newUserEntry.cameraOn, micOn: newUserEntry.micOn }); // Include media status
    } else {
        console.warn(`New user with socketId ${socket.id} not found in participants map after joinTeamRoom.`);
    }
  });

  socket.on('startMeeting', (meeting) => {
    participants[meeting.team] = {}; // Initialize as object
    io.to(meeting.team).emit('meetingStarted', meeting);
  });

  socket.on('endMeeting', (meeting) => {
    delete participants[meeting.team];
    io.to(meeting.team).emit('meetingEnded', meeting);
  });

  socket.on('userJoined', ({ teamId, user }) => {
    if (!participants[teamId]) {
      participants[teamId] = {};
    }

    // Add/update user in the new structure
    participants[teamId][user._id] = {
      ...user,
      socketId: socket.id,
      cameraOn: true, // Default status
      micOn: true, // Default status
    };

    io.to(teamId).emit('participantsUpdated', Object.values(participants[teamId]));
  });

  socket.on('userLeft', ({ teamId, user }) => {
    if (participants[teamId] && participants[teamId][user._id]) {
      delete participants[teamId][user._id];
      io.to(teamId).emit('participantsUpdated', Object.values(participants[teamId]));
    }
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
    const teamId = socketToTeamMap[socket.id];
    if (teamId && participants[teamId]) {
      const userEntry = Object.values(participants[teamId]).find(p => p.socketId === socket.id);
      if (userEntry) {
        // Emit user-disconnected with userId
        io.to(teamId).emit('user-disconnected', { socketId: socket.id, userId: userEntry._id });
        delete participants[teamId][userEntry._id];
        io.to(teamId).emit('participantsUpdated', Object.values(participants[teamId]));
      }
    }
    delete socketToTeamMap[socket.id]; // Clean up map
  });

  socket.on('offer', (payload) => {
    io.to(payload.target).emit('offer', { ...payload, senderSocketId: socket.id }); // Add sender's socket.id
  });

  socket.on('answer', (payload) => {
    io.to(payload.target).emit('answer', { ...payload, senderSocketId: socket.id }); // Add sender's socket.id
  });

  socket.on('ice-candidate', (payload) => { // Incoming payload already contains senderUserId and targetUserId
    io.to(payload.target).emit('ice-candidate', { ...payload, senderSocketId: socket.id }); // Add sender's socket.id
  });

  socket.on('toggle-camera', ({ userId, cameraOn }) => {
    const teamId = socketToTeamMap[socket.id];
    if (teamId && participants[teamId] && participants[teamId][userId]) {
      participants[teamId][userId].cameraOn = cameraOn;
      socket.to(teamId).emit('camera-toggled', { userId, cameraOn });
      io.to(teamId).emit('participantsUpdated', Object.values(participants[teamId])); // Update for display
    }
  });

  socket.on('toggle-mic', ({ userId, micOn }) => {
    const teamId = socketToTeamMap[socket.id];
    if (teamId && participants[teamId] && participants[teamId][userId]) {
      participants[teamId][userId].micOn = micOn;
      socket.to(teamId).emit('mic-toggled', { userId, micOn });
      io.to(teamId).emit('participantsUpdated', Object.values(participants[teamId])); // Update for display
    }
  });

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });

  // Chat conversation events
  socket.on('joinConversation', (conversationId) => {
    socket.join(`conversation:${conversationId}`);
    console.log(`User joined conversation: ${conversationId}`);
  });

  socket.on('leaveConversation', (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
    console.log(`User left conversation: ${conversationId}`);
  });

  socket.on('newMessage', (message) => {
    // The message object should contain the teamId or conversationId
    const conversationId = message.team; // Assuming teamId is the conversationId
    if (conversationId) {
      socket.to(`conversation:${conversationId}`).emit('newMessage', message);
    }
  });
});





app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.originalUrl}`);
  next();
});

app.get('/', (req, res) => {

  res.send('api working');

});



app.use((req, res, next) => {
  req.io = io;
  next();
});

const projectRoutes = require('./routes/projectRoutes');



app.use('/api/users', userRoutes);



app.use('/api/teams', teamRoutes);



app.use('/api/tasks', taskRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/messages', messageRoutes);

app.use('/api/upload', uploadRoutes);

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);





server.listen(port, () => {

  console.log(`Example app listening at http://localhost:${port}`);

});
