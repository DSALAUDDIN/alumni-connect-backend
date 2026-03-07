import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.production
dotenv.config({ path: path.join(__dirname, '../.env.production') });

const LOGO_PATH = path.join(__dirname, '../assets/logo.png');
const LOGO_CID = 'alumni-logo';
const THEME_COLOR = '#DC143C'; // Crimson shade

function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendMail() {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        family: 4, // Prevents ENETUNREACH in environments without IPv6 support
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    } as any);

    const otpCode = generateOtp();

    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"Alumni Connect" <no-reply@alumniconnect.app>',
            to: 'app.alauddin@gmail.com',
            subject: 'Your Login OTP - Alumni Connect',
            text: `Your OTP code is: ${otpCode}\nThis code will expire in 10 minutes.`,
            html: `
                <div style="font-family: Arial, sans-serif; background: #f4f6fb; padding: 0; margin: 0;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; margin: 40px auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); overflow: hidden;">
                        <tr>
                            <td style="background: ${THEME_COLOR}; padding: 24px 0; text-align: center;">
                                <img src="cid:${LOGO_CID}" alt="Alumni Connect" style="height: 48px;">
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 32px 24px 24px 24px; text-align: center;">
                                <h2 style="color: ${THEME_COLOR}; margin-bottom: 16px;">Login to Alumni Connect</h2>
                                <p style="font-size: 16px; color: #222; margin-bottom: 24px;">Your OTP code is:</p>
                                <div style="font-size: 32px; font-weight: bold; color: ${THEME_COLOR}; letter-spacing: 4px; margin-bottom: 24px;">${otpCode}</div>
                                <p style="font-size: 14px; color: #555;">This code will expire in 10 minutes.</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="background: #f4f6fb; padding: 16px 24px; text-align: center; color: #888; font-size: 12px;">
                                &copy; ${new Date().getFullYear()} Alumni Connect. All rights reserved.
                            </td>
                        </tr>
                    </table>
                </div>
            `,
            attachments: [
                {
                    filename: 'logo.png',
                    path: LOGO_PATH,
                    cid: LOGO_CID,
                },
            ],
        });
        console.log('OTP Email sent: %s', info.messageId);
        console.log('OTP Code:', otpCode);
    } catch (error) {
        console.error('Error sending OTP email:', error);
    }
}

sendMail();
