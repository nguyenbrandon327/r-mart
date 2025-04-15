import { sql } from "../config/db.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail } from "../mailtrap/emails.js";

export const signup = async (req, res) => {
    console.log("Signup request received:", req.body);
    const { email, password, name} = req.body;

    try {
        if (!email || !password || !name) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        console.log("Checking if user exists");
        const userAlreadyExists = await sql`
            SELECT * FROM users WHERE name=${name} OR email=${email}
        `;
        console.log("User exists check result:", userAlreadyExists);

        if (userAlreadyExists.length > 0) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        console.log("Hashing password");
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
        
        console.log("Inserting user into database");
        const result = await sql`
            INSERT INTO users (name, email, password, verificationToken, verificationTokenExpiresAt)
            VALUES (${name}, ${email}, ${hashedPassword}, ${verificationToken}, NOW() + INTERVAL '1 day')
            RETURNING id
        `;
        console.log("Insert result:", result);
        
        const insertedId = result[0]?.id;
        
        if (!insertedId) {
            const [insertedUser] = await sql`
                SELECT id FROM users WHERE email = ${email}
            `;            
            if (insertedUser && insertedUser.id) {
                console.log("Setting JWT cookie");
                generateTokenAndSetCookie(res, insertedUser.id);
                
                console.log("Sending successful response");
                return res.status(201).json({ 
                    success: true, 
                    message: "User created successfully",
                    user: {
                        id: insertedUser.id,
                        name,
                        email,
                        verificationToken
                    }
                });
            } else {
                throw new Error("Failed to retrieve user ID after insertion");
            }
        } else {
            generateTokenAndSetCookie(res, insertedId);
            
            await sendVerificationEmail(email, verificationToken);

            return res.status(201).json({ 
                success: true, 
                message: "User created successfully",
                user: {
                    id: insertedId,
                    name,
                    email,
                    verificationToken
                }
            });
        }
    } catch (error) {
        res.status(400).json({ 
            success: false, 
            message: "Error signing up", 
            error: error.message,
        });
    }
};

export const verifyEmail = async (req, res) => {
    // 1 2 3 4 5 6
    const {code} = req.body;
    try {
        const users = await sql`
            SELECT * FROM users WHERE verificationToken=${code} AND verificationTokenExpiresAt > NOW()
        `;

        if (!users || users.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired verification code"
            });
        }
        
        const user = users[0]; // Get the first user from the array
        
        await sql`
            UPDATE users 
            SET isVerified=true, 
                verificationToken=NULL, 
                verificationTokenExpiresAt=NULL 
            WHERE id=${user.id}
        `;

        await sendWelcomeEmail(user.email, user.name);
        
        res.status(200).json({
            success: true,
            message: "Email verified successfully",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                isVerified: true
            }
        });
            
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Error verifying email",
            error: error.message
        });
    }
};

export const login = async (req, res) => {
    const {email, password} = req.body;
    try {
        const user = await sql`
            SELECT * FROM users WHERE email=${email}
        `;

        if (!user || user.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password"
            });
        }
        const isPasswordValid = await bcrypt.compare(password, user[0].password);
        if(!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        generateTokenAndSetCookie(res, user[0].id);

        await sql`
            UPDATE users 
            SET lastLogin=NOW() 
            WHERE id=${user[0].id}
        `;

        res.status(200).json({
            success: true,
            message: "Logged in successfully",
            user: {
                ...user[0],
                password: undefined
            }
        });
    } catch (error) {
        console.log("Error logging in function:", error);
        res.status(400).json({
            success: false,
            message: "Error logging in",
            error: error.message
        });
    }
};

export const logout = async (req, res) => {
    res.clearCookie("token")
    res.status(200).json({
        success: true,
        message: "Logged out successfully"
    });
};

export const forgotPassword = async (req, res) => {
    const {email} = req.body;
    try {
        const user = await sql`
            SELECT * FROM users WHERE email=${email}
        `;

        if (!user || user.length === 0) {
            return res.status(400).json({
                success: false,
                message: "User not found"
            });
        }

        // Generate a reset token
        const resetToken = crypto.randomBytes(20).toString("hex");
        const resetTokenExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour
        
        await sql`
            UPDATE users 
            SET resetPasswordToken=${resetToken}, resetPasswordExpiresAt=${resetTokenExpiresAt} 
            WHERE id=${user[0].id}
        `;

        const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
        await sendPasswordResetEmail(email, resetUrl);
        
        res.status(200).json({
            success: true,
            message: "Password reset email sent successfully"
        });
    } catch (error) {
        console.log("Error sending forgot password email:", error);
        res.status(400).json({
            success: false,
            message: "Error sending forgot password email",
            error: error.message
        });
    }
};

