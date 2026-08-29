const { Resend } = require('resend');
require('dotenv').config();

console.log('📧 Testing Resend Configuration...');
console.log('Resend Key exists:', !!process.env.RESEND_API_KEY);

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
    try {
        const { data, error } = await resend.emails.send({
            from: 'QGuard <onboarding@resend.dev>',
            to: 'sakshidukare.cse@gmail.com', // your Resend signup email
            subject: '✅ Test Email from QGuard via Resend',
            html: '<h2>Test Email</h2><p>This is a test email sent via Resend.</p>'
        });

        if (error) {
            console.error('❌ Test email failed:', error);
            return;
        }

        console.log('✅ Test email sent successfully!');
        console.log('📧 Message ID:', data.id);
    } catch (err) {
        console.error('❌ Test email failed:', err.message);
    }
}

testEmail();