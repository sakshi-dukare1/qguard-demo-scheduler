const nodemailer = require('nodemailer');
require('dotenv').config();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    family: 4, // force IPv4 - fixes ENETUNREACH on Render
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Send confirmation email
const sendConfirmationEmail = async (booking) => {
    try {
        console.log('📧 Sending confirmation email to:', booking.visitor_email);

        const startDate = new Date(booking.slot_start);
        const endDate = new Date(booking.slot_end);
        const dateStr = startDate.toDateString();
        const timeStr = startDate.toTimeString().slice(0, 5);
        const endTimeStr = endDate.toTimeString().slice(0, 5);

        const htmlContent = `
            <h2>🎉 QGuard Demo - Booking Confirmed!</h2>
            <p>Dear ${booking.visitor_name},</p>
            <p>Your QGuard demo has been scheduled for:</p>
            <ul>
                <li><strong>Date:</strong> ${dateStr}</li>
                <li><strong>Time:</strong> ${timeStr} - ${endTimeStr}</li>
                <li><strong>Timezone:</strong> ${booking.timezone || 'Asia/Kolkata'}</li>
            </ul>
            <p>
                <a href="${FRONTEND_URL}/reschedule?token=${booking.token}">🔄 Reschedule</a> | 
                <a href="${FRONTEND_URL}/cancel?token=${booking.token}">❌ Cancel</a>
            </p>
            <p>Thanks,<br><strong>TrevasQ Team</strong></p>
        `;

        const mailOptions = {
            from: `"TrevasQ" <${process.env.EMAIL_USER}>`,
            to: booking.visitor_email,
            subject: '🎉 QGuard Demo - Booking Confirmed',
            html: htmlContent
        };

        await transporter.sendMail(mailOptions);
        console.log('✅ Confirmation email sent to:', booking.visitor_email);
        return true;

    } catch (error) {
        console.error('❌ Email error:', error.message);
        return false;
    }
};

// Send cancellation email
const sendCancellationEmail = async (booking) => {
    try {
        console.log('📧 Sending cancellation email to:', booking.visitor_email);

        const startDate = new Date(booking.slot_start);
        const dateStr = startDate.toDateString();
        const timeStr = startDate.toTimeString().slice(0, 5);

        const htmlContent = `
            <h2>❌ QGuard Demo - Booking Cancelled</h2>
            <p>Dear ${booking.visitor_name},</p>
            <p>Your QGuard demo scheduled for:</p>
            <ul>
                <li><strong>Date:</strong> ${dateStr}</li>
                <li><strong>Time:</strong> ${timeStr}</li>
                <li><strong>Timezone:</strong> ${booking.timezone || 'Asia/Kolkata'}</li>
            </ul>
            <p>has been <strong>cancelled</strong> successfully.</p>
            <p>If you wish to book again, please visit our website.</p>
            <p>Thanks,<br><strong>TrevasQ Team</strong></p>
        `;

        const mailOptions = {
            from: `"TrevasQ" <${process.env.EMAIL_USER}>`,
            to: booking.visitor_email,
            subject: '❌ QGuard Demo - Booking Cancelled',
            html: htmlContent
        };

        await transporter.sendMail(mailOptions);
        console.log('✅ Cancellation email sent to:', booking.visitor_email);
        return true;

    } catch (error) {
        console.error('❌ Cancellation email error:', error.message);
        return false;
    }
};

module.exports = { 
    sendConfirmationEmail,
    sendCancellationEmail
};