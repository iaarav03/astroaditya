const { Server } = require('socket.io');
const debug = require('debug')('astro:socket');

function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
      allowedHeaders: ['Authorization', 'Content-Type']
    },
    maxHttpBufferSize: 1e8, // 100 MB
    path: '/socket.io/', // Add trailing slash back
    transports: ['polling', 'websocket'], // Start with polling
    allowUpgrades: true,
    upgradeTimeout: 10000,
    pingTimeout: 60000,
    pingInterval: 25000,
    cookie: {
      name: 'io',
      httpOnly: true,
      sameSite: 'lax'
    }
  });

  // Track active channels for video calls
  const channels = new Map();

  // Add error event handler for the server
  io.engine.on('connection_error', (err) => {
    debug('Connection error:', err);
  });

  // Middleware to handle authentication
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }
      socket.token = token;
      next();
    } catch (error) {
      debug('Auth error:', error);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    debug('New client connected:', socket.id);

    // Chat room handling
    socket.on('join_room', (data) => {
      try {
        const { roomId } = data;
        socket.join(roomId);
        debug(`Client ${socket.id} joined room ${roomId}`);
        
        socket.emit('room_joined', { 
          status: 'success', 
          roomId,
          message: 'Successfully joined room'
        });
      } catch (error) {
        debug('Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Video call handling
    socket.on('join_call', (data) => {
      const { channelId, userId } = data;
      if (!channels.has(channelId)) {
        channels.set(channelId, new Map());
      }
      channels.get(channelId).set(userId, socket);
      
      const participants = Array.from(channels.get(channelId).keys());
      socket.emit('channel_joined', { participants });
      socket.to(channelId).emit('user_joined', { userId });
    });

    socket.on('call_signal', (data) => {
      const { channelId, targetId, type, payload } = data;
      const targetSocket = channels.get(channelId)?.get(targetId);
      if (targetSocket) {
        targetSocket.emit('call_signal', {
          type,
          payload,
          senderId: socket.userId
        });
      }
    });

    // Message handling with acknowledgment
    socket.on('send_message', (message, callback) => {
      try {
        debug('Broadcasting message to room:', message.roomId);
        socket.to(message.roomId).emit('receive_message', {
          ...message,
          timestamp: new Date().toISOString()
        });
        
        if (typeof callback === 'function') {
          callback({ status: 'success' });
        }
      } catch (error) {
        debug('Error sending message:', error);
        if (typeof callback === 'function') {
          callback({ error: 'Failed to send message' });
        }
      }
    });

    // Basic events
    socket.on('typing', (data) => {
      socket.to(data.roomId).emit('typing', data);
    });

    socket.on('disconnect', (reason) => {
      debug(`Client ${socket.id} disconnected:`, reason);
      // Clean up channels
      channels.forEach((participants, channelId) => {
        participants.forEach((sock, userId) => {
          if (sock === socket) {
            participants.delete(userId);
            io.to(channelId).emit('user_left', { userId });
          }
        });
        if (participants.size === 0) {
          channels.delete(channelId);
        }
      });
    });

    socket.on('error', (error) => {
      debug('Socket error:', error);
    });
  });

  return io;
}

module.exports = setupSocket;
