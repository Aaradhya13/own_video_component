import { Server } from "socket.io";
import { createServer } from "http";
import express from "express";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const app = express();
const httpServer = createServer(app);


const PORT = process.env.PORT || 8000;

const io = new Server(httpServer, {
  cors: {
    
    origin: /^http:\/\/localhost:\d+$/,
    methods: ["GET", "POST"]
  }
});


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


app.use(express.static(join(__dirname, '../dist')));


app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../dist/index.html'));
});

const rooms = new Map(); 
const emailToSocketIdMap = new Map();
const socketidToEmailMap = new Map();

io.on("connection", (socket) => {
  console.log(`Socket Connected`, socket.id);
  
  socket.on("room:join", (data) => {
    const { email, room, isHost, allowedAttendees } = data;

    
    if (isHost && allowedAttendees) {
      rooms.set(room, {
        hostId: socket.id,
        allowedAttendees: new Set(allowedAttendees)
      });
    }
    
    
    const roomData = rooms.get(room);
    if (!roomData) {
      socket.emit("room:error", "Room does not exist");
      return;
    }
    
    if (!roomData.allowedAttendees.has(email)) {
      socket.emit("room:error", "You are not allowed to join this room");
      return;
    }

    emailToSocketIdMap.set(email, socket.id);
    socketidToEmailMap.set(socket.id, email);
    
    
    socket.join(room);

    
    const usersInRoom = Array.from(io.sockets.adapter.rooms.get(room) || [])
      .filter(id => id !== socket.id)
      .map(id => ({
        id,
        email: socketidToEmailMap.get(id)
      }));

    
    socket.emit("all:users", usersInRoom);
    
  
    io.to(room).emit("user:joined", { 
      email,
      id: socket.id,
      isHost: socket.id === roomData.hostId
    });
  });

  socket.on("sending:signal", ({ userToSignal, callerID, signal }) => {
    io.to(userToSignal).emit("receiving:signal", { 
      signal,
      callerID,
      email: socketidToEmailMap.get(callerID)
    });
  });

  socket.on("returning:signal", ({ signal, callerID }) => {
    io.to(callerID).emit("returning:signal", { signal, id: socket.id });
  });

  socket.on("chat:message", ({ room, message, sender }) => {
    
    const timestamp = new Date().toISOString();
    
    // Broadcast the message to all users in the room
    io.to(room).emit("chat:message", {
      sender,
      message,
      timestamp
    });
    
    
    console.log(`Chat message in room ${room} from ${sender}: ${message}`);
  });

  socket.on("host:toggle-mute", ({ attendeeId }) => {
    const rooms = Array.from(socket.rooms);
    const roomId = rooms.find(room => room !== socket.id);
    
    if (roomId) {
      const roomData = rooms.get(roomId);
      if (roomData && socket.id === roomData.hostId) {
        io.to(roomId).emit("attendee:muted", { 
          id: attendeeId,
          isMuted: true
        });
      }
    }
  });

  socket.on("host:toggle-block", ({ attendeeId }) => {
    const rooms = Array.from(socket.rooms);
    const roomId = rooms.find(room => room !== socket.id);
    
    if (roomId) {
      const roomData = rooms.get(roomId);
      if (roomData && socket.id === roomData.hostId) {
        io.to(roomId).emit("attendee:blocked", { 
          id: attendeeId,
          isBlocked: true
        });
      }
    }
  });

  socket.on("host:remove-attendee", ({ attendeeId }) => {
    const rooms = Array.from(socket.rooms);
    const roomId = rooms.find(room => room !== socket.id);
    
    if (roomId) {
      const roomData = rooms.get(roomId);
      if (roomData && socket.id === roomData.hostId) {
        io.to(roomId).emit("attendee:removed", { id: attendeeId });
        io.sockets.sockets.get(attendeeId)?.leave(roomId);
      }
    }
  });

  socket.on("disconnect", () => {
    
    const userRooms = Array.from(socket.rooms);
    
    
    userRooms.forEach(room => {
      if (room !== socket.id) {
        io.to(room).emit("user:left", { id: socket.id });
      }
    });

    
    const email = socketidToEmailMap.get(socket.id);
    if (email) {
      emailToSocketIdMap.delete(email);
      socketidToEmailMap.delete(socket.id);
    }

    
    userRooms.forEach(room => {
      socket.leave(room);
    });
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});