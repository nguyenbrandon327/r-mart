import { sql } from "../config/db.js";
import { upload } from "../utils/s3.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

// Create a new chat between two users (optionally about a product)
export const createChat = async (req, res) => {
    try {
        const { otherUserId, productId } = req.body;
        const currentUserId = req.user.id;

        // Validate that otherUserId is provided and different from current user
        if (!otherUserId || otherUserId == currentUserId) {
            return res.status(400).json({
                success: false, 
                message: "Invalid user ID for chat creation"
            });
        }

        // Check if other user exists
        const otherUser = await sql`
            SELECT id, name, email FROM users WHERE id = ${otherUserId}
        `;
        
        if (otherUser.length === 0) {
            return res.status(404).json({
                success: false, 
                message: "User not found"
            });
        }

        // If productId is provided, verify the product exists
        if (productId) {
            const product = await sql`
                SELECT id FROM products WHERE id = ${productId}
            `;
            
            if (product.length === 0) {
                return res.status(404).json({
                    success: false, 
                    message: "Product not found"
                });
            }
        }

        // Ensure consistent ordering of user IDs to prevent duplicate chats
        const user1Id = Math.min(currentUserId, otherUserId);
        const user2Id = Math.max(currentUserId, otherUserId);

        // Check if chat already exists
        let existingChat;
        if (productId) {
            existingChat = await sql`
                SELECT * FROM chats 
                WHERE user1_id = ${user1Id} 
                AND user2_id = ${user2Id} 
                AND product_id = ${productId}
            `;
        } else {
            existingChat = await sql`
                SELECT * FROM chats 
                WHERE user1_id = ${user1Id} 
                AND user2_id = ${user2Id} 
                AND product_id IS NULL
            `;
        }

        if (existingChat.length > 0) {
            return res.status(200).json({
                success: true, 
                data: existingChat[0],
                message: "Chat already exists"
            });
        }

        // Create new chat
        let newChat;
        if (productId) {
            newChat = await sql`
                INSERT INTO chats (user1_id, user2_id, product_id)
                VALUES (${user1Id}, ${user2Id}, ${productId})
                RETURNING *
            `;
        } else {
            newChat = await sql`
                INSERT INTO chats (user1_id, user2_id, product_id)
                VALUES (${user1Id}, ${user2Id}, NULL)
                RETURNING *
            `;
        }

        res.status(201).json({
            success: true, 
            data: newChat[0]
        });
    } catch (error) {
        console.log("Error in createChat", error);
        res.status(500).json({
            success: false, 
            message: "Failed to create chat"
        });
    }
};

// Get all chats for the logged-in user
export const getChats = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        
        const chats = await sql`
            SELECT 
                c.*,
                CASE 
                    WHEN c.user1_id = ${currentUserId} THEN u2.name
                    ELSE u1.name
                END as other_user_name,
                CASE 
                    WHEN c.user1_id = ${currentUserId} THEN u2.id
                    ELSE u1.id
                END as other_user_id,
                CASE 
                    WHEN c.user1_id = ${currentUserId} THEN u2.profile_pic
                    ELSE u1.profile_pic
                END as other_user_profile_pic,
                p.name as product_name,
                p.images[1] as product_image,
                p.price as product_price,
                (SELECT COUNT(*) FROM messages WHERE chat_id = c.id) as message_count,
                (SELECT COUNT(*) FROM messages WHERE chat_id = c.id AND sender_id != ${currentUserId} AND seen_at IS NULL) as unread_count,
                (SELECT text FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
            FROM chats c
            LEFT JOIN users u1 ON c.user1_id = u1.id
            LEFT JOIN users u2 ON c.user2_id = u2.id
            LEFT JOIN products p ON c.product_id = p.id
            WHERE c.user1_id = ${currentUserId} OR c.user2_id = ${currentUserId}
            ORDER BY c.last_message_at DESC
        `;

        res.status(200).json({
            success: true, 
            data: chats
        });
    } catch (error) {
        console.log("Error in getChats", error);
        res.status(500).json({
            success: false, 
            message: "Failed to fetch chats"
        });
    }
};

// Delete a chat
export const deleteChat = async (req, res) => {
    try {
        const { id: chatId } = req.params;
        const currentUserId = req.user.id;

        // Verify the chat exists and the user is part of it
        const chat = await sql`
            SELECT * FROM chats 
            WHERE id = ${chatId} 
            AND (user1_id = ${currentUserId} OR user2_id = ${currentUserId})
        `;

        if (chat.length === 0) {
            return res.status(404).json({
                success: false, 
                message: "Chat not found or you don't have permission to delete it"
            });
        }

        // Delete the chat (messages will be deleted due to CASCADE)
        await sql`
            DELETE FROM chats WHERE id = ${chatId}
        `;

        res.status(200).json({
            success: true, 
            message: "Chat deleted successfully"
        });
    } catch (error) {
        console.log("Error in deleteChat", error);
        res.status(500).json({
            success: false, 
            message: "Failed to delete chat"
        });
    }
};

// Get messages for a specific chat
export const getMessages = async (req, res) => {
    try {
        const { id: chatId } = req.params;
        const currentUserId = req.user.id;
        
        // Verify the user is part of this chat
        const chat = await sql`
            SELECT * FROM chats 
            WHERE id = ${chatId} 
            AND (user1_id = ${currentUserId} OR user2_id = ${currentUserId})
        `;

        if (chat.length === 0) {
            return res.status(403).json({
                success: false, 
                message: "You don't have access to this chat"
            });
        }

        const messages = await sql`
            SELECT 
                m.*,
                u.name as sender_name,
                u.profile_pic as sender_profile_pic,
                m.created_at AT TIME ZONE 'UTC' as created_at_utc,
                m.seen_at AT TIME ZONE 'UTC' as seen_at_utc
            FROM messages m
            LEFT JOIN users u ON m.sender_id = u.id
            WHERE m.chat_id = ${chatId}
            ORDER BY m.created_at ASC
        `;

        // Convert timestamps to proper UTC format for frontend
        const formattedMessages = messages.map(message => ({
            ...message,
            created_at: message.created_at_utc ? new Date(message.created_at_utc).toISOString() : message.created_at,
            seen_at: message.seen_at_utc ? new Date(message.seen_at_utc).toISOString() : message.seen_at
        }));

        res.status(200).json({
            success: true, 
            data: formattedMessages
        });
    } catch (error) {
        console.log("Error in getMessages", error);
        res.status(500).json({
            success: false, 
            message: "Failed to fetch messages"
        });
    }
};

// Mark messages as seen
export const markMessagesAsSeen = async (req, res) => {
    try {
        const { id: chatId } = req.params;
        const currentUserId = req.user.id;
        
        // Verify the user is part of this chat
        const chat = await sql`
            SELECT * FROM chats 
            WHERE id = ${chatId} 
            AND (user1_id = ${currentUserId} OR user2_id = ${currentUserId})
        `;

        if (chat.length === 0) {
            return res.status(403).json({
                success: false, 
                message: "You don't have access to this chat"
            });
        }

        // Mark all unseen messages from other users as seen
        const updatedMessages = await sql`
            UPDATE messages 
            SET seen_at = NOW() AT TIME ZONE 'UTC'
            WHERE chat_id = ${chatId} 
            AND sender_id != ${currentUserId} 
            AND seen_at IS NULL
            RETURNING *
        `;

        // Notify other users that messages have been seen via socket
        if (updatedMessages.length > 0) {
            const receiverId = chat[0].user1_id === currentUserId ? chat[0].user2_id : chat[0].user1_id;
            const receiverSocketId = getReceiverSocketId(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("messagesSeen", {
                    chatId: parseInt(chatId),
                    seenBy: currentUserId,
                    messageIds: updatedMessages.map(msg => msg.id)
                });
            }
        }

        res.status(200).json({
            success: true, 
            data: updatedMessages,
            message: "Messages marked as seen"
        });
    } catch (error) {
        console.log("Error in markMessagesAsSeen", error);
        res.status(500).json({
            success: false, 
            message: "Failed to mark messages as seen"
        });
    }
};

