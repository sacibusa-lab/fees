import React, { useState } from 'react';
import { Head, useForm, Link, router } from '@inertiajs/react';
import Layout from '../Components/Layout';
import { User, CreditCard, Activity, Settings, Save, Trash2, ArrowLeft } from 'lucide-react';
import './StudentProfile.css';

const StudentProfile = ({ student, classes, subClasses, paymentActivity = [], allTransactions = [], currentSessionName = 'N/A' }) => {
    const [activeTab, setActiveTab] = useState('profile');

    // Form for editing
    const { data, setData, put, processing, errors } = useForm({
        name: student.name,
        gender: student.gender,
        class_id: student.class_id,
        sub_class_id: student.sub_class_id,
    });

    const handleUpdate = (e) => {
        e.preventDefault();
        put(`/students/${student.id}`, {
            preserveScroll: true,
            onSuccess: () => alert('Student updated successfully!')
        });
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
            router.delete(`/students/${student.id}`, {
                onSuccess: () => alert('Student profile deleted successfully'),
            });
        }
    };

    return (
        <Layout>
            <Head title={`${student.name} - Profile`} />

            <div className="student-profile-container">
                {/* Header */}
                <div className="profile-header">
                    <Link href="/students" className="back-link">
                        <ArrowLeft size={20} /> Back to Students
                    </Link>

                    <div className="profile-summary">
                        <div className="profile-avatar-large">
                            {student.name.charAt(0)}
                        </div>
                        <div className="profile-info-primary">
                            <h1>{student.name}</h1>
                            <div className="profile-meta">
                                <span className="meta-item">{student.admission_number}</span>
                                <span className="meta-dot">•</span>
                                <span className="meta-item">{student.class_name} ({student.sub_class_name})</span>
                                <span className="meta-dot">•</span>
                                <span className={`status-pill ${student.payment_status}`}>
                                    {student.payment_status}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="profile-tabs">
                        <button
                            className={`tab-item ${activeTab === 'profile' ? 'active' : ''}`}
                            onClick={() => setActiveTab('profile')}
                        >
                            <User size={18} /> Profile Details
                        </button>
                        <button
                            className={`tab-item ${activeTab === 'accounts' ? 'active' : ''}`}
                            onClick={() => setActiveTab('accounts')}
                        >
                            <CreditCard size={18} /> Virtual Accounts
                        </button>
                        <button
                            className={`tab-item ${activeTab === 'activity' ? 'active' : ''}`}
                            onClick={() => setActiveTab('activity')}
                        >
                            <Activity size={18} /> Payment Activity
                        </button>
                        <button
                            className={`tab-item ${activeTab === 'settings' ? 'active' : ''}`}
                            onClick={() => setActiveTab('settings')}
                        >
                            <Settings size={18} /> Settings
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="profile-content">

                    {/* PROFILE TAB */}
                    {activeTab === 'profile' && (
                        <div className="content-card">
                            <div className="card-header">
                                <h3>Personal Information</h3>
                                <p>View and update student details.</p>
                            </div>
                            <form onSubmit={handleUpdate} className="profile-form">
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <input
                                            type="text"
                                            value={data.name}
                                            onChange={e => setData('name', e.target.value)}
                                            className={errors.name ? 'error' : ''}
                                        />
                                        {errors.name && <span className="error-msg">{errors.name}</span>}
                                    </div>

                                    <div className="form-group">
                                        <label>Gender</label>
                                        <select
                                            value={data.gender}
                                            onChange={e => setData('gender', e.target.value)}
                                        >
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Class</label>
                                        <select
                                            value={data.class_id}
                                            onChange={e => setData('class_id', e.target.value)}
                                        >
                                            {classes.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Subclass</label>
                                        <select
                                            value={data.sub_class_id}
                                            onChange={e => setData('sub_class_id', e.target.value)}
                                        >
                                            <option value="">Select Subclass</option>
                                            {subClasses.filter(sc =>
                                                !data.class_id ||
                                                sc.class_id == data.class_id ||
                                                !sc.class_id // Global subclasses
                                            ).map(sc => (
                                                <option key={sc.id} value={sc.id}>{sc.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Email Address</label>
                                        <input type="text" value={student.email || 'N/A'} disabled className="disabled-input" />
                                    </div>

                                    <div className="form-group">
                                        <label>Student Phone</label>
                                        <input type="text" value={student.phone || 'N/A'} disabled className="disabled-input" />
                                    </div>

                                    <div className="form-group">
                                        <label>Guardian Phone</label>
                                        <input type="text" value={student.guardian_phone || 'N/A'} disabled className="disabled-input" />
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button type="submit" className="btn-save" disabled={processing}>
                                        <Save size={18} />
                                        {processing ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* ACCOUNTS TAB */}
                    {activeTab === 'accounts' && (
                        <div className="content-card">
                            <div className="card-header flex-between">
                                <div>
                                    <h3>Virtual Accounts</h3>
                                    <p>Dedicated accounts for student fee payments.</p>
                                </div>
                                {!student.has_vaccount && (
                                    <button
                                        className="btn-generate-va"
                                        onClick={() => router.post(`/students/${student.id}/virtual-account`)}
                                        disabled={processing}
                                    >
                                        <CreditCard size={18} /> Generate Virtual Account
                                    </button>
                                )}
                            </div>

                            <div className="accounts-list">
                                {student.account_numbers.length > 0 ? (
                                    student.account_numbers.map((acc, idx) => (
                                        <div key={idx} className={`account-item ${acc.is_dva ? 'dva-item' : ''}`}>
                                            <div className="bank-logo">
                                                {acc.bank.charAt(0)}
                                            </div>
                                            <div className="account-details">
                                                <div className="account-header">
                                                    <h4>{acc.bank}</h4>
                                                    <span className={`acc-pill ${acc.is_dva ? 'dva' : 'regular'}`}>
                                                        {acc.is_dva ? 'Dedicated' : 'Regular'}
                                                    </span>
                                                </div>
                                                <div className="account-number-row">
                                                    <span className="acc-num">{acc.number}</span>
                                                    <span className="acc-name">{acc.name}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty-state">
                                        <CreditCard size={48} />
                                        <p>No payment accounts associated with this student.</p>
                                    </div>
                                )}
                            </div>

                            {student.has_vaccount && (
                                <div className="va-notice">
                                    <p>Payments to this dedicated account are automatically verified and credited to the student.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ACTIVITY TAB */}
                    {activeTab === 'activity' && (
                        <div className="content-card no-padding">
                            <div className="card-header activity-header">
                                <h3>Payment Activity</h3>
                                <p>Summary of termly fee payments.</p>
                            </div>

                            {paymentActivity.length > 0 ? (
                                <div className="activity-table-container">
                                    <table className="activity-table">
                                        <thead>
                                            <tr>
                                                <th>S/N</th>
                                                <th>{currentSessionName} SESSION</th>
                                                <th>Amount Paid</th>
                                                <th>Date Of Payment</th>
                                                <th>Method</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paymentActivity.map((item) => (
                                                <tr key={item.sn}>
                                                    <td>{item.sn}</td>
                                                    <td>
                                                        <div className="term-status-cell">
                                                            <span className="term-name">{item.term}</span>
                                                            <span className={`status-badge-term ${item.status.toLowerCase()}`}>
                                                                {item.status}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="amount-cell">{item.paid_formatted}</td>
                                                    <td>{item.date}</td>
                                                    <td>{item.method}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <Activity size={48} />
                                    <p>No recent payment activity found.</p>
                                </div>
                            )}

                            {/* TRANSACTION HISTORY */}
                            <div className="card-header activity-header transaction-history-header">
                                <h3>Transaction History</h3>
                                <p>Detailed record of all payments in the current session.</p>
                            </div>

                            {allTransactions.length > 0 ? (
                                <div className="activity-table-container">
                                    <table className="activity-table history-table">
                                        <thead>
                                            <tr>
                                                <th>Reference</th>
                                                <th>Fee(s)</th>
                                                <th>Amount</th>
                                                <th>Date</th>
                                                <th>Method</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {allTransactions.map((tx) => (
                                                <tr key={tx.id}>
                                                    <td className="tx-ref">{tx.reference}</td>
                                                    <td className="tx-fees">{tx.fees}</td>
                                                    <td className="tx-amount">{tx.amount}</td>
                                                    <td className="tx-date">{tx.date}</td>
                                                    <td>{tx.method}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <p>No transactions found for this session.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* SETTINGS TAB */}
                    {activeTab === 'settings' && (
                        <div className="content-card danger-zone">
                            <div className="card-header">
                                <h3>Delete Student</h3>
                                <p>Permanently remove this student and all associated data.</p>
                            </div>
                            <div className="danger-actions">
                                <p className="warning-text">Once deleted, this action cannot be undone. Please be certain.</p>
                                <button className="btn-delete" onClick={handleDelete}>
                                    <Trash2 size={18} /> Delete Student Profile
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default StudentProfile;
