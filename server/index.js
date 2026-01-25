const express = require('express');

const http = require('http'); // Import http module

const { Server } = require("socket.io"); // Import Server from socket.io

const Groq = require('groq-sdk');

const cors = require('cors'); // Import cors

const dotenv = require('dotenv'); // Import dotenv

const connectDB = require('./config/db'); // Import connectDB

const userRoutes = require('./routes/userRoutes');

const teamRoutes = require('./routes/teamRoutes');

const taskRoutes = require('./routes/taskRoutes');

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



app.use(cors()); // Use cors middleware

app.use(express.json()); // For parsing application/json



const groq = new Groq({

  apiKey: process.env.GROQ_API_KEY, // Use environment variable in production

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



// Error Handling Middleware

app.use(notFound);

app.use(errorHandler);





server.listen(port, () => {

  console.log(`Example app listening at http://localhost:${port}`);

});
