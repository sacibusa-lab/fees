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
                    <div className="branding-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
                        </svg>
                    </div>
                    <div className="branding-icon-ring">
                        <svg viewBox="0 0 100 100" fill="none">
                            <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
                            <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
                        </svg>
                    </div>

                    <h2 className="branding-heading">Welcome to Fees</h2>
                    <p className="branding-subtext">
                        Secure fee management platform for educational institutions.
                    </p>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="login-form-section">
                <div className="login-header">
                    <span className="login-header-text">Don't have an account?</span>
                    <button className="register-btn">Register</button>
                    <button className="support-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        Support
                    </button>
                </div>

                <div className="login-form-container">
                    <h2 className="login-title">Welcome Back</h2>
                    <p className="login-subtitle">Enter your credentials to access your account</p>

                    <form onSubmit={handleLogin}>
                        {(errors.phone || errors.pin) && (
                            <div className="error-message">
                                {errors.phone || errors.pin}
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label" htmlFor="phone">Phone Number</label>
                            <input
                                id="phone"
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
                            <div className="form-label-row">
                                <label className="form-label" htmlFor="pin">PIN</label>
                                <a href="#" className="forgot-pin">Forgot PIN?</a>
                            </div>
                            <div className="password-input-wrapper">
                                <input
                                    id="pin"
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
                        </div>

                        <button type="submit" className="login-submit-btn" disabled={processing}>
                            {processing ? 'Logging in...' : 'Sign In'}
                        </button>

                        <p className="login-footer-text">
                            Don't have an account? <a href="#">Register</a>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
