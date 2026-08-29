const supabase = require('../config/supabase');
const { generateSecureToken } = require('../utils/token');
const { sendConfirmationEmail, sendCancellationEmail } = require('../services/email');

// Get available slots
// Get available slots
const getAvailableSlots = async (req, res) => {
    try {
        const { date } = req.query;
        console.log('📅 Date received:', date);

        if (!date) {
            return res.status(400).json({ error: 'Date is required' });
        }

        const selectedDate = new Date(date);
        const dayOfWeek = selectedDate.getUTCDay();
        const dayOfWeekNumber = dayOfWeek === 0 ? 7 : dayOfWeek;

        if (dayOfWeekNumber === 6 || dayOfWeekNumber === 7) {
            return res.status(400).json({ error: 'Weekends are not available' });
        }

        const { data: allSlots, error: allError } = await supabase
            .from('available_slots')
            .select('*');

        if (allError) {
            console.error('❌ All slots error:', allError);
            return res.status(500).json({ error: allError.message });
        }

        const filteredSlots = allSlots ? allSlots.filter(s =>
            s.day_of_week === dayOfWeekNumber && s.is_active === true
        ) : [];

        if (!filteredSlots || filteredSlots.length === 0) {
            return res.status(404).json({ error: 'No available slots for this day' });
        }

        // ✅ NEW: fetch confirmed bookings for this date
        const dayStart = new Date(`${date}T00:00:00.000Z`).toISOString();
        const dayEnd = new Date(`${date}T23:59:59.999Z`).toISOString();

        const { data: bookedRows, error: bookedError } = await supabase
            .from('bookings')
            .select('slot_start')
            .eq('status', 'CONFIRMED')
            .gte('slot_start', dayStart)
            .lte('slot_start', dayEnd);

        if (bookedError) {
            console.error('❌ Bookings fetch error:', bookedError);
            return res.status(500).json({ error: bookedError.message });
        }

        console.log('📋 Booked slots found:', bookedRows.length);

        // ✅ Compare by primitive value (ms timestamp), not object identity
        const bookedTimes = new Set(
            bookedRows.map(b => new Date(b.slot_start).getTime())
        );
const allSlotsFormatted = filteredSlots.map(slot => {
    const slotDate = new Date(date);
    const [hours, minutes] = slot.start_time.split(':');
    slotDate.setUTCHours(parseInt(hours), parseInt(minutes), 0, 0);

    const endDate = new Date(date);
    const [endHours, endMinutes] = slot.end_time.split(':');
    endDate.setUTCHours(parseInt(endHours), parseInt(endMinutes), 0, 0);

    const isBooked = bookedTimes.has(slotDate.getTime());

    return {
        start: slotDate.toISOString(),
        end: endDate.toISOString(),
        isBooked,
        isPast: slotDate.getTime() <= Date.now()   // ✅ new
    };
});

// ✅ Only return future, unbooked-or-not slots — but exclude past ones entirely
const availableSlots = allSlotsFormatted.filter(s => !s.isPast);

const availableCount = availableSlots.filter(s => !s.isBooked).length;

res.json({
    date: date,
    slots: availableSlots,
    count: availableCount
});

    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

// Create booking
const createBooking = async (req, res) => {
    try {
        const {
            visitor_name, visitor_email, company, job_title,
            phone, slot_start, slot_end, timezone
        } = req.body;

        // Validate required fields
        if (!visitor_name || !visitor_name.trim()) {
            return res.status(400).json({ error: 'Name is required' });
        }

        if (!visitor_email || !visitor_email.trim()) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|org|net|io|co|in|uk|us|ca|au|de|fr|jp|cn|br|ru|za|it|es|nl|se|no|ch|at|be|dk|fi|ie|pl|pt|gr|nz|my|sg|ph|pk|bd|lk|np|eu|edu|gov|mil|biz|info|name|tv|me|cc|app|dev|tech|online|store|shop|cloud|ai|xyz|site|pro|club|one|world|life|work|email|care|travel|money|plus|gold|rocks|best|top|vip|cool|fun|love|live|news|media|video|pics|photo|team|group)$/i;
        
        if (!emailRegex.test(visitor_email.trim())) {
            console.log('❌ Invalid email rejected:', visitor_email);
            return res.status(400).json({
                error: 'Please enter a valid email address (e.g., name@domain.com)'
            });
        }
        console.log('✅ Email validated:', visitor_email);

        if (!company || !company.trim()) {
            return res.status(400).json({ error: 'Company is required' });
        }

        if (!job_title || !job_title.trim()) {
            return res.status(400).json({ error: 'Job title is required' });
        }

        if (!slot_start || !slot_end || !timezone) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate 30-minute slot
        const start = new Date(slot_start);
        const end = new Date(slot_end);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ error: 'Invalid slot date/time' });
        }
        if (start.getTime() <= Date.now()) {
    return res.status(400).json({ error: 'Cannot book a slot in the past' });
}

        if (end <= start) {
            return res.status(400).json({ error: 'Slot end time must be after start time' });
        }

        const durationMinutes = (end - start) / (1000 * 60);
        if (durationMinutes !== 30) {
            return res.status(400).json({ error: 'Demo slot must be exactly 30 minutes' });
        }

        // Check if slot is available
        const { data: existing, error: checkError } = await supabase
            .from('bookings')
            .select('id')
            .eq('slot_start', slot_start)
            .eq('status', 'CONFIRMED')
            .maybeSingle();

        if (checkError) {
            throw checkError;
        }

        if (existing) {
            return res.status(400).json({ error: 'This slot is already booked' });
        }

        // Generate secure token
        const token = generateSecureToken();

        // Create booking
                // Create booking
        const { data: booking, error: insertError } = await supabase
            .from('bookings')
            .insert([{
                visitor_name,
                visitor_email,
                company: company || null,
                job_title: job_title || null,
                phone: phone || null,
                slot_start,
                slot_end,
                timezone,
                status: 'CONFIRMED',
                token
            }])
            .select()
            .single();

        if (insertError) {
            // ✅ Postgres unique constraint violation (double-booking caught at DB level)
            if (insertError.code === '23505') {
                console.log('⚠️ Double-booking blocked by DB constraint:', slot_start);
                return res.status(409).json({ error: 'This slot is already booked' });
            }
            throw insertError;
        }

        
                // Send response immediately — don't make the user wait on email
        res.status(201).json({
            message: 'Booking confirmed!',
            booking,
            rescheduleLink: `/reschedule?token=${token}`,
            cancelLink: `/cancel?token=${token}`
        });

        // Send email in the background — failure here won't affect the booking
        sendConfirmationEmail(booking).catch(err => {
            console.error('Email error (booking still succeeded):', err.message);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get booking by token
const getBookingByToken = async (req, res) => {
    try {
        const { token } = req.params;

        const { data: booking, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('token', token)
            .single();

        if (error || !booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        res.json({ booking });

    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

// Reschedule booking
// Reschedule booking
const rescheduleBooking = async (req, res) => {
    try {
        const { token } = req.params;
        const { slot_start, slot_end } = req.body;

        if (!slot_start || !slot_end) {
            return res.status(400).json({ error: 'New slot time required' });
        }

        const { data: booking, error: getError } = await supabase
            .from('bookings')
            .select('*')
            .eq('token', token)
            .single();

        if (getError || !booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        if (booking.status === 'CANCELLED') {
            return res.status(400).json({ error: 'Cannot reschedule cancelled booking' });
        }

        // Prevent rescheduling into the past
        const newStart = new Date(slot_start);
        if (isNaN(newStart.getTime()) || newStart.getTime() <= Date.now()) {
            return res.status(400).json({ error: 'Cannot reschedule to a past slot' });
        }

        // Fast-path check (app-level) — DB constraint below is the real guarantee
        const { data: existing, error: checkError } = await supabase
            .from('bookings')
            .select('id')
            .eq('slot_start', slot_start)
            .neq('id', booking.id)
            .eq('status', 'CONFIRMED')
            .maybeSingle();

        if (checkError) {
            return res.status(500).json({ error: checkError.message });
        }

        if (existing) {
            return res.status(400).json({ error: 'New slot is already booked' });
        }

        const { data: updated, error: updateError } = await supabase
            .from('bookings')
            .update({
                slot_start,
                slot_end,
                updated_at: new Date().toISOString()
            })
            .eq('id', booking.id)
            .select()
            .single();

        if (updateError) {
            // ✅ Postgres unique constraint violation (double-booking caught at DB level)
            if (updateError.code === '23505') {
                console.log('⚠️ Double-booking blocked by DB constraint on reschedule:', slot_start);
                return res.status(409).json({ error: 'New slot is already booked' });
            }
            return res.status(500).json({ error: updateError.message });
        }

        sendConfirmationEmail(updated).catch(err => {
            console.error('Email error:', err.message);
        });

        res.json({
            message: 'Booking rescheduled successfully',
            booking: updated
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

// Cancel booking
const cancelBooking = async (req, res) => {
    try {
        const { token } = req.params;

        const { data: booking, error: getError } = await supabase
            .from('bookings')
            .select('*')
            .eq('token', token)
            .single();

        if (getError || !booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        if (booking.status === 'CANCELLED') {
            return res.status(400).json({ error: 'Booking already cancelled' });
        }

        const { data: updated, error: updateError } = await supabase
            .from('bookings')
            .update({
                status: 'CANCELLED',
                updated_at: new Date().toISOString()
            })
            .eq('id', booking.id)
            .select()
            .single();

        if (updateError) {
            throw updateError;
        }

        // Send cancellation email
        try {
            await sendCancellationEmail(updated);
        } catch (emailError) {
            console.error('⚠️ Cancellation email failed:', emailError.message);
        }

        res.json({
            message: 'Booking cancelled successfully',
            booking: updated
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    getAvailableSlots,
    createBooking,
    getBookingByToken,
    rescheduleBooking,
    cancelBooking
};