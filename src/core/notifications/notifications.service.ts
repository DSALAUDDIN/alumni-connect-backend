import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export interface PushPayload {
    title: string;
    body: string;
    data?: Record<string, string>;
}

export interface EmailPayload {
    to: string;
    subject: string;
    html: string;
}

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);
    private mailer: Transporter;

    constructor() {
        // Initialize Firebase Admin
        try {
            if (!admin.apps.length) {
                const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
                if (!privateKey) {
                    this.logger.warn('FIREBASE_PRIVATE_KEY is not defined. Firebase features will be unavailable.');
                } else if (!privateKey.includes('BEGIN PRIVATE KEY')) {
                    this.logger.error('FIREBASE_PRIVATE_KEY format is invalid (missing BEGIN PRIVATE KEY header).');
                } else {
                    admin.initializeApp({
                        credential: admin.credential.cert({
                            projectId: process.env.FIREBASE_PROJECT_ID,
                            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                            privateKey: privateKey,
                        }),
                    });
                    this.logger.log('Firebase Admin SDK initialized successfully');
                }
            }
        } catch (error) {
            this.logger.error(`Failed to initialize Firebase Admin SDK: ${error.message}`);
        }

        // Initialize Nodemailer
        this.mailer = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    /**
     * Send a push notification via Firebase Cloud Messaging.
     * @param token FCM device token
     * @param payload Notification title, body, and optional data
     */
    async sendPush(token: string, payload: PushPayload): Promise<void> {
        try {
            await admin.messaging().send({
                token,
                notification: {
                    title: payload.title,
                    body: payload.body,
                },
                data: payload.data,
            });
            this.logger.log(`Push sent to token: ${token.slice(0, 10)}...`);
        } catch (error) {
            this.logger.error(`Failed to send push notification: ${error.message}`);
        }
    }

    /**
     * Send push to multiple devices at once.
     * @param tokens Array of FCM device tokens
     * @param payload Notification payload
     */
    async sendMulticastPush(tokens: string[], payload: PushPayload): Promise<void> {
        try {
            await admin.messaging().sendEachForMulticast({
                tokens,
                notification: {
                    title: payload.title,
                    body: payload.body,
                },
                data: payload.data,
            });
            this.logger.log(`Multicast push sent to ${tokens.length} devices`);
        } catch (error) {
            this.logger.error(`Multicast push failed: ${error.message}`);
        }
    }

    /**
     * Send an email using Nodemailer.
     * @param payload Email recipient, subject, and HTML body
     */
    async sendEmail(payload: EmailPayload): Promise<void> {
        try {
            await this.mailer.sendMail({
                from: process.env.SMTP_FROM || '"Alumni Connect" <no-reply@alumniconnect.app>',
                to: payload.to,
                subject: payload.subject,
                html: payload.html,
            });
            this.logger.log(`Email sent to: ${payload.to}`);
        } catch (error) {
            this.logger.error(`Failed to send email: ${error.message}`);
        }
    }

    /**
     * Health check for Nodemailer SMTP connectivity.
     */
    async checkMailer(): Promise<{ status: string; error?: string }> {
        try {
            await this.mailer.verify();
            return { status: 'up' };
        } catch (error) {
            return { status: 'down', error: error.message };
        }
    }

    /**
     * Health check for Firebase Admin connectivity.
     */
    async checkFirebase(): Promise<{ status: string; error?: string }> {
        try {
            await admin.app().options;
            return { status: 'up' };
        } catch (error) {
            return { status: 'down', error: error.message };
        }
    }
}
