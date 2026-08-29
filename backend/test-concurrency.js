const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const SLOT_START = '2026-09-03T09:00:00.000Z';
const SLOT_END = '2026-09-03T09:30:00.000Z';

const bookingPayload = (name, email) => ({
    visitor_name: name,
    visitor_email: email,
    company: 'TestCo',
    job_title: 'QA Tester',
    slot_start: SLOT_START,
    slot_end: SLOT_END,
    timezone: 'Asia/Kolkata'
});

const run = async () => {
    console.log('🚀 Firing two simultaneous booking requests for the same slot...');

    const results = await Promise.allSettled([
        axios.post(`${BASE_URL}/bookings`, bookingPayload('Test A', 'a@test.com')),
        axios.post(`${BASE_URL}/bookings`, bookingPayload('Test B', 'b@test.com'))
    ]);

    const statuses = results.map(r =>
        r.status === 'fulfilled' ? r.value.status : r.reason.response?.status
    );

    console.log('Result statuses:', statuses);

    const successCount = statuses.filter(s => s === 201).length;

    if (successCount === 1) {
        console.log('✅ PASS — exactly one booking succeeded, the other was correctly rejected.');
    } else if (successCount === 0) {
        console.log('⚠️ Both failed — check if the slot was already booked from a previous test run.');
    } else {
        console.log(`❌ FAIL — ${successCount} bookings succeeded. Double-booking prevention is NOT working.`);
    }
};

run();