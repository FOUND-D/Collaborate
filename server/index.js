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
const meetingRoutes = require('./routes/meetingRoutes');
const organisationRoutes = require('./routes/organisationRoutes');
const orgRoutes = require('./routes/orgRoutes');
const projectRoutes = require('./routes/projectRoutes');
const skillRoutes = require('./routes/skillRoutes');
const listingRoutes = require('./routes/listingRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const badgeRoutes = require('./routes/badgeRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const searchRoutes = require('./routes/searchRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');

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

const jwt = require('jsonwebtoken');
const { getUserById, supabase } = require('./lib/repo');

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (token) {
      if (process.env.JWT_SECRET) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await getUserById(decoded.id);
        if (user) {
          socket.user = user;
        }
      }
    }
    next();
  } catch (err) {
    console.error('Socket authentication warning:', err.message);
    next();
  }
});

io.on('connection', (socket) => {
  console.log('a user connected');

  const resolveSessionTeamId = (session) => session?.team || session?.teamId || session?.team_id;
  const resolveSessionUserId = (payload) => payload?.user?._id || payload?.userId || payload?.user?._id;

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

  socket.on('startSession', (session) => {
    const teamId = resolveSessionTeamId(session);
    if (!teamId) return;
    participants[teamId] = {};
    io.to(teamId).emit('sessionStarted', session);
  });

  socket.on('startMeeting', (meeting) => {
    const teamId = resolveSessionTeamId(meeting);
    if (!teamId) return;
    participants[teamId] = {};
    io.to(teamId).emit('sessionStarted', meeting);
    io.to(teamId).emit('meetingStarted', meeting);
  });

  socket.on('endSession', (session) => {
    const teamId = resolveSessionTeamId(session);
    if (!teamId) return;
    delete participants[teamId];
    io.to(teamId).emit('sessionEnded', session);
  });

  socket.on('endMeeting', (meeting) => {
    const teamId = resolveSessionTeamId(meeting);
    if (!teamId) return;
    delete participants[teamId];
    io.to(teamId).emit('sessionEnded', meeting);
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
    socket.join(user._id);
    io.to(teamId).emit('participantsUpdated', Object.values(participants[teamId]));
  });

  socket.on('userLeft', (payload) => {
    const teamId = payload?.teamId;
    const userId = resolveSessionUserId(payload);
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

  socket.on('joinConversation', async (conversationId) => {
    if (!socket.user) {
      console.warn(`Unauthenticated socket tried to join conversation: ${conversationId}`);
      return;
    }
    try {
      const senderId = socket.user.id || socket.user._id;
      // Check direct conversation membership
      const { data: conversation } = await supabase
        .from('conversations')
        .select('participant_a, participant_b')
        .eq('id', conversationId)
        .maybeSingle();

      if (conversation) {
        if (conversation.participant_a === senderId || conversation.participant_b === senderId) {
          socket.join(`conversation:${conversationId}`);
          console.log(`User ${senderId} securely joined conversation: ${conversationId}`);
        } else {
          console.warn(`Unauthorized join attempt to conversation ${conversationId} by user ${senderId}`);
        }
      } else {
        // Check team membership (if conversationId is a team_id)
        const { data: teamMember } = await supabase
          .from('team_members')
          .select('team_id')
          .eq('team_id', conversationId)
          .eq('user_id', senderId)
          .maybeSingle();

        if (teamMember) {
          socket.join(`conversation:${conversationId}`);
          console.log(`User ${senderId} securely joined team chat: ${conversationId}`);
        } else {
          console.warn(`Unauthorized join attempt to room ${conversationId} by user ${senderId}`);
        }
      }
    } catch (err) {
      console.error('Secure joinConversation error:', err.message);
    }
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

  socket.on('joinNotificationRoom', (userId) => {
    if (!socket.user) {
      console.warn(`Unauthenticated socket tried to join notification room: ${userId}`);
      return;
    }
    const currentUserId = socket.user.id || socket.user._id;
    if (String(currentUserId) === String(userId)) {
      socket.join(`notifications:${userId}`);
      console.log(`User securely joined personal notification room: ${userId}`);
    } else {
      console.warn(`Unauthorized join attempt to notifications:${userId} by user ${currentUserId}`);
    }
  });

  // Typing Indicators
  socket.on('typing', ({ conversationId }) => {
    if (!socket.user) return;
    socket.to(`conversation:${conversationId}`).emit('typing', {
      conversationId,
      userId: socket.user.id || socket.user._id,
      name: socket.user.name,
    });
  });

  socket.on('stopTyping', ({ conversationId }) => {
    if (!socket.user) return;
    socket.to(`conversation:${conversationId}`).emit('stopTyping', {
      conversationId,
      userId: socket.user.id || socket.user._id,
    });
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
app.use('/api/meetings', meetingRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/booking-sessions', sessionRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/organisations', organisationRoutes);
app.use('/api/orgs', orgRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

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
