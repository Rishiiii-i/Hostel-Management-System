import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create transporter dynamically based on env variables
function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: { user, pass },
      tls: { rejectUnauthorized: false }
    });
  }

  // If host is not provided but service is gmail
  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailPass = process.env.GMAIL_PASS?.trim();

  if (gmailUser && gmailPass && !gmailUser.includes('your_email') && !gmailPass.includes('your_16_digit')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass
      },
      tls: { rejectUnauthorized: false }
    });
  }

  return null;
}

/**
 * Sends a 6-digit OTP email to the specified email address.
 * Falls back to logging if SMTP is not configured.
 */
export async function sendOtpEmail(recipientEmail, otp) {
  const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.GMAIL_USER || '"Smart Hostel Authentication" <noreply@smarthostel.com>';
  
  const htmlContent = `
    <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
      <div style="text-align: center; margin-bottom: 28px;">
        <div style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 12px; border-radius: 12px; margin-bottom: 12px;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Smart Hostel</h1>
        </div>
        <p style="color: #64748b; font-size: 14px; margin-top: 4px; font-weight: 500;">Two-Step Verification Code</p>
      </div>

      <div style="padding: 24px; border-radius: 12px; background-color: #f8fafc; border: 1px solid #f1f5f9; text-align: center;">
        <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-top: 0; margin-bottom: 20px;">
          Use the following One-Time Password (OTP) to complete your login verification for <strong>${recipientEmail}</strong>:
        </p>

        <div style="display: inline-block; background-color: #ffffff; border: 2px dashed #10b981; padding: 16px 36px; border-radius: 12px; margin: 12px 0 20px 0;">
          <span style="font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #059669; font-family: monospace;">${otp}</span>
        </div>

        <p style="color: #e11d48; font-size: 13px; font-weight: 600; margin: 0;">
          ⏱️ This OTP is valid for 5 minutes only and can be used once.
        </p>
      </div>

      <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #f1f5f9; color: #64748b; font-size: 13px; line-height: 1.5; text-align: center;">
        <p style="margin: 0 0 8px 0;">If you did not request this OTP code, please secure your account immediately or contact hostel administration.</p>
        <p style="margin: 0; color: #94a3b8; font-size: 12px;">&copy; ${new Date().getFullYear()} Smart Hostel Management System. All rights reserved.</p>
      </div>
    </div>
  `;

  const transporter = getTransporter();

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: fromEmail,
        to: recipientEmail,
        subject: `${otp} is your Smart Hostel verification code`,
        html: htmlContent
      });
      console.log(`[OTP Service] Verification email sent to ${recipientEmail}. Message ID: ${info.messageId}`);
      return { success: true, method: 'smtp' };
    } catch (err) {
      console.error(`[OTP Service] Failed to send email via SMTP: ${err.message}. Falling back to log stream.`);
    }
  }

  // Fallback logging mechanism for development / when SMTP credentials aren't set
  try {
    const logPath = path.resolve(__dirname, '../email-debug.log');
    const logEntry = JSON.stringify({
      timestamp: new Date().toISOString(),
      to: recipientEmail,
      type: '2FA_OTP',
      otp: otp,
      status: 'LOGGED_OFFLINE'
    }, null, 2) + '\n---\n';
    fs.appendFileSync(logPath, logEntry);
  } catch (fsErr) {
    console.error('[OTP Service] Log file write error:', fsErr.message);
  }

  console.log(`[OTP Service] Simulated 2FA OTP for ${recipientEmail}: [${otp}]`);
  return { success: true, method: 'debug_log' };
}
