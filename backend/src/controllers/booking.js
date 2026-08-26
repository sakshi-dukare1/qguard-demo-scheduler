const supabase = require('../config/supabase');
const { generateSecureToken } = require('../utils/token');
const { sendConfirmationEmail, sendCancellationEmail } = require('../services/email');

// Get available slots
const getAvailableSlots = async (req, res) => {
    try {
        const { date } = req.query;

        console.log('Date received:', date);

        if (!date) {
            return res.status(400).json({ error: 'Date is required' });
        }

        const selectedDate = new Date(date);
        const dayOfWeek = selectedDate.getDay();
        console.log('Day of week:', dayOfWeek);

        if (dayOfWeek === 0 || dayOfWeek === 6) {
            return res.status(400).json({ error: 'Weekends are not available' });
        }

        // Get all slots for this day
        const { data: slots, error: slotsError } = await supabase
            .from('available_slots')
            .select('id, day_of_week, start_time, end_time, is_active')
            .eq('day_of_week', dayOfWeek)
            .eq('is_active', true);

        console.log('Slots found:', slots ? slots.length : 0);

        if (slotsError) {
            console.error('Slots error:', slotsError);
            return res.status(500).json({ error: slotsError.message });
        }

        if (!slots || slots.length === 0) {
            return res.status(404).json({ error: 'No available slots for this day' });
        }

        //  FIXED: Get booked slots for this date using DATE comparison
        const { data: booked, error: bookedError } = await supabase
            .from('bookings')
            .select('slot_start')
            .eq('status', 'CONFIRMED')
            .gte('slot_start', `${date}T00:00:00`)
            .lt('slot_start', `${date}T23:59:59`);

        if (bookedError) {
            console.error('Booked error:', bookedError);
            return res.status(500).json({ error: bookedError.message });
        }

        console.log('Booked slots found:', booked ? booked.length : 0);

        // Create set of booked slots (store as ISO string without timezone)
        const bookedSlots = new Set();
        if (booked) {
            booked.forEach(b => {
                // Normalize to same format as slot times
                const bookedTime = new Date(b.slot_start);
                bookedSlots.add(bookedTime.toISOString().split('.')[0] + 'Z');
            });
        }

        // Format all slots
        const allSlots = slots.map(slot => {
            const slotDate = new Date(date);
            const [hours, minutes] = slot.start_time.split(':');
            slotDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            const endDate = new Date(date);
            const [endHours, endMinutes] = slot.end_time.split(':');
            endDate.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);

            const slotKey = slotDate.toISOString().split('.')[0] + 'Z';
            const isBooked = bookedSlots.has(slotKey);

            console.log('Slot:', slotKey, 'Booked?', isBooked);

            return {
                start: slotDate.toISOString(),
                end: endDate.toISOString(),
                isBooked: isBooked
            };
        });

        const availableCount = allSlots.filter(s => !s.isBooked).length;
        console.log('Available slots:', availableCount);
        console.log('Booked slots count:', allSlots.filter(s => s.isBooked).length);

        res.json({
            date: date,
            slots: allSlots,
            count: availableCount
        });

    } catch (error) {
        console.error('Error:', error.message);
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

        // STRICT EMAIL VALIDATION - Rejects .con, .c, .x, etc.
        if (!visitor_email || !visitor_email.trim()) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // This regex ONLY allows REAL common domains
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
            throw insertError;
        }

        // Send email
        await sendConfirmationEmail(booking);

        res.status(201).json({
            message: 'Booking confirmed!',
            booking,
            rescheduleLink: `/reschedule?token=${token}`,
            cancelLink: `/cancel?token=${token}`
        });

    } catch (error) {
        console.error('Error:', error.message);
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
        console.error('Error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

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

        if (getError) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        if (booking.status === 'CANCELLED') {
            return res.status(400).json({ error: 'Cannot reschedule cancelled booking' });
        }

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
        console.error('Error:', error.message);
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
        console.error('Error:', error.message);
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