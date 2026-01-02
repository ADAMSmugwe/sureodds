/**
 * Notification Service
 * Handles sending notifications when new bookings are received.
 * 
 * Supports multiple notification methods:
 * - Console logging (always enabled)
 * - Email via Gmail SMTP (if configured)
 * - Telegram (if configured)
 */

import nodemailer from 'nodemailer';

interface BookingNotification {
  bookingId: string;
  fullName: string;
  email: string;
  phone: string;
  packageName: string;
  packagePrice: number;
  createdAt: Date;
}

// Create Gmail SMTP transporter
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER, // sureoddsanalytics@gmail.com
      pass: process.env.GMAIL_APP_PASSWORD, // App password from Google
    },
  });
};

/**
 * Send notification for a new booking
 */
export async function sendBookingNotification(booking: BookingNotification): Promise<void> {
  const message = formatBookingMessage(booking);

  // Always log to console
  console.log('\n========================================');
  console.log('🔔 NEW BOOKING RECEIVED!');
  console.log('========================================');
  console.log(message);
  console.log('========================================\n');

  // Send email notifications if configured
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    // Send notification to admin
    await sendAdminEmailNotification(booking);
    // Send confirmation to customer
    await sendCustomerConfirmationEmail(booking);
  }

  // Send Telegram notification if configured
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    await sendTelegramNotification(message);
  }
}

/**
 * Format booking details into a readable message
 */
function formatBookingMessage(booking: BookingNotification): string {
  return `
📋 Booking Details:
-------------------
🆔 Booking ID: ${booking.bookingId}
👤 Name: ${booking.fullName}
📧 Email: ${booking.email}
📱 Phone: ${booking.phone}
📦 Package: ${booking.packageName}
💰 Price: KES ${booking.packagePrice}
📅 Date: ${booking.createdAt.toLocaleString()}

Action Required: Contact the customer to complete the sale.
  `.trim();
}

/**
 * Send email notification to admin using Gmail SMTP
 */
