import { sql } from "../config/db.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail, sendResetSuccessEmail } from "../mailtrap/emails.js";

export const signup = async (req, res) => {
    const { email, password, name} = req.body;

    try {
        if (!email || !password || !name) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        // Validate UCR email domain
        if (!email.toLowerCase().endsWith('@ucr.edu')) {
            return res.status(400).json({ 
                success: false, 
                message: "Registration is restricted to UCR email addresses (@ucr.edu)" 
            });
        }

        const userAlreadyExists = await sql`
            SELECT * FROM users WHERE email=${email}
        `;

        if (userAlreadyExists.length > 0) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
        
        const result = await sql`
            INSERT INTO users (name, email, password, verificationToken, verificationTokenExpiresAt)
            VALUES (${name}, ${email}, ${hashedPassword}, ${verificationToken}, NOW() + INTERVAL '1 day')
            RETURNING id
        `;
        
        const insertedId = result[0]?.id;
        
        if (!insertedId) {
            const [insertedUser] = await sql`
                SELECT id FROM users WHERE email = ${email}
            `;            
            if (insertedUser && insertedUser.id) {
                generateTokenAndSetCookie(res, insertedUser.id);
                
                return res.status(201).json({ 
                    success: true, 
                    message: "User created successfully. Please check your email for verification code.",
                    user: {
                        id: insertedUser.id,
                        name,
                        email
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
                message: "User created successfully. Please check your email for verification code.",
                user: {
                    id: insertedId,
                    name,
                    email
                }
            });
        }
    } catch (error) {
        console.error('Signup error:', error.message, error.stack);
        res.status(400).json({ 
            success: false, 
            message: "Unable to create account. Please try again."
        });
    }
};

export const verifyEmail = async (req, res) => {
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
                username: user.username,
                isVerified: true,
                isOnboarded: user.isonboarded || false
            }
        });
            
    } catch (error) {
        console.error('Email verification error:', error.message, error.stack);
        res.status(400).json({
            success: false,
            message: "Unable to verify email. Please try again."
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
                id: user[0].id,
                name: user[0].name,
                email: user[0].email,
                username: user[0].username,
                profile_pic: user[0].profile_pic,
                description: user[0].description,
                isVerified: user[0].isverified,
                isOnboarded: user[0].isonboarded || false,
                lastLogin: user[0].lastlogin,
                created_at: user[0].created_at
            }
        });
    } catch (error) {
        console.error('Login error:', error.message, error.stack);
        res.status(400).json({
            success: false,
            message: "Unable to log in. Please check your credentials and try again."
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
                message: "If an account with that email exists, a password reset email has been sent."
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

        const resetUrl = `${process.env.CLIENT_URL}/auth/reset-password?token=${resetToken}`;
        await sendPasswordResetEmail(email, resetUrl);
        
        res.status(200).json({
            success: true,
            message: "Password reset email sent successfully"
        });
    } catch (error) {
        console.error('Forgot password error:', error.message, error.stack);
        res.status(400).json({
            success: false,
            message: "Unable to process password reset request. Please try again."
        });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const {token} = req.params;
        const {password} = req.body;
        

        
        // Check token details
        const tokenDetails = await sql`
            SELECT id, email, resetPasswordToken, resetPasswordExpiresAt, NOW() as current_time 
            FROM users 
            WHERE resetPasswordToken=${token}
        `;
        

        
        const user = await sql`
            SELECT * FROM users WHERE resetPasswordToken=${token}
        `;
        

        
        if (!user || user.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid reset token"
            });
        }
        
        // Check if token is expired separately
        const isExpired = user[0].resetpasswordexpiresat < tokenDetails[0].current_time;
        
        if (isExpired) {
            return res.status(400).json({
                success: false,
                message: "Reset token has expired"
            });
        }
        
        // update password
        const hashedPassword = await bcrypt.hash(password, 10);

        await sql`
            UPDATE users 
            SET password=${hashedPassword}, 
                resetPasswordToken=NULL, 
                resetPasswordExpiresAt=NULL 
            WHERE id=${user[0].id}
        `;

        await sendResetSuccessEmail(user[0].email, user[0].name);

        res.status(200).json({
            success: true,
            message: "Password reset successfully"
        });
    } catch (error) {
        console.error('Password reset error:', error.message, error.stack);
        res.status(400).json({
            success: false,
            message: "Unable to reset password. Please try again or request a new reset link."
        });
    }
};

export const resendVerificationCode = async (req, res) => {
    try {
        const user = req.user; // From protectRoute middleware
        
        // Check if user is already verified
        if (user.isverified) {
            return res.status(400).json({
                success: false,
                message: "Email is already verified"
            });
        }
        
        // Generate new verification token
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Update user with new verification token and expiration
        await sql`
            UPDATE users 
            SET verificationToken=${verificationToken}, 
                verificationTokenExpiresAt=NOW() + INTERVAL '1 day'
            WHERE id=${user.id}
        `;
        
        // Send verification email
        await sendVerificationEmail(user.email, verificationToken);
        
        res.status(200).json({
            success: true,
            message: "Verification code sent successfully"
        });
        
    } catch (error) {
        console.error('Resend verification error:', error.message, error.stack);
        res.status(500).json({
            success: false,
            message: "Unable to resend verification code. Please try again."
        });
    }
};

export const checkAuth = async (req, res) => {
    try {
        // The protectRoute middleware already added the user to req
        // Format the user response properly
        res.status(200).json({
            success: true,
            user: {
                id: req.user.id,
                name: req.user.name,
                email: req.user.email,
                username: req.user.username,
                profile_pic: req.user.profile_pic,
                description: req.user.description,
                isVerified: req.user.isverified,
                isOnboarded: req.user.isonboarded || false
            }
        });
    } catch (error) {
        console.error('Auth check error:', error.message, error.stack);
        res.status(500).json({
            success: false,
            message: "Unable to verify authentication. Please try again."
        });
    }
};
