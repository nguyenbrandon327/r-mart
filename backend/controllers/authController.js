import { sql } from "../config/db.js";
import bcrypt from "bcryptjs";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import { sendVerificationEmail } from "../mailtrap/emails.js";

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

export const login = async (req, res) => {
    res.send("login route");
};

export const logout = async (req, res) => {
    res.send("logout route");
};
