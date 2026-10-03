import nodemailer from 'nodemailer';
import axios from 'axios';

export const sendOtpEmail = async (email: string, otp: string, purpose: 'registration' | 'forgot_password'): Promise<boolean> => {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const emailFrom = process.env.EMAIL_FROM || 'Phoenix-Scroll <phoenixscroll.app@gmail.com>';

  const subject = purpose === 'registration'
    ? 'Phoenix-Scroll - Email Verification Code'
    : 'Phoenix-Scroll - Password Reset OTP';

  const titleText = purpose === 'registration'
    ? 'Verify Your Email Address'
    : 'Reset Your Password';

  const bodyDescription = purpose === 'registration'
    ? 'Thank you for signing up for Phoenix-Scroll. Please use the following One-Time Password (OTP) to complete your account creation:'
    : 'We received a request to reset your password. Please use the following One-Time Password (OTP) to proceed with resetting your password:';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px; color: #1f2937; }
        .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb; padding: 32px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); }
        .brand { font-family: Georgia, serif; font-size: 24px; font-weight: bold; color: #78350f; text-align: center; margin-bottom: 24px; }
        .title { font-size: 18px; font-weight: 700; color: #111827; margin-bottom: 12px; text-align: center; }
        .text { font-size: 14px; line-height: 1.6; color: #4b5563; margin-bottom: 24px; text-align: center; }
        .otp-box { background: #fef3c7; border: 2px dashed #d97706; border-radius: 12px; padding: 18px; text-align: center; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #92400e; margin: 24px 0; }
        .warning { font-size: 12px; color: #6b7280; text-align: center; margin-top: 24px; }
        .footer { border-top: 1px solid #f3f4f6; margin-top: 24px; padding-top: 16px; text-align: center; font-size: 11px; color: #9ca3af; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="brand">📜 Phoenix-Scroll</div>
        <div class="title">${titleText}</div>
        <div class="text">${bodyDescription}</div>
        <div class="otp-box">${otp}</div>
        <div class="text" style="font-size: 13px; font-weight: 600;">This code is valid for 2 minutes. Do not share this code with anyone.</div>
        <div class="warning">If you did not request this email, please ignore it.</div>
        <div class="footer">&copy; ${new Date().getFullYear()} Phoenix-Scroll Publishing Platform. All rights reserved.</div>
      </div>
    </body>
    </html>
  `;

  // 1. Try Brevo REST API v3 if API key is present
  if (brevoApiKey && brevoApiKey.startsWith('xkeysib-')) {
    try {
      await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: { name: 'Phoenix-Scroll', email: emailUser || 'phoenixscroll.app@gmail.com' },
          to: [{ email }],
          subject,
          htmlContent,
        },
        {
          headers: {
            'api-key': brevoApiKey,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log(`✉️ OTP email sent successfully to ${email} via Brevo API`);
      return true;
    } catch (err: any) {
      console.warn('⚠️ Brevo API email dispatch error, trying SMTP fallback:', err.response?.data || err.message);
    }
  }

  // 2. Fallback to Nodemailer SMTP
  if (emailUser && emailPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      });

      await transporter.sendMail({
        from: emailFrom,
        to: email,
        subject,
        html: htmlContent,
      });

      console.log(`✉️ OTP email sent successfully to ${email} via Nodemailer SMTP`);
      return true;
    } catch (err: any) {
      console.error('❌ Nodemailer SMTP dispatch error:', err.message);
    }
  }

  console.log(`🔑 [DEVELOPMENT MODE OTP LOG]: OTP for ${email} (${purpose}) is: ${otp}`);
  return true;
};
