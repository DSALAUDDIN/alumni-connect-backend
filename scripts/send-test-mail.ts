
import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.development
dotenv.config({ path: path.join(__dirname, '../.env.development') });

async function sendMail() {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"Alumni Connect" <no-reply@alumniconnect.app>',
            to: 'app.alauddin@gmail.com',
            subject: 'Test Email - Hello',
            text: 'hello',
            html: '<p>hello</p>',
        });
        console.log('Message sent: %s', info.messageId);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

sendMail();
