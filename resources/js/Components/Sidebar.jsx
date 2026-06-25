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
    Shield,
    X,
    GraduationCap,
    Zap,
    Package,
    Archive
} from 'lucide-react';
import VerifyPaymentModal from './VerifyPaymentModal';
import { usePermission } from '../Hooks/usePermission';
import './Sidebar.css';

const Sidebar = ({ institution, isOpen, onClose }) => {
    const currentPath = window.location.pathname;

    const [studentsOpen, setStudentsOpen] = useState(currentPath.startsWith('/students'));
    const [paymentsOpen, setPaymentsOpen] = useState(currentPath.startsWith('/payments'));
    const [businessOpen, setBusinessOpen] = useState(currentPath.startsWith('/business'));
    const [adminCareOpen, setAdminCareOpen] = useState(currentPath.startsWith('/admin-care'));
    const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

    const handleLogout = () => {
        router.post('/logout');
    };

    const isActive = (path) => window.location.pathname === path;
    const { can } = usePermission();

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
                            <img src={`/storage/${institution.logo}`} alt="Logo" className="logo-img" />
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
                {can('students.view') && (
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
                )}

                {can('fees.view') && (
                    <Link href="/fees" className={`nav-item ${isActive('/fees') ? 'active' : ''}`} onClick={onClose}>
                        <FileText size={18} />
                        <span>Fees</span>
                    </Link>
                )}

                {/* Payments */}
                {can('payments.view') && (
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
                                <Link href="/payments/schedule" className={`nav-subitem ${isActive('/payments/schedule') ? 'active' : ''}`} onClick={onClose}>
                                    <span className="dot"></span>
                                    Payment Schedule
                                </Link>
                                <Link href="/payments/transactions" className={`nav-subitem ${isActive('/payments/transactions') ? 'active' : ''}`} onClick={onClose}>
                                    <span className="dot"></span>
                                    Transactions
                                </Link>
                                {can('settlements.view') && (
                                    <Link href="/settlements" className={`nav-subitem ${isActive('/settlements') ? 'active' : ''}`} onClick={onClose}>
                                        <span className="dot"></span>
                                        Settlements
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {can('sessions.view') && (
                    <Link href="/academic-sessions" className={`nav-item ${isActive('/academic-sessions') ? 'active' : ''}`} onClick={onClose}>
                        <Calendar size={18} />
                        <span>Academic Sessions</span>
                    </Link>
                )}

                {can('students.manage') && (
                    <Link href="/scholarships" className={`nav-item ${isActive('/scholarships') ? 'active' : ''}`} onClick={onClose}>
                        <GraduationCap size={18} />
                        <span>Scholarships</span>
                    </Link>
                )}

                {can('students.manage') && (
                    <Link href="/bulk-operations" className={`nav-item ${isActive('/bulk-operations') ? 'active' : ''}`} onClick={onClose}>
                        <Zap size={18} />
                        <span>Bulk Ops</span>
                    </Link>
                )}

                {can('students.manage') && (
                    <Link href="/alumni" className={`nav-item ${isActive('/alumni') ? 'active' : ''}`} onClick={onClose}>
                        <Archive size={18} />
                        <span>Alumni</span>
                    </Link>
                )}

                {can('inventory.manage') && (
                    <Link href="/inventory" className={`nav-item ${isActive('/inventory') ? 'active' : ''}`} onClick={onClose}>
                        <Package size={18} />
                        <span>Inventory</span>
                    </Link>
                )}

                {/* Business */}
                {can('business.view') && (
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
                                <Link href="/business/bank-accounts" className={`nav-subitem ${isActive('/business/bank-accounts') ? 'active' : ''}`} onClick={onClose}>
                                    <span className="dot"></span>
                                    Bank Accounts
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {/* Admin Care */}
                {can('admin-care.manage') && (
                    <div className="nav-section">
                        <button
                            className={`nav-item nav-section-header ${adminCareOpen ? 'open' : ''}`}
                            onClick={() => setAdminCareOpen(!adminCareOpen)}
                        >
                            <Shield size={18} />
                            <span>Admin Care</span>
                            <ChevronDown size={16} className="chevron" />
                        </button>
                        {adminCareOpen && (
                            <div className="nav-submenu">
                                <Link href="/admin-care/all-admins" className={`nav-subitem ${isActive('/admin-care/all-admins') ? 'active' : ''}`} onClick={onClose}>
                                    <span className="dot"></span>
                                    All Admins
                                </Link>
                                <Link href="/admin-care/roles" className={`nav-subitem ${isActive('/admin-care/roles') ? 'active' : ''}`} onClick={onClose}>
                                    <span className="dot"></span>
                                    Admin Role
                                </Link>
                                <Link href="/admin-care/permissions" className={`nav-subitem ${isActive('/admin-care/permissions') ? 'active' : ''}`} onClick={onClose}>
                                    <span className="dot"></span>
                                    Role Permission
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {can('settings.view') && (
                    <Link href="/settings" className={`nav-item ${isActive('/settings') ? 'active' : ''}`} onClick={onClose}>
                        <Settings size={18} />
                        <span>Settings</span>
                    </Link>
                )}
            </nav>

            {/* Institution Info */}
            <div className="sidebar-footer">
                <Link href="/profile" className="institution-info" style={{ textDecoration: 'none', color: 'inherit' }}>
                    {institution?.logo ? (
                        <img src={`/storage/${institution.logo}`} alt="Institution Logo" className="institution-avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                        <div className="institution-avatar">
                            {institution?.name?.charAt(0) || 'S'}
                        </div>
                    )}
                    <div className="institution-details">
                        <div className="institution-name">{institution?.name || 'Institution'}</div>
                        <div className="institution-role">{institution?.email || 'Admin'}</div>
                    </div>
                </Link>

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
