const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const Groq = require('groq-sdk');
const cors = require('cors');
const connectDB = require('./config/db');

const userRoutes = require('./routes/userRoutes');
const teamRoutes = require('./routes/teamRoutes');
const taskRoutes = require('./routes/taskRoutes');
const messageRoutes = require('./routes/messageRoutes');
const organisationRoutes = require('./routes/organisationRoutes');
const orgRoutes = require('./routes/orgRoutes');
const projectRoutes = require('./routes/projectRoutes');

const { errorHandler, notFound } = require('./middleware/errorMiddleware');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const port = process.env.PORT || 3002;

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const participants = {};
const socketToTeamMap = {};

io.on('connection', (socket) => {
  console.log('a user connected');

  const resolveMeetingTeamId = (meeting) => meeting?.team || meeting?.teamId || meeting?.team_id;
  const resolveMeetingUserId = (payload) => payload?.user?._id || payload?.userId || payload?.user?._id;

  socket.on('joinTeamRoom', (teamId) => {
    socket.join(teamId);
    console.log(`User joined team room: ${teamId}`);
    socketToTeamMap[socket.id] = teamId;

    const clients = io.sockets.adapter.rooms.get(teamId);
    const otherUsers = [];
    if (clients) {
      for (const clientId of clients) {
        if (clientId !== socket.id) {
          const userInRoom = Object.values(participants[teamId] || {}).find(p => p.socketId === clientId);
          if (userInRoom) {
            otherUsers.push({
              socketId: clientId,
              userId: userInRoom._id,
              cameraOn: userInRoom.cameraOn,
              micOn: userInRoom.micOn
            });
          } else {
            console.warn(`User with socketId ${clientId} in room ${teamId} not found in participants map.`);
          }
        }
      }
    }

    if (otherUsers.length > 0) {
      socket.emit('other-users', otherUsers);
    }

    if (participants[teamId]) {
      io.to(teamId).emit('participantsUpdated', Object.values(participants[teamId]));
    }

    const newUserEntry = Object.values(participants[teamId] || {}).find(p => p.socketId === socket.id);
    if (newUserEntry) {
      socket.to(teamId).emit('user-connected', {
        socketId: socket.id,
        userId: newUserEntry._id,
        cameraOn: newUserEntry.cameraOn,
        micOn: newUserEntry.micOn
      });
    } else {
      console.warn(`New user with socketId ${socket.id} not found in participants map after joinTeamRoom.`);
    }
  });

  socket.on('startMeeting', (meeting) => {
    const teamId = resolveMeetingTeamId(meeting);
    if (!teamId) return;
    participants[teamId] = {};
    io.to(teamId).emit('meetingStarted', meeting);
  });

  socket.on('endMeeting', (meeting) => {
    const teamId = resolveMeetingTeamId(meeting);
    if (!teamId) return;
    delete participants[teamId];
    io.to(teamId).emit('meetingEnded', meeting);
  });

  socket.on('userJoined', ({ teamId, user }) => {
    if (!participants[teamId]) {
      participants[teamId] = {};
    }
    participants[teamId][user._id] = {
      ...user,
      socketId: socket.id,
      cameraOn: user.cameraOn ?? false,
      micOn: user.micOn ?? false,
    };
    io.to(teamId).emit('participantsUpdated', Object.values(participants[teamId]));
  });

  socket.on('userLeft', (payload) => {
    const teamId = payload?.teamId;
    const userId = resolveMeetingUserId(payload);
    if (participants[teamId] && userId && participants[teamId][userId]) {
      delete participants[teamId][userId];
      io.to(teamId).emit('participantsUpdated', Object.values(participants[teamId]));
    }
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
    const teamId = socketToTeamMap[socket.id];
    if (teamId && participants[teamId]) {
      const userEntry = Object.values(participants[teamId]).find(p => p.socketId === socket.id);
      if (userEntry) {
        io.to(teamId).emit('user-disconnected', {
          socketId: socket.id,
          userId: userEntry._id
        });
        delete participants[teamId][userEntry._id];
        io.to(teamId).emit('participantsUpdated', Object.values(participants[teamId]));
      }
    }
    delete socketToTeamMap[socket.id];
  });

  socket.on('offer', (payload) => {
    io.to(payload.target).emit('offer', { ...payload, senderSocketId: socket.id });
  });

  socket.on('answer', (payload) => {
    io.to(payload.target).emit('answer', { ...payload, senderSocketId: socket.id });
  });

  socket.on('ice-candidate', (payload) => {
    io.to(payload.target).emit('ice-candidate', { ...payload, senderSocketId: socket.id });
  });

  socket.on('toggle-camera', ({ userId, cameraOn }) => {
    const teamId = socketToTeamMap[socket.id];
    if (teamId && participants[teamId] && participants[teamId][userId]) {
      participants[teamId][userId].cameraOn = cameraOn;
      socket.to(teamId).emit('camera-toggled', { userId, cameraOn });
      io.to(teamId).emit('toggle-camera', { userId, cameraOn });
      io.to(teamId).emit('participantsUpdated', Object.values(participants[teamId]));
    }
  });

  socket.on('toggle-mic', ({ userId, micOn }) => {
    const teamId = socketToTeamMap[socket.id];
    if (teamId && participants[teamId] && participants[teamId][userId]) {
      participants[teamId][userId].micOn = micOn;
      socket.to(teamId).emit('mic-toggled', { userId, micOn });
      io.to(teamId).emit('toggle-mic', { userId, micOn });
      io.to(teamId).emit('participantsUpdated', Object.values(participants[teamId]));
    }
  });

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });

  socket.on('joinConversation', (conversationId) => {
    socket.join(`conversation:${conversationId}`);
    console.log(`User joined conversation: ${conversationId}`);
  });

  socket.on('leaveConversation', (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
    console.log(`User left conversation: ${conversationId}`);
  });

  socket.on('newMessage', (message) => {
    const conversationId = message.team;
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

app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/organisations', organisationRoutes);
app.use('/api/orgs', orgRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/messages', messageRoutes);

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
    server.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