async function sendAdminEmailNotification(booking: BookingNotification): Promise<void> {
  try {
    const transporter = createEmailTransporter();
    
    const mailOptions = {
      from: `SureOdds Analytics <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER, // Send to yourself
      subject: `🔔 New Booking: ${booking.packageName} Package - ${booking.fullName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">🔔 New Booking Received!</h2>
          <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
            <tr>
              <td style="padding: 12px; border: 1px solid #e5e7eb; background: #f9fafb;"><strong>Booking ID</strong></td>
              <td style="padding: 12px; border: 1px solid #e5e7eb;">${booking.bookingId}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #e5e7eb; background: #f9fafb;"><strong>Name</strong></td>
              <td style="padding: 12px; border: 1px solid #e5e7eb;">${booking.fullName}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #e5e7eb; background: #f9fafb;"><strong>Email</strong></td>
              <td style="padding: 12px; border: 1px solid #e5e7eb;"><a href="mailto:${booking.email}">${booking.email}</a></td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #e5e7eb; background: #f9fafb;"><strong>Phone</strong></td>
              <td style="padding: 12px; border: 1px solid #e5e7eb;"><a href="tel:${booking.phone}">${booking.phone}</a></td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #e5e7eb; background: #f9fafb;"><strong>Package</strong></td>
              <td style="padding: 12px; border: 1px solid #e5e7eb; color: #10b981; font-weight: bold;">${booking.packageName}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #e5e7eb; background: #f9fafb;"><strong>Price</strong></td>
              <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold;">KES ${booking.packagePrice}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #e5e7eb; background: #f9fafb;"><strong>Date</strong></td>
              <td style="padding: 12px; border: 1px solid #e5e7eb;">${booking.createdAt.toLocaleString()}</td>
            </tr>
          </table>
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0;">
            <strong>⚡ Action Required:</strong> Contact the customer to complete the sale.
          </div>
        </div>
      `,
      text: formatBookingMessage(booking),
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Admin email notification sent to:', process.env.GMAIL_USER);

  } catch (error) {
    console.error('❌ Admin email notification error:', error);
  }
}

/**
 * Send confirmation email to the customer
 */
async function sendCustomerConfirmationEmail(booking: BookingNotification): Promise<void> {
  try {
    const transporter = createEmailTransporter();
    
    const formatPackageName = (name: string) => name.charAt(0) + name.slice(1).toLowerCase();
    
    const mailOptions = {
      from: `SureOdds Analytics <${process.env.GMAIL_USER}>`,
      to: booking.email,
      subject: `✅ Booking Confirmed - ${formatPackageName(booking.packageName)} VIP Package`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #111827; color: #fff; padding: 0;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
            <h1 style="margin: 0; color: #fff; font-size: 28px;">SureOdds Analytics</h1>
            <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Your Winning Edge</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px; background: #1f2937;">
            <h2 style="color: #10b981; margin: 0 0 20px;">Hi ${booking.fullName}! 👋</h2>
            
            <p style="color: #d1d5db; font-size: 16px; line-height: 1.6;">
              Thank you for your interest in our <strong style="color: #10b981;">${formatPackageName(booking.packageName)} VIP Package</strong>!
            </p>
            
            <p style="color: #d1d5db; font-size: 16px; line-height: 1.6;">
              We've received your booking request and <strong style="color: #fff;">our team will contact you shortly</strong> via phone or email to complete your subscription and get you started.
            </p>
            
            <!-- Booking Summary -->
            <div style="background: #111827; border-radius: 12px; padding: 20px; margin: 25px 0; border: 1px solid #374151;">
              <h3 style="color: #fff; margin: 0 0 15px; font-size: 18px;">📋 Your Booking Summary</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; color: #9ca3af; border-bottom: 1px solid #374151;">Booking ID</td>
                  <td style="padding: 10px 0; color: #fff; text-align: right; border-bottom: 1px solid #374151;">${booking.bookingId}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #9ca3af; border-bottom: 1px solid #374151;">Package</td>
                  <td style="padding: 10px 0; color: #10b981; font-weight: bold; text-align: right; border-bottom: 1px solid #374151;">${formatPackageName(booking.packageName)} VIP Access</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #9ca3af;">Amount</td>
                  <td style="padding: 10px 0; color: #fff; font-weight: bold; text-align: right; font-size: 18px;">KES ${booking.packagePrice}</td>
                </tr>
              </table>
            </div>
            
            <!-- What's Next -->
            <div style="background: #064e3b; border-radius: 12px; padding: 20px; margin: 25px 0;">
              <h3 style="color: #10b981; margin: 0 0 15px; font-size: 18px;">⚡ What Happens Next?</h3>
              <ol style="color: #d1d5db; margin: 0; padding-left: 20px; line-height: 1.8;">
                <li>Our team will call or message you within <strong style="color: #fff;">10 minutes</strong></li>
                <li>Complete your payment via M-Pesa (instructions below)</li>
                <li>Get instant access to VIP predictions</li>
                <li>Start winning! 🎯</li>
              </ol>
            </div>
            
            <!-- M-Pesa Payment Instructions -->
            <div style="background: #111827; border-radius: 12px; padding: 20px; margin: 25px 0; border: 2px solid #10b981;">
              <h3 style="color: #10b981; margin: 0 0 15px; font-size: 18px;">💳 How to Pay via M-Pesa</h3>
              <div style="background: #1f2937; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                <p style="color: #fff; margin: 0; font-size: 14px;"><strong>Till Number:</strong> <span style="color: #10b981; font-size: 20px; font-weight: bold;">7972829</span></p>
                <p style="color: #fff; margin: 8px 0 0; font-size: 14px;"><strong>Amount:</strong> <span style="color: #10b981; font-size: 20px; font-weight: bold;">KES ${booking.packagePrice}</span></p>
              </div>
              <ol style="color: #d1d5db; margin: 0; padding-left: 20px; line-height: 2;">
                <li>Open the <strong style="color: #fff;">M-Pesa App</strong> and log in</li>
                <li>Tap on the <strong style="color: #fff;">"Transact"</strong> icon at the bottom</li>
                <li>Select <strong style="color: #fff;">"Lipa na M-PESA"</strong></li>
                <li>Tap on <strong style="color: #fff;">"Buy Goods"</strong></li>
                <li>Enter Till Number: <strong style="color: #10b981;">7972829</strong></li>
                <li>Enter Amount: <strong style="color: #10b981;">KES ${booking.packagePrice}</strong></li>
                <li>Review the details and tap <strong style="color: #fff;">"Confirm"</strong></li>
                <li>Enter your <strong style="color: #fff;">PIN</strong> or use Biometrics (Fingerprint/Face ID)</li>
              </ol>
              <p style="color: #fbbf24; font-size: 13px; margin: 15px 0 0; padding: 10px; background: rgba(251, 191, 36, 0.1); border-radius: 6px;">
                ⚠️ After payment, send a screenshot of your M-Pesa confirmation to us and we'll activate your VIP access immediately!
              </p>
            </div>
            
            <p style="color: #9ca3af; font-size: 14px; line-height: 1.6;">
              Have questions? Simply reply to this email or reach out to us. We're here to help!
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background: #111827; padding: 20px; text-align: center; border-top: 1px solid #374151;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} SureOdds Analytics. All rights reserved.
            </p>
            <p style="color: #6b7280; font-size: 12px; margin: 10px 0 0;">
              You received this email because you submitted a booking request on our platform.
            </p>
          </div>
        </div>
      `,
      text: `
Hi ${booking.fullName}!

Thank you for your interest in our ${formatPackageName(booking.packageName)} VIP Package!

We've received your booking request and our team will contact you shortly via phone or email to complete your subscription.

BOOKING SUMMARY
---------------
Booking ID: ${booking.bookingId}
Package: ${formatPackageName(booking.packageName)} VIP Access
Amount: KES ${booking.packagePrice}

WHAT HAPPENS NEXT?
------------------
1. Our team will call or message you within 10 minutes
2. Complete your payment via M-Pesa (instructions below)
3. Get instant access to VIP predictions
4. Start winning!

💳 HOW TO PAY VIA M-PESA
------------------------
Till Number: 7972829
Amount: KES ${booking.packagePrice}

Steps:
1. Open the M-Pesa App and log in
2. Tap on the "Transact" icon at the bottom
3. Select "Lipa na M-PESA"
4. Tap on "Buy Goods"
5. Enter Till Number: 7972829
6. Enter Amount: KES ${booking.packagePrice}
7. Review the details and tap "Confirm"
8. Enter your PIN or use Biometrics (Fingerprint/Face ID)

⚠️ After payment, send a screenshot of your M-Pesa confirmation to us and we'll activate your VIP access immediately!

Have questions? Simply reply to this email.

Best regards,
SureOdds Analytics Team
      `.trim(),
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Customer confirmation email sent to:', booking.email);

  } catch (error) {
    console.error('❌ Customer confirmation email error:', error);
  }
}

/**
 * Send Telegram notification
 * Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in your environment
 */
async function sendTelegramNotification(message: string): Promise<void> {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      }
    );

    if (!response.ok) {
      console.error('Failed to send Telegram notification:', await response.text());
    } else {
      console.log('✅ Telegram notification sent');
    }
  } catch (error) {
    console.error('Telegram notification error:', error);
  }
}

