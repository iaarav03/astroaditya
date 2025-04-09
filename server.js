const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const userRoutes = require("./src/routes/users");
const authRoutes = require("./src/routes/auth");
const shopRoutes = require("./src/routes/shop");
const adminRoutes = require("./src/routes/admin");
const astrologersRouter = require('./src/routes/astrologers');
const superAdminRoutes = require("./src/routes/superadmin");
const setupSocket = require("./socket/socket");
dotenv.config();

const app = express();

// Validating environment variables
const requiredEnvVars = ['MONGODB_URI', 'CORS_ORIGIN', 'JWT_SECRET'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}
app.use(cors({
  origin: 'https://astroalert-one.vercel.app', 
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  // Logging can be enabled if needed
  next();
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("Connected to MongoDB", process.env.MONGODB_URI))
.catch((err) => console.error("Failed to connect to MongoDB", err));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/users', userRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/astrologers', astrologersRouter);
app.use('/api/superadmin', superAdminRoutes);

app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ 
    success: false, 
    error: err.message || 'Something broke!' 
  });
});

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`✅ CORS enabled for origin: ${process.env.CORS_ORIGIN}`);
  console.log(`🟢 Socket.IO server running at ws://localhost:${PORT}`);
});

// Initialize Socket.IO using the server returned from app.listen
const io = setupSocket(server);
app.set('io', io);
