import { sql } from "../config/db.js";
import { upload } from "../utils/s3.js";
import { getReceiverSocketId, io, sendMessageToUser } from "../utils/socket.js";

export const getUsersForSidebar = async (req, res) => {
    try {
        const loggedInUserId = req.user.id;
        const filteredUsers = await sql`
            SELECT id, name, email
            FROM users
            WHERE id != ${loggedInUserId}
            ORDER BY created_at DESC
        `;
        res.status(200).json({success: true, data: filteredUsers});
    } catch (error) {
        console.log("Error in getUsersForSidebar", error);
        res.status(500).json({success: false, message: "Failed to fetch users for sidebar"});
    }
};

export const getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const senderId = req.user.id;
        
        const messages = await sql`
            SELECT * FROM messages
            WHERE (sender_id = ${senderId} AND receiver_id = ${userToChatId})
            OR (sender_id = ${userToChatId} AND receiver_id = ${senderId})
            ORDER BY created_at ASC
        `;
        res.status(200).json({success: true, data: messages});
    } catch (error) {
        console.log("Error in getMessages", error);
        res.status(500).json({success: false, message: "Failed to fetch messages"});
    }
};

// Middleware to handle file upload
const handleFileUpload = upload.single('image');

export const sendMessage = async (req, res) => {
    try {
        const {id: receiverId} = req.params;
        const senderId = req.user.id;
        
        // Process the file upload first
        handleFileUpload(req, res, async (err) => {
            if (err) {
                return res.status(400).json({success: false, message: err.message});
            }
            
            // After multer processes the form, text is available in req.body
            const text = req.body.text || '';
            
            // Image will be passed as a file, not in the body
            let imageURL = null;
            
            // Handle file upload with multer-s3 middleware
            if (req.file) {
                // Generate the URL manually from the S3 bucket and object key
                const bucketUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;
                imageURL = `${bucketUrl}/${req.file.key}`;
            }

            // Ensure we have either text or image
            if (!text.trim() && !imageURL) {
                return res.status(400).json({success: false, message: "Message must contain text or image"});
            }
    
            const newMessage = await sql`
                INSERT INTO messages (sender_id, receiver_id, text, image)
                VALUES (${senderId}, ${receiverId}, ${text || null}, ${imageURL})
                RETURNING *
            `;
    
            // Use our new function to send messages regardless of online status
            sendMessageToUser(newMessage[0]);
    
            res.status(201).json({success: true, data: newMessage[0]});
        });
    } catch (error) {
        console.log("Error in sendMessage", error);
        res.status(500).json({success: false, message: "Failed to send message"});
    }
}
