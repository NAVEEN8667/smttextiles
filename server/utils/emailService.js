require('dotenv').config();

const hasBrevoConfig = Boolean(process.env.BREVO_API_KEY);

async function sendViaBrevo({ to, subject, text, html, attachments }) {
  const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const senderName = process.env.BREVO_SENDER_NAME || 'SM Textiles';

  if (!fromEmail) {
    return {
      ok: false,
      error: 'Missing EMAIL_FROM or EMAIL_USER for sender address',
    };
  }

  const brevoPayload = {
    sender: {
      name: senderName,
      email: fromEmail,
    },
    to: [{ email: to }],
    subject,
    textContent: text,
    htmlContent: html,
  };

  if (attachments && attachments.length > 0) {
    brevoPayload.attachment = attachments.map((item) => ({
      name: item.filename,
      content: Buffer.isBuffer(item.content) ? item.content.toString('base64') : item.content,
    }));
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(brevoPayload),
    });

    if (!response.ok) {
      const body = await response.text();
      return {
        ok: false,
        error: `Brevo API error (${response.status}): ${body}`,
      };
    }

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err.message || 'Brevo API request failed',
    };
  }
}

async function sendEmail(mailOptions) {
  return sendViaBrevo({
    to: mailOptions.to,
    subject: mailOptions.subject,
    text: mailOptions.text,
    html: mailOptions.html,
    attachments: mailOptions.attachments,
  });
}

const sendOTP = async (email, otp) => {
  if (!hasBrevoConfig) {
    console.error('BREVO_API_KEY is not configured');
    return {
      ok: false,
      error: 'Missing BREVO_API_KEY environment variable',
    };
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
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
    const result = await sendEmail(mailOptions);
    if (!result.ok) {
      console.error(`Error sending OTP email to ${email}: ${result.error}`);
      return result;
    }
    console.log(`OTP email sent successfully to ${email} via brevo`);
    return { ok: true };
  } catch (error) {
    console.error('Unexpected error sending OTP email:', error.message);
    return {
      ok: false,
      error: error.message || 'Failed to send OTP email',
    };
  }
};

const sendInvoiceEmail = async (email, pdfBuffer, orderId) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
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
    const result = await sendEmail(mailOptions);
    if (!result.ok) {
      console.error(`Invoice email failed for ${email}: ${result.error}`);
      return false;
    }
    console.log(`Invoice email sent to ${email} for order ${orderId} via brevo`);
    return true;
  } catch (error) {
    console.error('Error sending invoice email:', error);
    return false;
  }
};

const sendOrderStatusEmail = async (email, order) => {
  const statusDisplay = order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ');

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
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
    const result = await sendEmail(mailOptions);
    if (!result.ok) {
      console.error(`Order status email failed for ${email}: ${result.error}`);
      return false;
    }
    console.log(`Order status email sent to ${email} for order ${order.id} (Status: ${order.status}) via brevo`);
    return true;
  } catch (error) {
    console.error('Error sending order status email:', error);
    return false;
  }
};

module.exports = { sendOTP, sendInvoiceEmail, sendOrderStatusEmail };
