import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import moment from 'moment-timezone';
import './ConfirmationPage.css';

const ConfirmationPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const booking = location.state?.booking;

    if (!booking) {
        return <div className="error">No booking found</div>;
    }

    const startLocal = moment(booking.slot_start).tz(booking.timezone);
    const endLocal = moment(booking.slot_end).tz(booking.timezone);

    return (
        <div className="confirmation-container">
            <div className="confirmation-card">
                <div className="success-icon">✅</div>
                <h2>Booking Confirmed!</h2>
                <p className="sub-text">Your QGuard demo has been scheduled</p>

                <div className="booking-details">
                    <div className="detail-row">
                        <span className="label">Name:</span>
                        <span>{booking.visitor_name}</span>
                    </div>
                    <div className="detail-row">
                        <span className="label">Email:</span>
                        <span>{booking.visitor_email}</span>
                    </div>
                    <div className="detail-row">
                        <span className="label">Date & Time:</span>
                        <span>{startLocal.format('MMMM D, YYYY')}</span>
                    </div>
                    <div className="detail-row">
                        <span className="label">Time:</span>
                        <span>{startLocal.format('hh:mm A')} - {endLocal.format('hh:mm A')}</span>
                    </div>
                    <div className="detail-row">
                        <span className="label">Timezone:</span>
                        <span>{booking.timezone}</span>
                    </div>
                </div>

                <div className="email-notice">
                    📧 A confirmation email with calendar invite has been sent to your email.
                </div>

                <div className="action-buttons">
                    <button 
                        className="reschedule-btn"
                        onClick={() => navigate(`/reschedule?token=${booking.token}`)}
                    >
                        🔄 Reschedule
                    </button>
                    <button 
                        className="cancel-btn"
                        onClick={() => navigate(`/cancel?token=${booking.token}`)}
                    >
                        ❌ Cancel
                    </button>
                </div>

                <button 
                    className="home-btn"
                    onClick={() => navigate('/')}
                >
                    ← Back to Home
                </button>
            </div>
        </div>
    );
};

export default ConfirmationPage;