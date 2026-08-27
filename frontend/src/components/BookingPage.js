import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import moment from 'moment-timezone';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getAvailableSlots, createBooking } from '../services/api';
import './BookingPage.css';

const BookingPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        visitor_name: '',
        visitor_email: '',
        company: '',
        job_title: '',
        phone: ''
    });
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [slots, setSlots] = useState([]);
    const [userTimezone, setUserTimezone] = useState('Asia/Kolkata');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [bookingData, setBookingData] = useState(null);

    const timezones = moment.tz.names();

    useEffect(() => {
        const timezone = moment.tz.guess() || 'Asia/Kolkata';
        setUserTimezone(timezone);
        fetchSlots(selectedDate, timezone);
    }, [selectedDate]);

   const fetchSlots = async (date, timezone) => {
    try {
        setLoading(true);
        const formattedDate = moment(date).format('YYYY-MM-DD');
        const response = await getAvailableSlots(formattedDate);        
        const localSlots = response.slots.map(slot => {
            const startLocal = moment.utc(slot.start).tz(timezone);
            const endLocal = moment.utc(slot.end).tz(timezone);
            return {
                ...slot,
                startLocal: startLocal.format(),
                endLocal: endLocal.format(),
                displayTime: startLocal.format('hh:mm A'),
                displayEnd: endLocal.format('hh:mm A')
            };
        });
        
        setSlots(localSlots);
        setError('');
        setFieldErrors({});
    } catch (err) {
        setError('Failed to load available slots. Please try again.');
        console.error(err);
    } finally {
        setLoading(false);
    }
};
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (fieldErrors[name]) {
            setFieldErrors({ ...fieldErrors, [name]: '' });
        }
        setError('');
    };

    const handleTimezoneChange = (e) => {
        setUserTimezone(e.target.value);
        fetchSlots(selectedDate, e.target.value);
    };

    const handleSlotSelect = (slot) => {
        setSelectedSlot(slot);
        if (fieldErrors.slot) {
            setFieldErrors({ ...fieldErrors, slot: '' });
        }
        setError('');
    };

    // ✅ VALIDATE FORM - Email validation happens HERE
    const validateForm = () => {
        const errors = {};
        let isValid = true;

        // Name validation
        if (!formData.visitor_name.trim()) {
            errors.visitor_name = 'Full Name is required';
            isValid = false;
        } else if (formData.visitor_name.trim().length < 2) {
            errors.visitor_name = 'Name must be at least 2 characters';
            isValid = false;
        } else if (formData.visitor_name.trim().length > 100) {
            errors.visitor_name = 'Name must be less than 100 characters';
            isValid = false;
        }

        // ✅ EMAIL VALIDATION - Simple format check only (backend does deep validation)
        if (!formData.visitor_email.trim()) {
            errors.visitor_email = 'Email is required';
            isValid = false;
        } else {
            // Simple format: has @, has dot, has characters after dot
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.visitor_email.trim())) {
                errors.visitor_email = 'Please enter a valid email address';
                isValid = false;
            }
        }

        // Company validation
        if (!formData.company.trim()) {
            errors.company = 'Company name is required';
            isValid = false;
        } else if (formData.company.trim().length < 2) {
            errors.company = 'Company name must be at least 2 characters';
            isValid = false;
        }

        // Job title validation
        if (!formData.job_title.trim()) {
            errors.job_title = 'Job title is required';
            isValid = false;
        } else if (formData.job_title.trim().length < 2) {
            errors.job_title = 'Job title must be at least 2 characters';
            isValid = false;
        }

        // Phone validation (optional)
        if (formData.phone.trim() && !/^\+?[1-9]\d{7,14}$/.test(formData.phone.trim())) {
            errors.phone = 'Please enter a valid phone number';
            isValid = false;
        }

        // Slot validation
        if (!selectedSlot) {
            errors.slot = 'Please select a time slot';
            isValid = false;
        }

        setFieldErrors(errors);
        
        if (!isValid) {
            const firstErrorField = document.querySelector('.field-error');
            if (firstErrorField) {
                firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
        
        return isValid;
    };

    // ✅ Called when "Review & Confirm" is clicked
    const handleReviewAndConfirm = (e) => {
        e.preventDefault();
        setError('');
        
        const isValid = validateForm();
        
        if (!isValid) {
            return;
        }

        setBookingData({
            ...formData,
            slot_start: selectedSlot.start,
            slot_end: selectedSlot.end,
            timezone: userTimezone
        });
        setShowConfirmModal(true);
    };

    // ✅ Called when "Confirm Booking" is clicked in modal
    const confirmBooking = async () => {
        try {
            setLoading(true);
            setShowConfirmModal(false);
            setError('');
            
            const response = await createBooking(bookingData);
            navigate('/confirmation', { state: { booking: response.booking } });
        } catch (err) {
            console.error('Booking error:', err);
            
            if (err.response && err.response.data) {
                const data = err.response.data;
                
                if (data.errors && Array.isArray(data.errors)) {
                    const messages = data.errors.map(e => e.message).join('. ');
                    setError(messages);
                    return;
                }
                
                if (data.error) {
                    setError(data.error);
                    return;
                }
                
                if (data.message) {
                    setError(data.message);
                    return;
                }
            }
            
            setError('Failed to create booking. Please try again.');
        } finally {
            setLoading(false);
            setBookingData(null);
        }
    };

    const cancelBooking = () => {
        setShowConfirmModal(false);
        setBookingData(null);
    };

    return (
        <div className="booking-container">
            <div className="booking-card">
                <h2>📅 Schedule QGuard Demo</h2>
                
                <form onSubmit={handleReviewAndConfirm} noValidate>
                    <div className="form-section">
                        <h3>Your Details</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <input
                                    type="text"
                                    name="visitor_name"
                                    placeholder="Full Name *"
                                    value={formData.visitor_name}
                                    onChange={handleInputChange}
                                    className={fieldErrors.visitor_name ? 'error-input' : ''}
                                />
                                {fieldErrors.visitor_name && (
                                    <span className="field-error">{fieldErrors.visitor_name}</span>
                                )}
                            </div>
                            
                            <div className="form-group">
                                <input
                                    type="email"
                                    name="visitor_email"
                                    placeholder="Work Email *"
                                    value={formData.visitor_email}
                                    onChange={handleInputChange}
                                    className={fieldErrors.visitor_email ? 'error-input' : ''}
                                />
                                {fieldErrors.visitor_email && (
                                    <span className="field-error">{fieldErrors.visitor_email}</span>
                                )}
                            </div>
                            
                            <div className="form-group">
                                <input
                                    type="text"
                                    name="company"
                                    placeholder="Company *"
                                    value={formData.company}
                                    onChange={handleInputChange}
                                    className={fieldErrors.company ? 'error-input' : ''}
                                />
                                {fieldErrors.company && (
                                    <span className="field-error">{fieldErrors.company}</span>
                                )}
                            </div>
                            
                            <div className="form-group">
                                <input
                                    type="text"
                                    name="job_title"
                                    placeholder="Job Title *"
                                    value={formData.job_title}
                                    onChange={handleInputChange}
                                    className={fieldErrors.job_title ? 'error-input' : ''}
                                />
                                {fieldErrors.job_title && (
                                    <span className="field-error">{fieldErrors.job_title}</span>
                                )}
                            </div>
                            
                            <div className="form-group full-width">
                                <input
                                    type="tel"
                                    name="phone"
                                    placeholder="Phone Number"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className={fieldErrors.phone ? 'error-input' : ''}
                                />
                                {fieldErrors.phone && (
                                    <span className="field-error">{fieldErrors.phone}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>Select Date & Time</h3>
                        <div className="datetime-section">
                            <div className="date-picker-wrapper">
                                <label>Date:</label>
                                <DatePicker
                                    selected={selectedDate}
                                    onChange={setSelectedDate}
                                    minDate={new Date()}
                                    dateFormat="MMMM d, yyyy"
                                    className="date-input"
                                />
                            </div>
                            <div className="timezone-select">
                                <label>Timezone:</label>
                                <select 
                                    value={userTimezone}
                                    onChange={handleTimezoneChange}
                                    className="timezone-select-input"
                                >
                                    {timezones.map(tz => (
                                        <option key={tz} value={tz}>{tz}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {fieldErrors.slot && (
                            <div className="field-error" style={{marginBottom: 10}}>{fieldErrors.slot}</div>
                        )}

                        <div className="slots-grid">
                            {loading ? (
                                <div className="loading">Loading available slots...</div>
                            ) : slots.length === 0 ? (
                                <div className="no-slots">No available slots for this day</div>
                            ) : (
                                slots.map((slot, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        className={`slot-btn ${slot.isBooked ? 'booked' : ''} ${selectedSlot === slot ? 'selected' : ''}`}
                                        onClick={() => handleSlotSelect(slot)}
                                        disabled={slot.isBooked}
                                    >
                                        {slot.displayTime} - {slot.displayEnd}
                                        {slot.isBooked && ' ❌'}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button 
                        type="submit" 
                        className="submit-btn"
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : 'Review & Confirm'}
                    </button>
                </form>

                {showConfirmModal && bookingData && (
                    <div className="modal-overlay" onClick={cancelBooking}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <h3>📋 Confirm Your Booking</h3>
                            <div className="modal-details">
                                <p><strong>Name:</strong> {bookingData.visitor_name}</p>
                                <p><strong>Email:</strong> {bookingData.visitor_email}</p>
                                <p><strong>Company:</strong> {bookingData.company}</p>
                                <p><strong>Job Title:</strong> {bookingData.job_title}</p>
                                {bookingData.phone && <p><strong>Phone:</strong> {bookingData.phone}</p>}
                                <p><strong>Date:</strong> {moment(bookingData.slot_start).tz(bookingData.timezone).format('MMMM D, YYYY')}</p>
                                <p><strong>Time:</strong> {moment(bookingData.slot_start).tz(bookingData.timezone).format('hh:mm A')} - {moment(bookingData.slot_end).tz(bookingData.timezone).format('hh:mm A')}</p>
                                <p><strong>Timezone:</strong> {bookingData.timezone}</p>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="modal-cancel-btn" onClick={cancelBooking}>
                                    Cancel
                                </button>
                                <button type="button" className="modal-confirm-btn" onClick={confirmBooking}>
                                    ✅ Confirm Booking
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingPage;