import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import BookingPage from './components/BookingPage';
import ConfirmationPage from './components/ConfirmationPage';
import ReschedulePage from './components/ReschedulePage';
import CancelPage from './components/CancelPage';
import './App.css';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/book" element={<BookingPage />} />
                <Route path="/confirmation" element={<ConfirmationPage />} />
                <Route path="/reschedule" element={<ReschedulePage />} />
                <Route path="/cancel" element={<CancelPage />} />
            </Routes>
        </Router>
    );
}

export default App;