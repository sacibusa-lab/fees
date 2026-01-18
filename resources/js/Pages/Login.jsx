import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Eye, EyeOff } from 'lucide-react';
import './Login.css';

const Login = () => {
    const { data, setData, post, processing, errors } = useForm({
        phone: '',
        pin: '',
        remember: false,
    });

    const [showPin, setShowPin] = useState(false);

    const handleLogin = (e) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <div className="login-page">
            <Head title="Log In" />

            {/* Left Side - Branding */}
            <div className="login-branding">
                <div className="branding-content">
                    <div className="logo-large">
                        <div className="logo-icon-large">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
                            </svg>
                        </div>
                        <span className="logo-text-large">Fees</span>
                    </div>

                    <h1 className="branding-title">Fees Management with Convenience.</h1>

                    <p className="branding-description">
                        Manage and visualize fees without hassle. Powered with everything you need to have a clear/prompt insight of your cash inflow from fees.
                    </p>

                    <button className="contact-sales-btn">Contact Sales</button>

                    <div className="trusted-section">
                        <p className="trusted-text">Trusted by Over 900 Schools</p>
                        <div className="school-logos">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="school-logo-placeholder">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" />
                                    </svg>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="login-form-section">
                <div className="login-header">
                    <span className="login-header-text">Do not have an account?</span>
                    <button className="register-btn">Register</button>
                    <button className="support-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        Support
                    </button>
                </div>

                <div className="login-form-container">
                    <h2 className="login-title">Log In</h2>
                    <p className="login-subtitle">Please log in using your phone number and 6-digit PIN</p>

                    <form onSubmit={handleLogin}>
                        {(errors.phone || errors.pin) && (
                            <div className="error-message">
                                {errors.phone || errors.pin}
                            </div>
                        )}

                        <div className="form-group">
                            <input
                                type="tel"
                                className={`form-input ${errors.phone ? 'error' : ''}`}
                                placeholder="08162157107"
                                value={data.phone}
                                onChange={(e) => setData('phone', e.target.value)}
                                required
                                disabled={processing}
                            />
                        </div>

                        <div className="form-group">
                            <div className="password-input-wrapper">
                                <input
                                    type={showPin ? 'text' : 'password'}
                                    className={`form-input ${errors.pin ? 'error' : ''}`}
                                    placeholder="••••••"
                                    value={data.pin}
                                    onChange={(e) => setData('pin', e.target.value)}
                                    maxLength={6}
                                    required
                                    disabled={processing}
                                />
                                <button
                                    type="button"
                                    className="toggle-password-btn"
                                    onClick={() => setShowPin(!showPin)}
                                    disabled={processing}
                                >
                                    {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="form-footer">
                            <label className="remember-me">
                                <input
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    disabled={processing}
                                />
                                <span>Remember me</span>
                            </label>
                            <a href="#" className="forgot-pin">Forgot PIN?</a>
                        </div>

                        <button type="submit" className="login-submit-btn" disabled={processing}>
                            {processing ? 'Logging in...' : 'Login'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
