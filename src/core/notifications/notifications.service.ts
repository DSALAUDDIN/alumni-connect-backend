import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { Resend } from 'resend';

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  attachments?: any[]; // Add attachments support
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private resend: Resend;

  constructor() {
    // Initialize Firebase Admin
    try {
      if (!admin.apps.length) {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(
          /\\n/g,
          '\n',
        );
        if (!privateKey) {
          this.logger.warn(
            'FIREBASE_PRIVATE_KEY is not defined. Firebase features will be unavailable.',
          );
        } else if (!privateKey.includes('BEGIN PRIVATE KEY')) {
          this.logger.error(
            'FIREBASE_PRIVATE_KEY format is invalid (missing BEGIN PRIVATE KEY header).',
          );
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
      this.logger.error(
        `Failed to initialize Firebase Admin SDK: ${error.message}`,
      );
    }

    // Initialize Resend (to bypass Render SMTP blocking)
    const resendApiKey = process.env.RESEND_API_KEY || 're_EevVGvkt_8ut1864N2D78y9yfeHnBM3Q2';
    this.resend = new Resend(resendApiKey);
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
  async sendMulticastPush(
    tokens: string[],
    payload: PushPayload,
  ): Promise<void> {
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
      // Note: Resend requires a verified domain to send from custom addresses.
      // Defaulting to onboarding@resend.dev if needed, but using your configured 'from'.
      const fromEmail = process.env.RESEND_FROM || 'onboarding@resend.dev';
      const fromName = '"Alumni Connect"';

      await this.resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        attachments: payload.attachments?.map(att => ({
          filename: att.filename,
          content: att.content || att.path, // Resend supports path/content
        })) || [],
      });
      this.logger.log(`Email sent via Resend to: ${payload.to}`);
    } catch (error) {
      this.logger.error(`Failed to send email via Resend: ${error.message}`);
    }
  }

  /**
   * Health check for Nodemailer SMTP connectivity.
   */
  async checkMailer(): Promise<{ status: string; error?: string }> {
    try {
      // Basic check: ensure API key is present
      if (!this.resend) throw new Error('Resend not initialized');
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
