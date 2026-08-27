import axios from 'axios';

// ✅ Use environment variable or fallback to Render backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://qguard-backend-cv7e.onrender.com/';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add a request interceptor for debugging
api.interceptors.request.use(request => {
    console.log('📤 API Request:', request.method.toUpperCase(), request.url);
    return request;
});

// Add a response interceptor for debugging
api.interceptors.response.use(
    response => {
        console.log('📥 API Response:', response.status, response.config.url);
        return response;
    },
    error => {
        console.error('❌ API Error:', error.response?.status, error.response?.data || error.message);
        return Promise.reject(error);
    }
);

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