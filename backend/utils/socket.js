import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3001"],
    methods: ["GET", "POST"],
  },
});

// Store user socket mappings
const userSocketMap = {}; // {userId: socketId}

export const getReceiverSocketId = (receiverId) => {
  return userSocketMap[receiverId];
};

// Send a message to a user regardless of their online status
export const sendMessageToUser = (message) => {
  const receiverSocketId = userSocketMap[message.receiver_id];
  
  // If the receiver is online, emit the message to them
  if (receiverSocketId) {
    io.to(receiverSocketId).emit("newMessage", message);
  }
  
  // Always emit to the sender (even if the receiver is offline)
  const senderSocketId = userSocketMap[message.sender_id];
  if (senderSocketId) {
    io.to(senderSocketId).emit("newMessage", message);
  }
};

io.on("connection", (socket) => {
  console.log("User connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId != "undefined") userSocketMap[userId] = socket.id;

  // Send list of online users to all connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { app, io, server }; 