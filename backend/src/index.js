const express = require('express');
const cors = require('cors');
require('dotenv').config();

// 🔥 Catch silent crashes
process.on('uncaughtException', (err) => {
    console.error('🔥 UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason) => {
    console.error('🔥 UNHANDLED REJECTION:', reason);
});

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const bookingRoutes = require('./routes/booking');
app.use('/api', bookingRoutes);

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'QGuard Demo Scheduler API is running!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`http://localhost:${PORT}`);
});