import React, { useState } from 'react';
import Layout from '../Components/Layout';
import { Head, Link } from '@inertiajs/react';
import { ChevronLeft, Download, XCircle, User, CreditCard, BookOpen } from 'lucide-react';
import './TransactionDetail.css';

const TransactionDetail = ({ transaction }) => {
    const [activeTab, setActiveTab] = useState('payment_history');

    const { transaction_info, fee_info, student_info, payment_history, beneficiaries } = transaction;

    const getStatusClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'success':
            case 'approved':
                return 'status-approved';
            case 'pending':
                return 'status-pending';
            case 'failed':
                return 'status-failed';
            default:
                return '';
        }
    };

    return (
        <Layout>
            <Head title={`Transaction - ${transaction_info.reference}`} />

            <div className="transaction-detail-container">
                <div className="detail-header">
                    <div className="header-left">
                        <Link href="/payments/transactions" className="back-link">
                            <ChevronLeft size={24} />
                        </Link>
                        <h1 className="transaction-reference">{transaction_info.reference}</h1>
                    </div>
                    <div className="header-actions">
                        <button className="action-btn download-btn">
                            <Download size={18} />
                            <span>Download</span>
                        </button>
                        <button className="action-btn cancel-btn">
                            <XCircle size={18} />
                            <span>Cancel Payment</span>
                        </button>
                    </div>
                </div>

                <div className="detail-grid">
                    {/* Transaction Information */}
                    <div className="detail-section">
                        <div className="section-title">
                            <CreditCard size={18} className="title-icon" />
                            Transaction Information
                        </div>
                        <div className="info-list">
                            <div className="info-item">
                                <span className="info-label">Reference</span>
                                <span className="info-value">{transaction_info.reference}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Transaction Status</span>
                                <span className={`status-badge ${getStatusClass(transaction_info.status)}`}>
                                    <span className="dot"></span>
                                    {transaction_info.status.toUpperCase()}
                                </span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Amount Paid</span>
                                <span className="info-value price">{transaction_info.amount}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Fee Incurred</span>
                                <span className="info-value">{transaction_info.fee_incurred}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Payment Gateway</span>
                                <span className="info-value">{transaction_info.gateway}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Channel of Payment</span>
                                <span className="info-value">{transaction_info.channel}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Destination Account</span>
                                <span className="info-value">{transaction_info.destination_account}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Destination Account Name</span>
                                <span className="info-value uppercase">{transaction_info.destination_account_name}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Virtual Account Type</span>
                                <span className="info-value">{transaction_info.virtual_account_type}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Method of Payment</span>
                                <span className="info-value">{transaction_info.method_of_payment}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Started On</span>
                                <span className="info-value">{transaction_info.started_on}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Completed On</span>
                                <span className="info-value">{transaction_info.completed_on}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Settlement Status</span>
                                <span className="info-value">{transaction_info.settlement_status}</span>
                            </div>
                        </div>
                    </div>

                    <div className="right-sections">
                        {/* Fee Information */}
                        <div className="detail-section">
                            <div className="section-title">
                                <BookOpen size={18} className="title-icon" />
                                Fee Information
                            </div>
                            <div className="info-list">
                                <div className="info-item">
                                    <span className="info-label">Purpose of Payment</span>
                                    <span className="info-value">{fee_info.purpose}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Amount</span>
                                    <span className="info-value price">{fee_info.amount}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Session</span>
                                    <span className="info-value">{fee_info.session}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Term</span>
                                    <span className="info-value">{fee_info.term}</span>
                                </div>
                            </div>
                        </div>

                        {/* Student Information */}
                        <div className="detail-section">
                            <div className="section-title">
                                <User size={18} className="title-icon" />
                                Student/Payer Information
                            </div>
                            <div className="info-list">
                                <div className="info-item">
                                    <span className="info-label">Student Name</span>
                                    <span className="info-value">{student_info.name}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Reg Number</span>
                                    <span className="info-value">{student_info.reg_number}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Class</span>
                                    <span className="info-value">{student_info.class}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Email</span>
                                    <span className="info-value">{student_info.email || 'N/A'}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Phone</span>
                                    <span className="info-value">{student_info.phone || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs Section */}
                <div className="tabs-container">
                    <div className="tabs-header">
                        <button
                            className={`tab-btn ${activeTab === 'beneficiaries' ? 'active' : ''}`}
                            onClick={() => setActiveTab('beneficiaries')}
                        >
                            Beneficiaries
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'payment_history' ? 'active' : ''}`}
                            onClick={() => setActiveTab('payment_history')}
                        >
                            Payment History
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'comments' ? 'active' : ''}`}
                            onClick={() => setActiveTab('comments')}
                        >
                            Comments
                        </button>
                    </div>

                    <div className="tab-content">
                        {activeTab === 'payment_history' && (
                            <div className="table-wrapper">
                                <table className="history-table">
                                    <thead>
                                        <tr>
                                            <th>S/N</th>
                                            <th>Expected</th>
                                            <th>Amount Paid</th>
                                            <th>Balance</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payment_history.map((row) => (
                                            <tr key={row.sn}>
                                                <td>{row.sn}</td>
                                                <td>{row.expected}</td>
                                                <td>{row.paid}</td>
                                                <td>{row.balance}</td>
                                                <td>{row.date}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {activeTab === 'beneficiaries' && (
                            <div className="beneficiaries-list">
                                {beneficiaries.length > 0 ? (
                                    <table className="history-table">
                                        <thead>
                                            <tr>
                                                <th>Bank</th>
                                                <th>Account Name</th>
                                                <th>Percentage</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {beneficiaries.map((b) => (
                                                <tr key={b.id}>
                                                    <td>{b.bank_account?.bank_name}</td>
                                                    <td>{b.bank_account?.account_name}</td>
                                                    <td>{b.percentage}%</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="empty-state">No beneficiaries configured for this fee.</div>
                                )}
                            </div>
                        )}
                        {activeTab === 'comments' && (
                            <div className="empty-state">No comments for this transaction.</div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default TransactionDetail;
