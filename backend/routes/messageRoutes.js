import express from 'express';
import { protectRoute } from '../utils/protectRoute.js';
import { 
    createChat, 
    getChats, 
    deleteChat, 
    getMessages, 
    sendMessage,
    markMessagesAsSeen
} from '../controllers/messageController.js';

const router = express.Router();

// Chat management routes
router.post("/create", protectRoute, createChat);
router.get("/chats", protectRoute, getChats);
router.delete("/chat/:id", protectRoute, deleteChat);

// Message routes (now work with chat IDs)
router.get("/chat/:id", protectRoute, getMessages);
router.post("/chat/:id", protectRoute, sendMessage);
router.put("/chat/:id/seen", protectRoute, markMessagesAsSeen);

export default router;
