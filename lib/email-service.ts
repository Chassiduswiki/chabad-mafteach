// Email service with Resend integration for production
import { Resend } from 'resend';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Initialize Resend if API key is available
let resend: Resend | null = null;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    // Development mode: Log to console for testing
    if (process.env.NODE_ENV === 'development') {
      console.log('\n' + '='.repeat(50));
      console.log('📧 EMAIL SERVICE - DEVELOPMENT MODE');
      console.log('='.repeat(50));
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log('\nHTML Content:');
      console.log(options.html);
      if (options.text) {
        console.log('\nText Content:');
        console.log(options.text);
      }
      console.log('='.repeat(50));
      console.log('⚠️  In production, this will send a real email via Resend');
      console.log('='.repeat(50) + '\n');
      
      return { success: true };
    }

    // Production mode: Use Resend if available, fallback to console
    if (process.env.NODE_ENV === 'production') {
      if (resend) {
        try {
          const { data, error } = await resend.emails.send({
            from: 'Chabad Mafteach <noreply@chassiduswiki.com>',
            to: [options.to],
            subject: options.subject,
            html: options.html,
            text: options.text,
          });

          if (error) {
            console.error('Resend error:', error);
            return { success: false, error: `Email service error: ${error.message}` };
          }

          console.log(`✅ Email sent successfully to ${options.to}: ${options.subject}`);
          return { success: true };
        } catch (resendError) {
          console.error('Resend API error:', resendError);
          return { success: false, error: 'Failed to send email via Resend' };
        }
      } else {
        // Fallback: Log to console if Resend not configured
        console.warn('⚠️  RESEND_API_KEY not configured. Logging email to console:');
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`HTML: ${options.html.substring(0, 200)}...`);
        
        // Still return success so registration doesn't fail, but log the issue
        return { success: true };
      }
    }

    return { success: false, error: 'Unknown environment' };

  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

export function createVerificationEmail(email: string, verificationLink: string): EmailOptions {
  const verificationUrl = verificationLink;
  
  return {
    to: email,
    subject: 'Welcome to Chabad Mafteach - Please verify your email',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Chabad Mafteach</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; }
          .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; font-size: 12px; color: #666; padding: 20px 0; }
          .welcome-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">📚 Chabad Mafteach</div>
          </div>
          
          <div class="content">
            <div class="welcome-box">
              <h2>🎉 Welcome to the Community!</h2>
              <p>You're just one step away from accessing the comprehensive Chabad Mafteach research platform.</p>
            </div>
            
            <h3>Verify Your Email Address</h3>
            <p>To complete your registration and start exploring, please click the button below to verify your email address:</p>
            
            <a href="${verificationUrl}" class="button">✓ Verify My Email</a>
            
            <p><strong>Can't click the button?</strong> No problem! Copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #2563eb; background: #e3f2fd; padding: 10px; border-radius: 4px;">${verificationUrl}</p>
            
            <p><strong>⏰ This link expires in 24 hours</strong> for security reasons.</p>
            
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 20px 0;">
              <strong>What happens next?</strong><br>
              ✓ Verify your email<br>
              ✓ Get immediate access to the editor<br>
              ✓ Start contributing to the research community
            </div>
          </div>
          
          <div class="footer">
            <p>If you didn't create an account with Chabad Mafteach, you can safely ignore this email.</p>
            <p>© 2024 Chabad Mafteach. Deepening understanding of Chassidic wisdom.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Welcome to Chabad Mafteach!
      
      🎉 You're just one step away from accessing our comprehensive research platform.
      
      Please verify your email address to complete your registration:
      
      ${verificationUrl}
      
      What happens next?
      ✓ Verify your email
      ✓ Get immediate access to the editor  
      ✓ Start contributing to the research community
      
      This link expires in 24 hours for security reasons.
      
      If you didn't create an account with Chabad Mafteach, you can safely ignore this email.
      
      © 2024 Chabad Mafteach. Deepening understanding of Chassidic wisdom.
    `
  };
}

export function createResendVerificationEmail(email: string, verificationLink: string): EmailOptions {
  return {
    to: email,
    subject: 'New verification link for Chabad Mafteach',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New verification link</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; }
          .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; font-size: 12px; color: #666; padding: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Chabad Mafteach</div>
          </div>
          
          <div class="content">
            <h2>New Verification Link</h2>
            <p>You requested a new verification link for your Chabad Mafteach account.</p>
            
            <a href="${verificationLink}" class="button">Verify Email Address</a>
            
            <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #2563eb;">${verificationLink}</p>
            
            <p><strong>This link will expire in 24 hours.</strong></p>
          </div>
          
          <div class="footer">
            <p>If you didn't request this link, you can safely ignore this email.</p>
            <p>© 2024 Chabad Mafteach. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      New Verification Link - Chabad Mafteach
      
      You requested a new verification link for your Chabad Mafteach account.
      
      Please visit: ${verificationLink}
      
      This link will expire in 24 hours.
      
      If you didn't request this link, you can safely ignore this email.
      
      © 2024 Chabad Mafteach. All rights reserved.
    `
  };
}

export function createPasswordResetEmail(email: string, resetLink: string): EmailOptions {
  return {
    to: email,
    subject: 'Reset your Chabad Mafteach password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset your password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; }
          .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; font-size: 12px; color: #666; padding: 20px 0; }
          .warning { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 20px 0; color: #dc2626; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Chabad Mafteach</div>
          </div>
          
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>We received a request to reset the password for your Chabad Mafteach account.</p>
            
            <div class="warning">
              <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
            </div>
            
            <a href="${resetLink}" class="button">Reset Password</a>
            
            <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #dc2626;">${resetLink}</p>
            
            <p><strong>This link will expire in 1 hour for security reasons.</strong></p>
          </div>
          
          <div class="footer">
            <p>If you didn't request this password reset, you can safely ignore this email.</p>
            <p>© 2024 Chabad Mafteach. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Reset Your Password - Chabad Mafteach
      
      We received a request to reset the password for your Chabad Mafteach account.
      
      Please visit: ${resetLink}
      
      Security Notice: If you didn't request this password reset, please ignore this email.
      
      This link will expire in 1 hour for security reasons.
      
      © 2024 Chabad Mafteach. All rights reserved.
    `
  };
}
