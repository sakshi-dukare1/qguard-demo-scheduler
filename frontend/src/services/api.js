import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

export const getAvailableSlots = async (date) => {
    const response = await api.get(`/slots?date=${date}`);
    return response.data;
};

export const createBooking = async (bookingData) => {
    const response = await api.post('/bookings', bookingData);
    return response.data;
};

export const getBookingByToken = async (token) => {
    const response = await api.get(`/bookings/${token}`);
    return response.data;
};

export const rescheduleBooking = async (token, slotData) => {
    const response = await api.put(`/bookings/${token}/reschedule`, slotData);
    return response.data;
};

export const cancelBooking = async (token) => {
    const response = await api.put(`/bookings/${token}/cancel`);
    return response.data;
};

export default api;