// Middleware to handle file upload
const handleFileUpload = upload.single('image');

// Send a message to a specific chat
// Get unread messages count for the current user
export const getUnreadCount = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        
        // Get distinct chats with unread messages where current user is not the sender
        const chatsWithUnread = await sql`
            SELECT DISTINCT m.chat_id FROM messages m
            INNER JOIN chats c ON m.chat_id = c.id
            WHERE (c.user1_id = ${currentUserId} OR c.user2_id = ${currentUserId})
            AND m.sender_id != ${currentUserId}
            AND m.seen_at IS NULL
        `;

        const chatIds = chatsWithUnread.map(row => row.chat_id);
        const unreadCount = chatIds.length;

        res.status(200).json({
            success: true,
            data: { 
                unreadCount: unreadCount,
                chatsWithUnreadMessages: chatIds
            }
        });
    } catch (error) {
        console.log("Error in getUnreadCount", error);
        res.status(500).json({
            success: false,
            message: "Failed to get unread count"
        });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { id: chatId } = req.params;
        const senderId = req.user.id;
        
        // Verify the user is part of this chat
        const chat = await sql`
            SELECT * FROM chats 
            WHERE id = ${chatId} 
            AND (user1_id = ${senderId} OR user2_id = ${senderId})
        `;

        if (chat.length === 0) {
            return res.status(403).json({
                success: false, 
                message: "You don't have access to this chat"
            });
        }

        // Get the receiver ID
        const receiverId = chat[0].user1_id === senderId ? chat[0].user2_id : chat[0].user1_id;
        
        // Process the file upload first
        handleFileUpload(req, res, async (err) => {
            if (err) {
                return res.status(400).json({success: false, message: err.message});
            }
            
            // Extract text from body after multer processing
            const text = req.body.text || null;
            
            // Image will be passed as a file, not in the body
            let imageURL = null;
            
            // Handle file upload with multer-s3 middleware
            if (req.file) {
                // Generate the URL manually from the S3 bucket and object key
                const bucketUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;
                imageURL = `${bucketUrl}/${req.file.key}`;
            }

            // Ensure at least text or image is provided
            if (!text && !imageURL) {
                return res.status(400).json({
                    success: false, 
                    message: "Message must contain text or image"
                });
            }
    
            const newMessage = await sql`
                INSERT INTO messages (chat_id, sender_id, text, image, created_at)
                VALUES (${chatId}, ${senderId}, ${text}, ${imageURL}, NOW() AT TIME ZONE 'UTC')
                RETURNING *
            `;

            // Get the complete message with sender info and proper timezone formatting (consistent with getMessages)
            const completeMessage = await sql`
                SELECT 
                    m.*,
                    u.name as sender_name,
                    u.profile_pic as sender_profile_pic,
                    m.created_at AT TIME ZONE 'UTC' as created_at_utc,
                    m.seen_at AT TIME ZONE 'UTC' as seen_at_utc
                FROM messages m
                LEFT JOIN users u ON m.sender_id = u.id
                WHERE m.id = ${newMessage[0].id}
            `;

            // Update the chat's last_message_at timestamp
            await sql`
                UPDATE chats 
                SET last_message_at = NOW() AT TIME ZONE 'UTC'
                WHERE id = ${chatId}
            `;

            // Format the timestamp for the response (consistent with getMessages)
            const formattedMessage = {
                ...completeMessage[0],
                created_at: completeMessage[0].created_at_utc ? new Date(completeMessage[0].created_at_utc).toISOString() : completeMessage[0].created_at,
                seen_at: completeMessage[0].seen_at_utc ? new Date(completeMessage[0].seen_at_utc).toISOString() : completeMessage[0].seen_at
            };

            // Real-time functionality with socket.io
            const receiverSocketId = getReceiverSocketId(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("newMessage", formattedMessage);
            }
    
            res.status(201).json({
                success: true, 
                data: formattedMessage
            });
        });
    } catch (error) {
        console.log("Error in sendMessage", error);
        res.status(500).json({
            success: false, 
            message: "Failed to send message"
        });
    }
};
