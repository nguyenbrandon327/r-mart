import { mailtrapClient, sender } from "./mailtrap.config.js";
import { VERIFICATION_EMAIL_TEMPLATE, WELCOME_EMAIL_TEMPLATE, PASSWORD_RESET_REQUEST_TEMPLATE, PASSWORD_RESET_SUCCESS_TEMPLATE } from "./emailTemplates.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const sendVerificationEmail = async (email, verificationToken) => {
    const recipient = [{email}]

    try {
        const response = await mailtrapClient.send({
            from: sender,
            to: recipient,
            subject: "Verify Your Email",
            text: `Please verify your email by clicking the link below:`,
            html: VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verificationToken),
            category: "Email Verification"
        })

    } catch (error) {
        throw new Error("Failed to send verification email");
    }
}

export const sendWelcomeEmail = async (email, name) => {
    const recipient = [{email}]

    try {
        // Read the Scotty image file
        const scottyImagePath = path.join(__dirname, "Scotty.jpg");
        const scottyImageBuffer = fs.readFileSync(scottyImagePath);
        const scottyImageBase64 = scottyImageBuffer.toString("base64");

        const response = await mailtrapClient.send({
            from: sender,
            to: recipient,
            subject: "Welcome to R'mart!",
            text: `Welcome ${name} to our app`,
            html: WELCOME_EMAIL_TEMPLATE.replace("{name}", name),
            category: "Welcome Email",
            attachments: [
                {
                    filename: "Scotty.jpg",
                    content: scottyImageBase64,
                    type: "image/jpeg",
                    disposition: "inline",
                    content_id: "scotty"
                }
            ]
        })
    } catch (error) {
        throw new Error("Failed to send welcome email");
    }
}

export const sendPasswordResetEmail = async (email, resetURL) => {
    const recipient = [{email}];

    try {
        const response = await mailtrapClient.send({
            from: sender,
            to: recipient,
            subject: "Reset Your Password",
            html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL),
            category: "Password Reset"
        })
    } catch (error) {
        throw new Error(`Failed to send password reset email: ${error}`);
    }
};

export const sendResetSuccessEmail = async (email, name) => {
    const recipient = [{email}];

    try {
        const response = await mailtrapClient.send({
            from: sender,
            to: recipient,
            subject: "Password Reset Success",
            html: PASSWORD_RESET_SUCCESS_TEMPLATE.replace("{name}", name),
            category: "Password Reset"
        })
    } catch (error) {
        throw new Error(`Failed to send password reset success email: ${error}`);
    }
};
