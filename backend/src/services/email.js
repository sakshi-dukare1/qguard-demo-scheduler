const { Resend } = require('resend');
const { createEvent } = require('ics');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Until you verify your own domain on Resend, you must send from this address
const FROM_ADDRESS = 'QGuard <onboarding@resend.dev>';

// Helper: format a Date in a specific IANA timezone as "date" and "time" strings
const formatInTimezone = (date, timezone) => {
    const dateFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
    return {
        dateStr: dateFormatter.format(date),
        timeStr: timeFormatter.format(date)
    };
};

// Helper: build an .ics calendar invite as a base64 string, for Resend attachments
const buildIcsAttachment = (booking) => {
    return new Promise((resolve, reject) => {
        const start = new Date(booking.slot_start);
        const end = new Date(booking.slot_end);

        // 'ics' wants [year, month, day, hour, minute] in UTC when using startInputType: 'utc'
        const event = {
            start: [
                start.getUTCFullYear(),
                start.getUTCMonth() + 1,
                start.getUTCDate(),
                start.getUTCHours(),
                start.getUTCMinutes()
            ],
            end: [
                end.getUTCFullYear(),
                end.getUTCMonth() + 1,
                end.getUTCDate(),
                end.getUTCHours(),
                end.getUTCMinutes()
            ],
            startInputType: 'utc',
            title: 'QGuard Demo',
            description: `QGuard product demo with ${booking.visitor_name} (${booking.company || 'N/A'})`,
            status: 'CONFIRMED',
            organizer: { name: 'TrevasQ Team', email: 'onboarding@resend.dev' },
            attendees: [
                { name: booking.visitor_name, email: booking.visitor_email, rsvp: true }
            ]
        };

        createEvent(event, (error, value) => {
            if (error) {
                return reject(error);
            }
            resolve(Buffer.from(value).toString('base64'));
        });
    });
};

// Send confirmation email
const sendConfirmationEmail = async (booking) => {
    try {
        console.log('📧 Sending confirmation email to:', booking.visitor_email);

        const timezone = booking.timezone || 'Asia/Kolkata';
        const startDate = new Date(booking.slot_start);
        const endDate = new Date(booking.slot_end);

        // ✅ Format times in the VISITOR'S chosen timezone, not the server's
        const { dateStr, timeStr } = formatInTimezone(startDate, timezone);
        const { timeStr: endTimeStr } = formatInTimezone(endDate, timezone);

        const htmlContent = `
            <h2>🎉 QGuard Demo - Booking Confirmed!</h2>
            <p>Dear ${booking.visitor_name},</p>
            <p>Your QGuard demo has been scheduled for:</p>
            <ul>
                <li><strong>Date:</strong> ${dateStr}</li>
                <li><strong>Time:</strong> ${timeStr} - ${endTimeStr}</li>
                <li><strong>Timezone:</strong> ${timezone}</li>
            </ul>
            <p>A calendar invite (.ics) is attached — add it to your calendar to get a reminder.</p>
            <p>
                <a href="${FRONTEND_URL}/reschedule?token=${booking.token}">🔄 Reschedule</a> | 
                <a href="${FRONTEND_URL}/cancel?token=${booking.token}">❌ Cancel</a>
            </p>
            <p>Thanks,<br><strong>TrevasQ Team</strong></p>
        `;

        // Build the .ics attachment — if this fails, still send the email without it
        let attachments = [];
        try {
            const icsBase64 = await buildIcsAttachment(booking);
            attachments = [{
                filename: 'qguard-demo.ics',
                content: icsBase64
            }];
        } catch (icsError) {
            console.error('⚠️ Failed to generate .ics invite:', icsError.message || icsError);
        }

        const { data, error } = await resend.emails.send({
            from: FROM_ADDRESS,
            to: booking.visitor_email,
            subject: '🎉 QGuard Demo - Booking Confirmed',
            html: htmlContent,
            attachments
        });

        if (error) {
            console.error('❌ Email error:', error.message || error);
            return false;
        }

        console.log('✅ Confirmation email sent, ID:', data.id);
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

        const timezone = booking.timezone || 'Asia/Kolkata';
        const startDate = new Date(booking.slot_start);
        const { dateStr, timeStr } = formatInTimezone(startDate, timezone);

        const htmlContent = `
            <h2>❌ QGuard Demo - Booking Cancelled</h2>
            <p>Dear ${booking.visitor_name},</p>
            <p>Your QGuard demo scheduled for:</p>
            <ul>
                <li><strong>Date:</strong> ${dateStr}</li>
                <li><strong>Time:</strong> ${timeStr}</li>
                <li><strong>Timezone:</strong> ${timezone}</li>
            </ul>
            <p>has been <strong>cancelled</strong> successfully.</p>
            <p>If you wish to book again, please visit our website.</p>
            <p>Thanks,<br><strong>TrevasQ Team</strong></p>
        `;

        const { data, error } = await resend.emails.send({
            from: FROM_ADDRESS,
            to: booking.visitor_email,
            subject: '❌ QGuard Demo - Booking Cancelled',
            html: htmlContent
        });

        if (error) {
            console.error('❌ Cancellation email error:', error.message || error);
            return false;
        }

        console.log('✅ Cancellation email sent, ID:', data.id);
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