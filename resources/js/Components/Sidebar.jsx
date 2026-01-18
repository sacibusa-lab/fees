import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import {
    Home,
    Users,
    FileText,
    CreditCard,
    DollarSign,
    Calendar,
    Building2,
    LogOut,
    ChevronDown,
    Settings,
    X
} from 'lucide-react';
import VerifyPaymentModal from './VerifyPaymentModal';
import './Sidebar.css';

const Sidebar = ({ institution, isOpen, onClose }) => {
    const currentPath = window.location.pathname;

    const [studentsOpen, setStudentsOpen] = useState(currentPath.startsWith('/students'));
    const [paymentsOpen, setPaymentsOpen] = useState(currentPath.startsWith('/payments'));
    const [businessOpen, setBusinessOpen] = useState(currentPath.startsWith('/business'));
    const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

    const handleLogout = () => {
        router.post('/logout');
    };

    const isActive = (path) => window.location.pathname === path;

    return (
        <div className={`sidebar ${isOpen ? 'open' : ''}`}>
            {/* Mobile Close Button */}
            <button className="sidebar-close-btn" onClick={onClose}>
                <X size={20} />
            </button>
            {/* Logo and Portal ID */}
            <div className="sidebar-header">
                <div className="logo">
                    {institution?.logo ? (
                        <div className="logo-image-container">
                            <img src={institution.logo} alt="Logo" className="logo-img" />
                        </div>
                    ) : (
                        <div className="logo-icon">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
                            </svg>
                        </div>
                    )}
                    <span className="logo-text">{institution?.name || 'Fees'}</span>
                </div>
                <div className="portal-id">Portal ID: {institution?.portal_id || 'N/A'}</div>
                <button
                    className="verify-payment-btn"
                    onClick={() => setIsVerifyModalOpen(true)}
                >
                    <span>✓</span> Verify Payment
                </button>
            </div>

            <VerifyPaymentModal
                isOpen={isVerifyModalOpen}
                onClose={() => setIsVerifyModalOpen(false)}
            />

            {/* Navigation */}
            <nav className="sidebar-nav">
                <Link href="/dashboard" className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`} onClick={onClose}>
                    <Home size={18} />
                    <span>Home</span>
                </Link>

                {/* Students Hub */}
                <div className="nav-section">
                    <button
                        className={`nav-item nav-section-header ${studentsOpen ? 'open' : ''}`}
                        onClick={() => setStudentsOpen(!studentsOpen)}
                    >
                        <Users size={18} />
                        <span>Students Hub</span>
                        <ChevronDown size={16} className="chevron" />
                    </button>
                    {studentsOpen && (
                        <div className="nav-submenu">
                            <Link href="/students/classes" className={`nav-subitem ${isActive('/students/classes') ? 'active' : ''}`} onClick={onClose}>
                                <span className="dot"></span>
                                Classes
                            </Link>
                            <Link href="/students" className={`nav-subitem ${isActive('/students') ? 'active' : ''}`} onClick={onClose}>
                                <span className="dot"></span>
                                Students
                            </Link>
                        </div>
                    )}
                </div>

                <Link href="/fees" className={`nav-item ${isActive('/fees') ? 'active' : ''}`} onClick={onClose}>
                    <FileText size={18} />
                    <span>Fees</span>
                </Link>

                {/* Payments */}
                <div className="nav-section">
                    <button
                        className={`nav-item nav-section-header ${paymentsOpen ? 'open' : ''}`}
                        onClick={() => setPaymentsOpen(!paymentsOpen)}
                    >
                        <CreditCard size={18} />
                        <span>Payments</span>
                        <ChevronDown size={16} className="chevron" />
                    </button>
                    {paymentsOpen && (
                        <div className="nav-submenu">
                            <Link href="/payments/overview" className={`nav-subitem ${isActive('/payments/overview') ? 'active' : ''}`} onClick={onClose}>
                                <span className="dot"></span>
                                Overview
                            </Link>
                            <Link href="/payments/transactions" className={`nav-subitem ${isActive('/payments/transactions') ? 'active' : ''}`} onClick={onClose}>
                                <span className="dot"></span>
                                Transactions
                            </Link>
                        </div>
                    )}
                </div>

                <Link href="/academic-sessions" className={`nav-item ${isActive('/academic-sessions') ? 'active' : ''}`} onClick={onClose}>
                    <Calendar size={18} />
                    <span>Academic Sessions</span>
                </Link>

                {/* Business */}
                <div className="nav-section">
                    <button
                        className={`nav-item nav-section-header ${businessOpen ? 'open' : ''}`}
                        onClick={() => setBusinessOpen(!businessOpen)}
                    >
                        <Building2 size={18} />
                        <span>Business</span>
                        <ChevronDown size={16} className="chevron" />
                    </button>
                    {businessOpen && (
                        <div className="nav-submenu">
                            <Link href="/business/profile" className={`nav-subitem ${isActive('/business/profile') ? 'active' : ''}`} onClick={onClose}>
                                <span className="dot"></span>
                                Business Profile
                            </Link>
                            <Link href="/business/bank-accounts" className={`nav-subitem ${isActive('/business/bank-accounts') ? 'active' : ''}`} onClick={onClose}>
                                <span className="dot"></span>
                                Bank Accounts
                            </Link>
                        </div>
                    )}
                </div>

                <Link href="/settings" className={`nav-item ${isActive('/settings') ? 'active' : ''}`} onClick={onClose}>
                    <Settings size={18} />
                    <span>Settings</span>
                </Link>
            </nav>

            {/* Institution Info */}
            <div className="sidebar-footer">
                <div className="institution-info">
                    {institution?.logo ? (
                        <img src={institution.logo} alt="Institution Logo" className="institution-avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                        <div className="institution-avatar">
                            {institution?.name?.charAt(0) || 'S'}
                        </div>
                    )}
                    <div className="institution-details">
                        <div className="institution-name">{institution?.name || 'Institution'}</div>
                        <div className="institution-role">{institution?.email || 'Admin'}</div>
                    </div>
                    <ChevronDown size={16} />
                </div>

                <button className="logout-btn" onClick={handleLogout}>
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>

                <div className="version">Version 2.1.0</div>
            </div>
        </div>
    );
};

export default Sidebar;
