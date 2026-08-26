import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import moment from 'moment-timezone';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getAvailableSlots, rescheduleBooking, getBookingByToken } from '../services/api';

const ReschedulePage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [booking, setBooking] = useState(null);
    
    // Confirmation modal state
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedSlotData, setSelectedSlotData] = useState(null);

    useEffect(() => {
        if (!token) {
            setError('Invalid reschedule link');
            return;
        }

        const fetchData = async () => {
            try {
                const response = await getBookingByToken(token);
                setBooking(response.booking);
            } catch (err) {
                setError('Booking not found');
            }
        };
        
        fetchData();
    }, [token]);

    useEffect(() => {
        const fetchSlots = async () => {
            try {
                setLoading(true);
                const formattedDate = moment(selectedDate).format('YYYY-MM-DD');
                const response = await getAvailableSlots(formattedDate);
                
                const timezone = booking?.timezone || 'Asia/Kolkata';
                const localSlots = response.slots.map(slot => {
                    const startLocal = moment(slot.start).tz(timezone);
                    const endLocal = moment(slot.end).tz(timezone);
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
            } catch (err) {
                setError('Failed to load available slots');
            } finally {
                setLoading(false);
            }
        };

        if (booking) {
            fetchSlots();
        }
    }, [selectedDate, booking]);

    // Show confirmation modal when slot is selected
    const handleSlotSelect = (slot) => {
        setSelectedSlotData(slot);
        setShowConfirmModal(true);
    };

    // Confirm reschedule
    const confirmReschedule = async () => {
        try {
            setLoading(true);
            setShowConfirmModal(false);
            
            await rescheduleBooking(token, {
                slot_start: selectedSlotData.start,
                slot_end: selectedSlotData.end
            });
            
            navigate('/confirmation', { 
                state: { 
                    booking: { 
                        ...booking, 
                        slot_start: selectedSlotData.start, 
                        slot_end: selectedSlotData.end 
                    }
                } 
            });
        } catch (err) {
            setError('Failed to reschedule. Please try again.');
        } finally {
            setLoading(false);
            setSelectedSlotData(null);
        }
    };

    // Cancel reschedule
    const cancelReschedule = () => {
        setShowConfirmModal(false);
        setSelectedSlotData(null);
    };

    // Format date for display
    const formatDateTime = (dateStr, timezone) => {
        if (!dateStr) return 'N/A';
        return moment(dateStr).tz(timezone).format('MMMM D, YYYY [at] hh:mm A');
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f4e 100%)',
            padding: '40px 20px'
        }}>
            <div style={{
                maxWidth: '800px',
                margin: '0 auto',
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                padding: '40px',
                color: 'white'
            }}>
                <h2 style={{textAlign: 'center', marginBottom: 30, fontSize: 32, color: '#00d4ff'}}>
                    🔄 Reschedule Demo
                </h2>
                
                {error && (
                    <div style={{
                        color: '#ff6b6b',
                        textAlign: 'center',
                        padding: 10,
                        margin: '10px 0',
                        background: 'rgba(255,0,0,0.1)',
                        borderRadius: 8
                    }}>
                        {error}
                    </div>
                )}
                
                {booking && (
                    <div style={{
                        marginBottom: 20,
                        padding: 15,
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: 8,
                        color: '#8892b0'
                    }}>
                        <p>
                            <strong>Current booking for:</strong> {booking.visitor_name}
                        </p>
                        <p>
                            <strong>Current time:</strong> {formatDateTime(booking.slot_start, booking.timezone)}
                        </p>
                    </div>
                )}

                <form onSubmit={(e) => e.preventDefault()}>
                    <div style={{marginBottom: 30}}>
                        <h3 style={{color: '#8892b0', fontSize: 18, marginBottom: 15}}>
                            Select New Time
                        </h3>
                        
                        <div style={{
                            display: 'flex',
                            gap: 20,
                            marginBottom: 20,
                            flexWrap: 'wrap'
                        }}>
                            <div style={{flex: 1, minWidth: 200}}>
                                <label style={{
                                    display: 'block',
                                    color: '#8892b0',
                                    marginBottom: 5,
                                    fontSize: 14
                                }}>
                                    Date:
                                </label>
                                <DatePicker
                                    selected={selectedDate}
                                    onChange={setSelectedDate}
                                    minDate={new Date()}
                                    dateFormat="MMMM d, yyyy"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        borderRadius: 8,
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        color: 'white',
                                        fontSize: 14
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                            gap: 10,
                            maxHeight: 300,
                            overflowY: 'auto',
                            padding: 10
                        }}>
                            {loading ? (
                                <div style={{
                                    textAlign: 'center',
                                    color: '#8892b0',
                                    padding: 20,
                                    gridColumn: '1 / -1'
                                }}>
                                    Loading available slots...
                                </div>
                            ) : slots.length === 0 ? (
                                <div style={{
                                    textAlign: 'center',
                                    color: '#8892b0',
                                    padding: 20,
                                    gridColumn: '1 / -1'
                                }}>
                                    No available slots for this day
                                </div>
                            ) : (
                                slots.map((slot, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleSlotSelect(slot)}
                                        disabled={slot.isBooked}
                                        type="button"
                                        style={{
                                            padding: 12,
                                            border: slot.isBooked 
                                                ? '1px solid rgba(255, 0, 0, 0.3)' 
                                                : '1px solid rgba(255, 255, 255, 0.2)',
                                            borderRadius: 8,
                                            background: slot.isBooked 
                                                ? 'rgba(255, 0, 0, 0.2)' 
                                                : 'rgba(255, 255, 255, 0.05)',
                                            color: slot.isBooked 
                                                ? 'rgba(255,255,255,0.4)' 
                                                : 'white',
                                            cursor: slot.isBooked 
                                                ? 'not-allowed' 
                                                : 'pointer',
                                            transition: 'all 0.3s',
                                            fontSize: 14
                                        }}
                                    >
                                        {slot.displayTime} - {slot.displayEnd}
                                        {slot.isBooked && ' ❌'}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </form>

                {/* CONFIRMATION MODAL */}
                {showConfirmModal && selectedSlotData && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.8)',
                        backdropFilter: 'blur(10px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        animation: 'fadeIn 0.3s ease'
                    }} onClick={cancelReschedule}>
                        <div style={{
                            background: '#1a1f4e',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '20px',
                            padding: '40px',
                            maxWidth: '450px',
                            width: '90%',
                            color: 'white',
                            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
                        }} onClick={(e) => e.stopPropagation()}>
                            <h3 style={{
                                fontSize: 24,
                                color: '#00d4ff',
                                textAlign: 'center',
                                marginBottom: 20
                            }}>
                                🔄 Confirm Reschedule
                            </h3>
                            
                            <p style={{color: '#8892b0', textAlign: 'center', marginBottom: 20}}>
                                Are you sure you want to reschedule to:
                            </p>
                            
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '12px',
                                padding: '20px',
                                margin: '20px 0'
                            }}>
                                <p style={{margin: '8px 0', color: '#ccd6f6'}}>
                                    <strong style={{color: '#8892b0'}}>Date:</strong> {moment(selectedSlotData.start).tz(booking?.timezone || 'Asia/Kolkata').format('MMMM D, YYYY')}
                                </p>
                                <p style={{margin: '8px 0', color: '#ccd6f6'}}>
                                    <strong style={{color: '#8892b0'}}>Time:</strong> {moment(selectedSlotData.start).tz(booking?.timezone || 'Asia/Kolkata').format('hh:mm A')} - {moment(selectedSlotData.end).tz(booking?.timezone || 'Asia/Kolkata').format('hh:mm A')}
                                </p>
                                <p style={{margin: '8px 0', color: '#ccd6f6'}}>
                                    <strong style={{color: '#8892b0'}}>Timezone:</strong> {booking?.timezone || 'Asia/Kolkata'}
                                </p>
                            </div>
                            
                            <div style={{
                                display: 'flex',
                                gap: 10,
                                marginTop: 20
                            }}>
                                <button
                                    onClick={cancelReschedule}
                                    style={{
                                        flex: 1,
                                        padding: 12,
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        borderRadius: 8,
                                        background: 'transparent',
                                        color: '#8892b0',
                                        cursor: 'pointer',
                                        fontSize: 14,
                                        fontWeight: 600
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmReschedule}
                                    disabled={loading}
                                    style={{
                                        flex: 2,
                                        padding: 12,
                                        border: 'none',
                                        borderRadius: 8,
                                        background: 'linear-gradient(135deg, #00d4ff, #7b2ffc)',
                                        color: 'white',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        fontSize: 14,
                                        fontWeight: 600,
                                        opacity: loading ? 0.6 : 1
                                    }}
                                >
                                    {loading ? 'Processing...' : '✅ Confirm Reschedule'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReschedulePage;