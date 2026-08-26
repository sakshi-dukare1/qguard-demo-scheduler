import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
    const navigate = useNavigate();

    return (
        <div className="home-container">
            <div className="hero">
                <h1 className="title">QGuard</h1>
                <p className="subtitle">Quantum Cybersecurity Solution</p>
                <p className="description">
                    Protect your enterprise with quantum-ready cybersecurity.
                    Experience the future of security.
                </p>
                <button 
                    className="demo-button"
                    onClick={() => navigate('/book')}
                >
                     Schedule a Demo
                </button>
            </div>
            
            <div className="features">
                <div className="feature-card">
                    <h3>🔒 Quantum Security</h3>
                    <p>Post-quantum cryptography for enterprise protection</p>
                </div>
                <div className="feature-card">
                    <h3>⚡ Real-time Protection</h3>
                    <p>Instant threat detection and response</p>
                </div>
                <div className="feature-card">
                    <h3>🌐 Enterprise Ready</h3>
                    <p>Scalable solutions for businesses of all sizes</p>
                </div>
            </div>
        </div>
    );
};

export default HomePage;