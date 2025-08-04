import express from 'express';
import { protectRoute } from '../utils/protectRoute.js';
import { 
    createChat, 
    getChats, 
    deleteChat, 
    getMessages, 
    sendMessage,
    markMessagesAsSeen,
    getUnreadCount
} from '../controllers/messageController.js';

const router = express.Router();

// Chat management routes
router.post("/create", protectRoute, createChat);
router.get("/chats", protectRoute, getChats);
router.get("/unread-count", protectRoute, getUnreadCount);
router.delete("/chat/:ulid", protectRoute, deleteChat);

// Message routes (now work with chat ULIDs)
router.get("/chat/:ulid", protectRoute, getMessages);
router.post("/chat/:ulid", protectRoute, sendMessage);
router.put("/chat/:ulid/seen", protectRoute, markMessagesAsSeen);

export default router;
