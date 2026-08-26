const supabase = require('../config/supabase');
const { generateSecureToken } = require('../utils/token');
const { sendConfirmationEmail, sendCancellationEmail } = require('../services/email');

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
        console.log('📅 Day of week (UTC):', dayOfWeek);

        if (dayOfWeek === 0 || dayOfWeek === 6) {
            return res.status(400).json({ error: 'Weekends are not available' });
        }

        // Get all slots for this day
        const { data: slots, error: slotsError } = await supabase
            .from('available_slots')
            .select('id, day_of_week, start_time, end_time, is_active')
            .eq('day_of_week', dayOfWeek)
            .eq('is_active', true);

        if (slotsError) {
            console.error('❌ Slots error:', slotsError);
            return res.status(500).json({ error: slotsError.message });
        }

        if (!slots || slots.length === 0) {
            return res.status(404).json({ error: 'No available slots for this day' });
        }

        // Get booked slots for this date (using TIMESTAMPTZ)
        const startOfDay = new Date(date);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setUTCHours(23, 59, 59, 999);

        const { data: booked, error: bookedError } = await supabase
            .from('bookings')
            .select('slot_start')
            .eq('status', 'CONFIRMED')
            .gte('slot_start', startOfDay.toISOString())
            .lt('slot_start', endOfDay.toISOString());

        if (bookedError) {
            console.error('❌ Booked error:', bookedError);
            return res.status(500).json({ error: bookedError.message });
        }

        console.log('📋 Booked slots found:', booked ? booked.length : 0);

        // Create set of booked slot times
        const bookedSlots = new Set();
        if (booked) {
            booked.forEach(b => {
                const bookedTime = new Date(b.slot_start);
                const key = bookedTime.toISOString();
                bookedSlots.add(key);
                console.log('🔴 Booked slot:', key);
            });
        }

        // Format all slots
        const allSlots = slots.map(slot => {
            const slotDate = new Date(date);
            const [hours, minutes] = slot.start_time.split(':');
            slotDate.setUTCHours(parseInt(hours), parseInt(minutes), 0, 0);

            const endDate = new Date(date);
            const [endHours, endMinutes] = slot.end_time.split(':');
            endDate.setUTCHours(parseInt(endHours), parseInt(endMinutes), 0, 0);

            const slotKey = slotDate.toISOString();
            const isBooked = bookedSlots.has(slotKey);

            console.log('🟢 Slot:', slotKey, 'Booked?', isBooked);

            return {
                start: slotDate.toISOString(),
                end: endDate.toISOString(),
                isBooked: isBooked
            };
        });

        const availableCount = allSlots.filter(s => !s.isBooked).length;
        console.log('✅ Available slots:', availableCount);

        res.json({
            date: date,
            slots: allSlots,
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

        // ... validation ...

        // ✅ Convert to UTC before saving
        const utcStart = new Date(slot_start);
        const utcEnd = new Date(slot_end);
        
        // ... validation ...

        const { data: booking, error: insertError } = await supabase
            .from('bookings')
            .insert([{
                visitor_name,
                visitor_email,
                company: company || null,
                job_title: job_title || null,
                phone: phone || null,
                slot_start: utcStart.toISOString(),  // ✅ Store as UTC
                slot_end: utcEnd.toISOString(),      // ✅ Store as UTC
                timezone,
                status: 'CONFIRMED',
                token
            }])
            .select()
            .single();
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