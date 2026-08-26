const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('📧 Testing Email Configuration...');
console.log('Email User:', process.env.EMAIL_USER);
console.log('Email Pass exists:', !!process.env.EMAIL_PASS);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function testEmail() {
    try {
        const info = await transporter.sendMail({
            from: `"Test" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,  // Send to yourself
            subject: '✅ Test Email from QGuard',
            html: '<h2>Test Email</h2><p>This is a test email from your QGuard backend.</p>'
        });
        console.log('✅ Test email sent successfully!');
        console.log('📧 Message ID:', info.messageId);
    } catch (error) {
        console.error('❌ Test email failed:', error.message);
        console.error('Full error:', error);
    }
}

testEmail();