import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService) {}

  private get apiKey(): string | undefined {
    return (
      this.config.get<string>('BREVO_API_KEY') ??
      process.env.BREVO_API_KEY ??
      undefined
    );
  }

  private get senderEmail(): string {
    return (
      this.config.get<string>('BREVO_SENDER_EMAIL') ??
      process.env.BREVO_SENDER_EMAIL ??
      'skillforge901@gmail.com'
    );
  }

  private get senderName(): string {
    return (
      this.config.get<string>('BREVO_SENDER_NAME') ??
      process.env.BREVO_SENDER_NAME ??
      'SkillForge'
    );
  }

  private get webUrl(): string {
    return (
      this.config.get<string>('WEB_ORIGIN') ??
      process.env.WEB_ORIGIN ??
      'http://localhost:3100'
    );
  }

  /**
   * Sends a transactional email using Brevo (supports both REST API key xkeysib- and SMTP key xsmtpsib-)
   */
  async sendTransactionalEmail(options: {
    to: string;
    toName?: string;
    subject: string;
    htmlContent: string;
  }): Promise<boolean> {
    const key = this.apiKey;

    if (!key || key === 'replace_me' || key.trim() === '') {
      this.logger.warn(
        `[EmailService] BREVO_API_KEY not configured. Mocking email send to: ${options.to}`,
      );
      return true;
    }

    // Handle SMTP key format (xsmtpsib-...) via Nodemailer Brevo SMTP Relay
    if (key.startsWith('xsmtpsib-')) {
      try {
        const transporter = nodemailer.createTransport({
          host: 'smtp-relay.brevo.com',
          port: 587,
          secure: false,
          auth: {
            user: this.senderEmail,
            pass: key,
          },
        });

        const info = await transporter.sendMail({
          from: `"${this.senderName}" <${this.senderEmail}>`,
          to: options.to,
          subject: options.subject,
          html: options.htmlContent,
        });

        this.logger.log(
          `[EmailService] Brevo SMTP email sent successfully to ${options.to} (messageId: ${info.messageId})`,
        );
        return true;
      } catch (err: any) {
        this.logger.error(
          `[EmailService] Failed to send email via Brevo SMTP: ${err.message}`,
          err.stack,
        );
        return false;
      }
    }

    // Handle REST API key format (xkeysib-...) via Brevo v3 REST API
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': key,
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: this.senderName,
            email: this.senderEmail,
          },
          to: [
            {
              email: options.to,
              name: options.toName || options.to.split('@')[0],
            },
          ],
          subject: options.subject,
          htmlContent: options.htmlContent,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `[EmailService] Brevo API error (${response.status}): ${errorText}`,
        );
        return false;
      }

      const resData = (await response.json()) as { messageId?: string };
      this.logger.log(
        `[EmailService] Brevo REST email sent successfully to ${options.to} (messageId: ${resData.messageId ?? 'ok'})`,
      );
      return true;
    } catch (err: any) {
      this.logger.error(
        `[EmailService] Failed to send email via Brevo REST API: ${err.message}`,
        err.stack,
      );
      return false;
    }
  }

  /**
   * Send Email Verification Email
   */
  async sendEmailVerification(email: string, token: string, name?: string) {
    const verifyUrl = `${this.webUrl}/verify-email?token=${encodeURIComponent(token)}`;
    const subject = 'Verify your SkillForge account';
    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 40px 20px; border-radius: 16px; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #6366f1; font-size: 28px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">SkillForge</h1>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 4px;">AI-Powered Learning Platform</p>
        </div>
        <div style="background-color: #1e293b; padding: 32px; border-radius: 12px; border: 1px solid #334155;">
          <h2 style="color: #f8fafc; font-size: 20px; margin-top: 0;">Welcome to SkillForge${name ? `, ${name}` : ''}!</h2>
          <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6;">
            Thank you for registering. Please verify your email address to unlock full access to courses, AI tutoring, and certificates.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verifyUrl}" target="_blank" style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 10px 20px -10px #6366f1;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #64748b; font-size: 13px; margin-bottom: 0;">
            If the button doesn't work, copy and paste this link in your browser:<br/>
            <a href="${verifyUrl}" style="color: #818cf8; word-break: break-all;">${verifyUrl}</a>
          </p>
        </div>
        <div style="text-align: center; margin-top: 24px; color: #64748b; font-size: 12px;">
          &copy; ${new Date().getFullYear()} SkillForge. All rights reserved.
        </div>
      </div>
    `;

    return this.sendTransactionalEmail({
      to: email,
      toName: name,
      subject,
      htmlContent,
    });
  }

  /**
   * Send Password Reset Email
   */
  async sendPasswordReset(email: string, token: string, name?: string) {
    const resetUrl = `${this.webUrl}/reset-password?token=${encodeURIComponent(token)}`;
    const subject = 'Reset your SkillForge password';
    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 40px 20px; border-radius: 16px; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #6366f1; font-size: 28px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">SkillForge</h1>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 4px;">Security Notification</p>
        </div>
        <div style="background-color: #1e293b; padding: 32px; border-radius: 12px; border: 1px solid #334155;">
          <h2 style="color: #f8fafc; font-size: 20px; margin-top: 0;">Password Reset Request</h2>
          <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6;">
            We received a request to reset your password for your SkillForge account. Click the button below to set a new password:
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" target="_blank" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 10px 20px -10px #ef4444;">
              Reset Password
            </a>
          </div>
          <p style="color: #94a3b8; font-size: 13px;">
            This link is valid for 1 hour. If you did not request a password reset, you can safely ignore this email.
          </p>
          <p style="color: #64748b; font-size: 13px; margin-bottom: 0;">
            If the button doesn't work, copy and paste this link in your browser:<br/>
            <a href="${resetUrl}" style="color: #f87171; word-break: break-all;">${resetUrl}</a>
          </p>
        </div>
        <div style="text-align: center; margin-top: 24px; color: #64748b; font-size: 12px;">
          &copy; ${new Date().getFullYear()} SkillForge. All rights reserved.
        </div>
      </div>
    `;

    return this.sendTransactionalEmail({
      to: email,
      toName: name,
      subject,
      htmlContent,
    });
  }
}