interface PaymentConfirmation {
  fullName: string;
  email: string;
  phone: string;
  packageName: string;
  packagePrice: number;
}

/**
 * Send payment confirmation email to customer after admin confirms payment
 */
export async function sendPaymentConfirmationEmail(data: PaymentConfirmation): Promise<void> {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.log('Email not configured, skipping payment confirmation email');
    return;
  }

  try {
    const transporter = createEmailTransporter();
    const formatPackageName = (name: string) => name.charAt(0) + name.slice(1).toLowerCase();

    const mailOptions = {
      from: `SureOdds Analytics <${process.env.GMAIL_USER}>`,
      to: data.email,
      subject: `🎉 Payment Confirmed - Your ${formatPackageName(data.packageName)} VIP Access is Active!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #111827; color: #fff; padding: 0;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
            <h1 style="margin: 0; color: #fff; font-size: 28px;">🎉 Payment Confirmed!</h1>
            <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Your VIP Access is Now Active</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px; background: #1f2937;">
            <h2 style="color: #10b981; margin: 0 0 20px;">Hi ${data.fullName}! 👋</h2>
            
            <p style="color: #d1d5db; font-size: 16px; line-height: 1.6;">
              Great news! We've received and confirmed your payment. Your <strong style="color: #10b981;">${formatPackageName(data.packageName)} VIP Package</strong> is now <strong style="color: #fff;">ACTIVE</strong>!
            </p>
            
            <!-- Subscription Details -->
            <div style="background: #111827; border-radius: 12px; padding: 20px; margin: 25px 0; border: 2px solid #10b981;">
              <h3 style="color: #10b981; margin: 0 0 15px; font-size: 18px;">✅ Your Active Subscription</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; color: #9ca3af; border-bottom: 1px solid #374151;">Package</td>
                  <td style="padding: 10px 0; color: #10b981; font-weight: bold; text-align: right; border-bottom: 1px solid #374151;">${formatPackageName(data.packageName)} VIP Access</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #9ca3af; border-bottom: 1px solid #374151;">Amount Paid</td>
                  <td style="padding: 10px 0; color: #fff; font-weight: bold; text-align: right; border-bottom: 1px solid #374151;">KES ${data.packagePrice}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #9ca3af;">Status</td>
                  <td style="padding: 10px 0; text-align: right;">
                    <span style="background: #10b981; color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: bold;">ACTIVE ✓</span>
                  </td>
                </tr>
              </table>
            </div>
            
            <!-- What's Next -->
            <div style="background: #064e3b; border-radius: 12px; padding: 20px; margin: 25px 0;">
              <h3 style="color: #10b981; margin: 0 0 15px; font-size: 18px;">📱 What's Next?</h3>
              <p style="color: #d1d5db; margin: 0; line-height: 1.8;">
                We'll send you today's VIP predictions directly via <strong style="color: #fff;">WhatsApp</strong> to your number: <strong style="color: #10b981;">${data.phone}</strong>
              </p>
              <p style="color: #d1d5db; margin: 15px 0 0; line-height: 1.8;">
                Make sure to save our number so you don't miss any tips! 🎯
              </p>
            </div>
            
            <!-- Tips -->
            <div style="background: #111827; border-radius: 12px; padding: 20px; margin: 25px 0; border: 1px solid #374151;">
              <h3 style="color: #fff; margin: 0 0 15px; font-size: 18px;">💡 Pro Tips for Success</h3>
              <ul style="color: #d1d5db; margin: 0; padding-left: 20px; line-height: 2;">
                <li>Follow our bankroll management advice</li>
                <li>Don't bet more than 5% of your bankroll on a single tip</li>
                <li>Stay disciplined and trust the process</li>
                <li>Keep track of your wins! 📈</li>
              </ul>
            </div>
            
            <p style="color: #9ca3af; font-size: 14px; line-height: 1.6;">
              Have questions? Simply reply to this email or message us on WhatsApp. We're here to help you win! 🏆
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background: #111827; padding: 20px; text-align: center; border-top: 1px solid #374151;">
            <p style="color: #10b981; font-size: 14px; margin: 0 0 10px; font-weight: bold;">
              Welcome to the winning team! 🎯
            </p>
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} SureOdds Analytics. All rights reserved.
            </p>
          </div>
        </div>
      `,
      text: `
Hi ${data.fullName}!

🎉 PAYMENT CONFIRMED - Your VIP Access is Active!

Great news! We've received and confirmed your payment.

YOUR ACTIVE SUBSCRIPTION
------------------------
Package: ${formatPackageName(data.packageName)} VIP Access
Amount Paid: KES ${data.packagePrice}
Status: ACTIVE ✓

WHAT'S NEXT?
------------
We'll send you today's VIP predictions directly via WhatsApp to: ${data.phone}

Make sure to save our number so you don't miss any tips!

PRO TIPS FOR SUCCESS
--------------------
• Follow our bankroll management advice
• Don't bet more than 5% of your bankroll on a single tip
• Stay disciplined and trust the process
• Keep track of your wins!

Have questions? Simply reply to this email or message us on WhatsApp.

Welcome to the winning team! 🏆

Best regards,
SureOdds Analytics Team
      `.trim(),
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Payment confirmation email sent to:', data.email);

  } catch (error) {
    console.error('❌ Payment confirmation email error:', error);
  }
}

interface ReminderEmailData {
  fullName: string;
  email: string;
  phone: string;
  packageName: string;
  packagePrice: number;
  expiresAt: Date;
}

/**
 * Send subscription expiry reminder email
 */
export async function sendExpiryReminderEmail(data: ReminderEmailData): Promise<void> {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.log('Email not configured, skipping expiry reminder email');
    return;
  }

  try {
    const transporter = createEmailTransporter();
    const formatPackageName = (name: string) => name.charAt(0) + name.slice(1).toLowerCase();
    
    // Calculate days until expiry (or if already expired)
    const now = new Date();
    const expiryDate = new Date(data.expiresAt);
    const hoursUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60));
    const isExpired = hoursUntilExpiry <= 0;
    
    const expiryText = isExpired 
      ? 'has expired' 
      : hoursUntilExpiry <= 24 
        ? `expires in ${hoursUntilExpiry} hours` 
        : `expires in ${Math.ceil(hoursUntilExpiry / 24)} days`;

    const mailOptions = {
      from: `SureOdds Analytics <${process.env.GMAIL_USER}>`,
      to: data.email,
      subject: isExpired 
        ? `⏰ Your ${formatPackageName(data.packageName)} VIP Access Has Expired - Renew Now!`
        : `⏰ Your ${formatPackageName(data.packageName)} VIP Access ${expiryText} - Renew to Keep Winning!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #111827; color: #fff; padding: 0;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center;">
            <h1 style="margin: 0; color: #fff; font-size: 28px;">⏰ ${isExpired ? 'Subscription Expired!' : 'Time to Renew!'}</h1>
            <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Don't miss out on winning predictions</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px; background: #1f2937;">
            <h2 style="color: #f59e0b; margin: 0 0 20px;">Hi ${data.fullName}! 👋</h2>
            
            <p style="color: #d1d5db; font-size: 16px; line-height: 1.6;">
              ${isExpired 
                ? `Your <strong style="color: #f59e0b;">${formatPackageName(data.packageName)} VIP Package</strong> has expired. You're missing out on our expert predictions!`
                : `Your <strong style="color: #f59e0b;">${formatPackageName(data.packageName)} VIP Package</strong> ${expiryText}. Renew now to continue receiving our winning tips!`
              }
            </p>
            
            <!-- Stats Reminder -->
            <div style="background: #111827; border-radius: 12px; padding: 20px; margin: 25px 0; border: 1px solid #374151;">
              <h3 style="color: #fff; margin: 0 0 15px; font-size: 18px;">🏆 Why Renew?</h3>
              <ul style="color: #d1d5db; margin: 0; padding-left: 20px; line-height: 2;">
                <li>Continue receiving <strong style="color: #10b981;">high-accuracy predictions</strong></li>
                <li>Expert analysis on every tip</li>
                <li>Stay ahead of the game</li>
                <li>24/7 customer support</li>
              </ul>
            </div>
            
            <!-- Renewal Options -->
            <div style="background: #064e3b; border-radius: 12px; padding: 20px; margin: 25px 0;">
              <h3 style="color: #10b981; margin: 0 0 15px; font-size: 18px;">💳 Renew Now via M-Pesa</h3>
              <div style="background: #1f2937; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                <p style="color: #fff; margin: 0; font-size: 14px;"><strong>Till Number:</strong> <span style="color: #10b981; font-size: 20px; font-weight: bold;">7972829</span></p>
                <p style="color: #fff; margin: 8px 0 0; font-size: 14px;"><strong>Amount:</strong> <span style="color: #10b981; font-size: 20px; font-weight: bold;">KES ${data.packagePrice}</span> (${formatPackageName(data.packageName)})</p>
              </div>
              <ol style="color: #d1d5db; margin: 0; padding-left: 20px; line-height: 2;">
                <li>Open <strong style="color: #fff;">M-Pesa App</strong></li>
                <li>Select <strong style="color: #fff;">Lipa na M-PESA</strong> → <strong style="color: #fff;">Buy Goods</strong></li>
                <li>Enter Till: <strong style="color: #10b981;">7972829</strong></li>
                <li>Enter Amount: <strong style="color: #10b981;">KES ${data.packagePrice}</strong></li>
                <li>Confirm with your PIN</li>
              </ol>
              <p style="color: #fbbf24; font-size: 13px; margin: 15px 0 0; padding: 10px; background: rgba(251, 191, 36, 0.1); border-radius: 6px;">
                📱 After payment, send your M-Pesa confirmation screenshot to us via WhatsApp and we'll reactivate your VIP access immediately!
              </p>
            </div>
            
            <!-- Special Offer -->
            <div style="background: #7c3aed; border-radius: 12px; padding: 20px; margin: 25px 0; text-align: center;">
              <h3 style="color: #fff; margin: 0 0 10px; font-size: 18px;">🎁 Upgrade & Save!</h3>
              <p style="color: #e9d5ff; margin: 0; font-size: 14px;">
                Consider upgrading to a longer package for better value and uninterrupted access!
              </p>
            </div>
            
            <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; text-align: center;">
              Questions? Reply to this email or message us on WhatsApp. We're here to help! 💬
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background: #111827; padding: 20px; text-align: center; border-top: 1px solid #374151;">
            <p style="color: #f59e0b; font-size: 14px; margin: 0 0 10px; font-weight: bold;">
              Don't let the winning stop! Renew today 🎯
            </p>
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} SureOdds Analytics. All rights reserved.
            </p>
          </div>
        </div>
      `,
      text: `
Hi ${data.fullName}!

⏰ ${isExpired ? 'SUBSCRIPTION EXPIRED' : 'TIME TO RENEW'}

${isExpired 
  ? `Your ${formatPackageName(data.packageName)} VIP Package has expired. You're missing out on our expert predictions!`
  : `Your ${formatPackageName(data.packageName)} VIP Package ${expiryText}. Renew now to continue receiving our winning tips!`
}

WHY RENEW?
----------
• Continue receiving high-accuracy predictions
• Expert analysis on every tip
• Stay ahead of the game
• 24/7 customer support

💳 RENEW NOW VIA M-PESA
-----------------------
Till Number: 7972829
Amount: KES ${data.packagePrice} (${formatPackageName(data.packageName)})

Steps:
1. Open M-Pesa App
2. Select Lipa na M-PESA → Buy Goods
3. Enter Till: 7972829
4. Enter Amount: KES ${data.packagePrice}
5. Confirm with your PIN

After payment, send your M-Pesa confirmation screenshot to us via WhatsApp and we'll reactivate your VIP access immediately!

🎁 UPGRADE & SAVE!
Consider upgrading to a longer package for better value and uninterrupted access!

Questions? Reply to this email or message us on WhatsApp.

Don't let the winning stop! Renew today 🎯

Best regards,
SureOdds Analytics Team
      `.trim(),
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Expiry reminder email sent to:', data.email);

  } catch (error) {
    console.error('❌ Expiry reminder email error:', error);
  }
}
