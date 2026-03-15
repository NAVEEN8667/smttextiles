const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const sendOTP = async (email, otp) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('EMAIL_USER or EMAIL_PASS is not configured');
    return {
      ok: false,
      error: 'Missing EMAIL_USER or EMAIL_PASS environment variable',
    };
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your Verification Code - Textile E-commerce',
    text: `Your OTP for verification is: ${otp}. It is valid for 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Welcome to Textile E-commerce!</h2>
        <p>Your OTP for verification is:</p>
        <h1 style="color: #4F46E5; letter-spacing: 5px;">${otp}</h1>
        <p>This code is valid for 10 minutes.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent successfully to ${email}`);
    return { ok: true };
  } catch (error) {
    console.error('Error sending OTP email:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
    });
    return {
      ok: false,
      error: error.message || 'Failed to send OTP email',
    };
  }
};

const sendInvoiceEmail = async (email, pdfBuffer, orderId) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Your Invoice for Order #${orderId} - Textile E-commerce`,
    text: `Thank you for your order! Please find attached the invoice for your order #${orderId}.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Order Confirmation</h2>
        <p>Thank you for shopping with Textile E-commerce!</p>
        <p>Your order <strong>#${orderId}</strong> has been placed successfully.</p>
        <p>Please find attached the detailed PDF invoice for your reference.</p>
        <br/>
        <p>Best regards,<br/>Textile E-commerce Team</p>
      </div>
    `,
    attachments: [
      {
        filename: `Invoice_${orderId}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Invoice email sent to ${email} for order ${orderId}`);
    return true;
  } catch (error) {
    console.error('Error sending invoice email:', error);
    return false;
  }
};

const sendOrderStatusEmail = async (email, order) => {
  const statusDisplay = order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ');

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Order Update: #${order.id} - ${statusDisplay}`,
    text: `The status of your order #${order.id} is now: ${statusDisplay}.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Order Update</h2>
        <p>Hello,</p>
        <p>We are writing to inform you that the status of your order <strong>#${order.id}</strong> has been updated.</p>
        <p>Current Status: <strong style="color: #4F46E5;">${statusDisplay}</strong></p>
        <br/>
        <p>If you have any questions, please contact our support team.</p>
        <p>Best regards,<br/>Textile E-commerce Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Order status email sent to ${email} for order ${order.id} (Status: ${order.status})`);
    return true;
  } catch (error) {
    console.error('Error sending order status email:', error);
    return false;
  }
};

module.exports = { sendOTP, sendInvoiceEmail, sendOrderStatusEmail };
