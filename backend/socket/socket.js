import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3001"], 
    credentials: true,
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

export function isUserInChatRoom(userId, chatId) {
  return activeChatUsers[chatId] && activeChatUsers[chatId].has(userId.toString());
}

// used to store online users
const userSocketMap = {}; // {userId: socketId}

// Store typing users per chat: {chatId: {userId: socketId}}
const typingUsers = {};

// Store users currently in chat rooms: {chatId: Set(userIds)}
const activeChatUsers = {};

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  // io.emit() is used to send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Handle typing events
  socket.on("typing", ({ chatId, isTyping }) => {
    if (!chatId || !userId) return;

    if (isTyping) {
      // Add user to typing users for this chat
      if (!typingUsers[chatId]) {
        typingUsers[chatId] = {};
      }
      typingUsers[chatId][userId] = socket.id;
    } else {
      // Remove user from typing users for this chat
      if (typingUsers[chatId]) {
        delete typingUsers[chatId][userId];
        if (Object.keys(typingUsers[chatId]).length === 0) {
          delete typingUsers[chatId];
        }
      }
    }

    // Emit typing status to other users in the chat
    socket.to(`chat_${chatId}`).emit("userTyping", {
      userId,
      isTyping,
      chatId
    });
  });

  // Join chat room for typing notifications
  socket.on("joinChat", (chatId) => {
    if (chatId) {
      socket.join(`chat_${chatId}`);
      
      // Track user as active in this chat
      if (!activeChatUsers[chatId]) {
        activeChatUsers[chatId] = new Set();
      }
      activeChatUsers[chatId].add(userId);
      
      console.log(`User ${userId} joined chat room: chat_${chatId}`);
    }
  });

  // Leave chat room
  socket.on("leaveChat", (chatId) => {
    if (chatId) {
      socket.leave(`chat_${chatId}`);
      
      // Remove user from active chat tracking
      if (activeChatUsers[chatId]) {
        activeChatUsers[chatId].delete(userId);
        if (activeChatUsers[chatId].size === 0) {
          delete activeChatUsers[chatId];
        }
      }
      
      console.log(`User ${userId} left chat room: chat_${chatId}`);
      
      // Remove from typing users when leaving chat
      if (typingUsers[chatId] && typingUsers[chatId][userId]) {
        delete typingUsers[chatId][userId];
        if (Object.keys(typingUsers[chatId]).length === 0) {
          delete typingUsers[chatId];
        }
        socket.to(`chat_${chatId}`).emit("userTyping", {
          userId,
          isTyping: false,
          chatId
        });
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];
    
    // Clean up active chat users
    for (const chatId in activeChatUsers) {
      if (activeChatUsers[chatId].has(userId)) {
        activeChatUsers[chatId].delete(userId);
        if (activeChatUsers[chatId].size === 0) {
          delete activeChatUsers[chatId];
        }
      }
    }
    
    // Clean up typing users
    for (const chatId in typingUsers) {
      if (typingUsers[chatId][userId]) {
        delete typingUsers[chatId][userId];
        if (Object.keys(typingUsers[chatId]).length === 0) {
          delete typingUsers[chatId];
        }
        // Notify other users that this user stopped typing
        socket.to(`chat_${chatId}`).emit("userTyping", {
          userId,
          isTyping: false,
          chatId
        });
      }
    }
    
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server }; 