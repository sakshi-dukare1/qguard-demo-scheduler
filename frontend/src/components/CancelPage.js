import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cancelBooking, getBookingByToken } from '../services/api';

const CancelPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [booking, setBooking] = useState(null);
    const [cancelled, setCancelled] = useState(false);
    
    // Confirmation modal state
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Invalid cancel link');
            return;
        }
        
        const fetchBooking = async () => {
            try {
                const response = await getBookingByToken(token);
                setBooking(response.booking);
            } catch (err) {
                setError('Booking not found');
            }
        };
        
        fetchBooking();
    }, [token]);

    // Show confirmation modal
    const handleCancelClick = () => {
        setShowConfirmModal(true);
    };

    // Confirm cancellation
    const confirmCancel = async () => {
        try {
            setLoading(true);
            setShowConfirmModal(false);
            await cancelBooking(token);
            setCancelled(true);
        } catch (err) {
            setError('Failed to cancel booking. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Cancel cancellation
    const cancelCancellation = () => {
        setShowConfirmModal(false);
    };

    // SAFE date formatter - NO toLocaleString
    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        const month = date.toLocaleString('en-US', { month: 'short' });
        const day = date.getDate();
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${month} ${day}, ${year} at ${hours}:${minutes}`;
    };

    if (cancelled) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f4e 100%)',
                padding: '40px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{
                    maxWidth: '500px',
                    margin: '0 auto',
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '20px',
                    padding: '40px',
                    textAlign: 'center',
                    color: 'white'
                }}>
                    <div style={{fontSize: 64, marginBottom: 10}}>❌</div>
                    <h2 style={{color: '#ff6b6b'}}>Booking Cancelled</h2>
                    <p style={{color: '#8892b0'}}>Your demo has been cancelled successfully</p>
                    <button 
                        style={{
                            padding: '12px 30px',
                            background: 'transparent',
                            color: '#8892b0',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: 8,
                            cursor: 'pointer',
                            marginTop: 20
                        }}
                        onClick={() => navigate('/')}
                    >
                        ← Back to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f4e 100%)',
            padding: '40px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div style={{
                maxWidth: '500px',
                margin: '0 auto',
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                padding: '40px',
                textAlign: 'center',
                color: 'white'
            }}>
                <div style={{fontSize: 64, marginBottom: 10}}>⚠️</div>
                <h2 style={{color: '#ff6b6b'}}>Cancel Booking?</h2>
                
                {error && <div style={{color: '#ff6b6b', padding: 10, margin: '10px 0', background: 'rgba(255,0,0,0.1)', borderRadius: 8}}>{error}</div>}
                
                {booking && (
                    <div style={{marginBottom: 30, color: '#8892b0'}}>
                        <p>Are you sure you want to cancel the demo for:</p>
                        <p><strong>{booking.visitor_name}</strong></p>
                        <p style={{fontSize: 14}}>
                            {booking.visitor_email} • {booking.company}
                        </p>
                        <p style={{fontSize: 14, marginTop: 10}}>
                            Scheduled for: <strong>
                                {formatDate(booking.slot_start)}
                            </strong>
                        </p>
                    </div>
                )}

                <button 
                    onClick={handleCancelClick}
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: 14,
                        border: '1px solid rgba(255, 0, 0, 0.3)',
                        borderRadius: 8,
                        background: 'rgba(255, 0, 0, 0.2)',
                        color: '#ff6b6b',
                        cursor: 'pointer',
                        fontSize: 16,
                        fontWeight: 600
                    }}
                >
                    {loading ? 'Processing...' : 'Yes, Cancel Booking'}
                </button>

                <button 
                    onClick={() => navigate('/')}
                    style={{
                        width: '100%',
                        padding: 14,
                        background: 'transparent',
                        color: '#8892b0',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontSize: 16,
                        marginTop: 10
                    }}
                >
                    No, Go Back
                </button>
            </div>

            {/* CONFIRMATION MODAL */}
            {showConfirmModal && booking && (
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
                }} onClick={cancelCancellation}>
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
                        <div style={{fontSize: 48, textAlign: 'center', marginBottom: 10}}>⚠️</div>
                        <h3 style={{
                            fontSize: 24,
                            color: '#ff6b6b',
                            textAlign: 'center',
                            marginBottom: 10
                        }}>
                            Confirm Cancellation
                        </h3>
                        
                        <p style={{color: '#8892b0', textAlign: 'center', marginBottom: 20}}>
                            This action cannot be undone.
                        </p>
                        
                        <div style={{
                            background: 'rgba(255, 0, 0, 0.05)',
                            borderRadius: '12px',
                            padding: '20px',
                            margin: '20px 0',
                            border: '1px solid rgba(255, 0, 0, 0.1)'
                        }}>
                            <p style={{margin: '8px 0', color: '#ccd6f6'}}>
                                <strong style={{color: '#8892b0'}}>Name:</strong> {booking.visitor_name}
                            </p>
                            <p style={{margin: '8px 0', color: '#ccd6f6'}}>
                                <strong style={{color: '#8892b0'}}>Email:</strong> {booking.visitor_email}
                            </p>
                            <p style={{margin: '8px 0', color: '#ccd6f6'}}>
                                <strong style={{color: '#8892b0'}}>Date:</strong> {formatDate(booking.slot_start)}
                            </p>
                            <p style={{margin: '8px 0', color: '#ccd6f6'}}>
                                <strong style={{color: '#8892b0'}}>Timezone:</strong> {booking.timezone}
                            </p>
                        </div>
                        
                        <div style={{
                            display: 'flex',
                            gap: 10,
                            marginTop: 20
                        }}>
                            <button
                                onClick={cancelCancellation}
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
                                No, Keep It
                            </button>
                            <button
                                onClick={confirmCancel}
                                disabled={loading}
                                style={{
                                    flex: 2,
                                    padding: 12,
                                    border: 'none',
                                    borderRadius: 8,
                                    background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                                    color: 'white',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    fontSize: 14,
                                    fontWeight: 600,
                                    opacity: loading ? 0.6 : 1
                                }}
                            >
                                {loading ? 'Processing...' : '✅ Yes, Cancel Booking'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CancelPage;