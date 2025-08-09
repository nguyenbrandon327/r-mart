import { sql } from "../config/db.js";
import { upload } from "../utils/s3.js";
import { getReceiverSocketId, isUserInChatRoom, io } from "../socket/socket.js";
import { encrypt, decrypt } from "../utils/crypto.js";
import { generateUniqueChatULID } from "../utils/ulidUtils.js";

// Helper function to safely decrypt messages (handles both encrypted and plain text)
const safeDecrypt = (text) => {
    if (!text) return null;
    
    // Check if the text is in encrypted format (iv:encrypted:authTag)
    const parts = text.split(':');
    if (parts.length === 3) {
        try {
            return decrypt(text);
        } catch (error) {
            return text;
        }
    }
    
    // If not in encrypted format, assume it's plain text
    return text;
};

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
            SELECT id, name, email, username FROM users WHERE id = ${otherUserId}
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

        // Generate ULID for the new chat
        const chatULID = await generateUniqueChatULID();

        // Create new chat
        let newChat;
        if (productId) {
            newChat = await sql`
                INSERT INTO chats (user1_id, user2_id, product_id, ulid)
                VALUES (${user1Id}, ${user2Id}, ${productId}, ${chatULID})
                RETURNING *
            `;
        } else {
            newChat = await sql`
                INSERT INTO chats (user1_id, user2_id, product_id, ulid)
                VALUES (${user1Id}, ${user2Id}, NULL, ${chatULID})
                RETURNING *
            `;
        }

        res.status(201).json({
            success: true, 
            data: newChat[0]
        });
    } catch (error) {
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
                    WHEN c.user1_id = ${currentUserId} THEN u2.email
                    ELSE u1.email
                END as other_user_email,
                CASE 
                    WHEN c.user1_id = ${currentUserId} THEN u2.username
                    ELSE u1.username
                END as other_user_username,
                CASE 
                    WHEN c.user1_id = ${currentUserId} THEN u2.profile_pic
                    ELSE u1.profile_pic
                END as other_user_profile_pic,
                p.name as product_name,
                p.images[1] as product_image,
                p.images as product_images,
                p.price as product_price,
                p.description as product_description,
                p.category as product_category,
                p.slug as product_slug,
                (SELECT COUNT(*) FROM messages WHERE chat_id = c.id) as message_count,
                (SELECT COUNT(*) FROM messages WHERE chat_id = c.id AND sender_id != ${currentUserId} AND seen_at IS NULL) as unread_count,
                (SELECT 
                    CASE 
                        WHEN text IS NOT NULL AND text != '' THEN text
                        WHEN image IS NOT NULL THEN 'Image'
                        ELSE 'Message'
                    END 
                FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
                (SELECT created_at FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_at
            FROM chats c
            LEFT JOIN users u1 ON c.user1_id = u1.id
            LEFT JOIN users u2 ON c.user2_id = u2.id
            LEFT JOIN products p ON c.product_id = p.id
            WHERE c.user1_id = ${currentUserId} OR c.user2_id = ${currentUserId}
            ORDER BY COALESCE((SELECT created_at FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1), c.created_at) DESC
        `;

        // Format timestamps and decrypt last message to ensure consistency
        const formattedChats = chats.map(chat => ({
            ...chat,
            last_message: safeDecrypt(chat.last_message),
            last_message_at: chat.last_message_at ? new Date(chat.last_message_at).toISOString() : null
        }));

        res.status(200).json({
            success: true, 
            data: formattedChats
        });
    } catch (error) {
        res.status(500).json({
            success: false, 
            message: "Failed to fetch chats"
        });
    }
};

// Delete a chat
export const deleteChat = async (req, res) => {
    try {
        const { ulid: chatULID } = req.params;
        const currentUserId = req.user.id;

        // Verify the chat exists and the user is part of it
        const chat = await sql`
            SELECT * FROM chats 
            WHERE ulid = ${chatULID} 
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
            DELETE FROM chats WHERE ulid = ${chatULID}
        `;

        res.status(200).json({
            success: true, 
            message: "Chat deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false, 
            message: "Failed to delete chat"
        });
    }
};

// Get messages for a specific chat
export const getMessages = async (req, res) => {
    try {
        const { ulid: chatULID } = req.params;
        const currentUserId = req.user.id;
        
        // Verify the user is part of this chat
        const chat = await sql`
            SELECT * FROM chats 
            WHERE ulid = ${chatULID} 
            AND (user1_id = ${currentUserId} OR user2_id = ${currentUserId})
        `;

        if (chat.length === 0) {
            return res.status(403).json({
                success: false, 
                message: "You don't have access to this chat"
            });
        }

        const chatId = chat[0].id; // Get the internal ID for message queries

        const messages = await sql`
            SELECT 
                m.*,
                u.name as sender_name,
                u.profile_pic as sender_profile_pic
            FROM messages m
            LEFT JOIN users u ON m.sender_id = u.id
            WHERE m.chat_id = ${chatId}
            ORDER BY m.created_at ASC
        `;

        // Decrypt message text
        const formattedMessages = messages.map(message => ({
            ...message,
            text: safeDecrypt(message.text)
        }));

        res.status(200).json({
            success: true, 
            data: formattedMessages
        });
    } catch (error) {
        res.status(500).json({
            success: false, 
            message: "Failed to fetch messages"
        });
    }
};

// Mark messages as seen
export const markMessagesAsSeen = async (req, res) => {
    try {
        const { ulid: chatULID } = req.params;
        const currentUserId = req.user.id;
        
        // Verify the user is part of this chat
        const chat = await sql`
            SELECT * FROM chats 
            WHERE ulid = ${chatULID} 
            AND (user1_id = ${currentUserId} OR user2_id = ${currentUserId})
        `;

        if (chat.length === 0) {
            return res.status(403).json({
                success: false, 
                message: "You don't have access to this chat"
            });
        }

        const chatId = chat[0].id; // Get the internal ID for message queries

        // Mark all unseen messages from other users as seen
        const updatedMessages = await sql`
            UPDATE messages 
            SET seen_at = NOW()
            WHERE chat_id = ${chatId} 
            AND sender_id != ${currentUserId} 
            AND seen_at IS NULL
            RETURNING *
        `;

        // Notify other users in the chat room that messages have been seen via socket
        if (updatedMessages.length > 0) {
            io.to(`chat_${chatId}`).emit("messagesSeen", {
                chatId: parseInt(chatId),
                seenBy: currentUserId,
                messageIds: updatedMessages.map(msg => msg.id)
            });
        }

        res.status(200).json({
            success: true, 
            data: updatedMessages,
            message: "Messages marked as seen"
        });
    } catch (error) {
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
        res.status(500).json({
            success: false,
            message: "Failed to get unread count"
        });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { ulid: chatULID } = req.params;
        const senderId = req.user.id;
        
        // Verify the user is part of this chat
        const chat = await sql`
            SELECT * FROM chats 
            WHERE ulid = ${chatULID} 
            AND (user1_id = ${senderId} OR user2_id = ${senderId})
        `;

        if (chat.length === 0) {
            return res.status(403).json({
                success: false, 
                message: "You don't have access to this chat"
            });
        }

        const chatId = chat[0].id; // Get the internal ID for message queries
        
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

            // Encrypt the text if it exists
            const encryptedText = text ? encrypt(text) : null;
    
            // Optimized: Single query to insert message and get complete data with user info
            const completeMessage = await sql`
                WITH new_message AS (
                    INSERT INTO messages (chat_id, sender_id, text, image, created_at)
                    VALUES (${chatId}, ${senderId}, ${encryptedText}, ${imageURL}, NOW())
                    RETURNING *
                ),
                updated_chat AS (
                    UPDATE chats 
                    SET last_message_at = NOW()
                    WHERE id = ${chatId}
                    RETURNING id
                )
                SELECT 
                    m.*,
                    u.name as sender_name,
                    u.profile_pic as sender_profile_pic
                FROM new_message m
                LEFT JOIN users u ON m.sender_id = u.id
            `;

            // Format the message for the response
            const formattedMessage = {
                ...completeMessage[0],
                text: safeDecrypt(completeMessage[0].text)
            };

            // Optimized real-time functionality with socket.io
            // Send message to the chat room for users actively viewing the chat
            io.to(`chat_${chatId}`).emit("newMessage", formattedMessage);
            
            // Send individual notifications ONLY to users NOT actively in the chat room
            const user1Id = chat[0].user1_id;
            const user2Id = chat[0].user2_id;
            const user1SocketId = getReceiverSocketId(user1Id.toString());
            const user2SocketId = getReceiverSocketId(user2Id.toString());
            

            
            // Send to user1 if: online, not sender, and NOT actively in chat room
            if (user1SocketId && user1Id !== senderId && !isUserInChatRoom(user1Id, chatId)) {
                io.to(user1SocketId).emit("newMessage", formattedMessage);
            }
            
            // Send to user2 if: online, not sender, and NOT actively in chat room  
            if (user2SocketId && user2Id !== senderId && !isUserInChatRoom(user2Id, chatId)) {
                io.to(user2SocketId).emit("newMessage", formattedMessage);
            }
    
            res.status(201).json({
                success: true, 
                data: formattedMessage
            });
        });
    } catch (error) {
        res.status(500).json({
            success: false, 
            message: "Failed to send message"
        });
    }
};
