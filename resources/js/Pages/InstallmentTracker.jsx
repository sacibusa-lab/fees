import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import Layout from '../Components/Layout';
import {
    Search, User, CreditCard, CheckCircle, AlertCircle,
    Clock, ChevronDown, ChevronUp, Calendar, Filter,
    Phone, ExternalLink, Wallet
} from 'lucide-react';
import './InstallmentTracker.css';

const formatCurrency = (amt) => {
    const value = typeof amt === 'string' ? parseFloat(amt.replace(/,/g, '')) : amt;
    return new Intl.NumberFormat('en-NG', {
        style: 'currency', currency: 'NGN', minimumFractionDigits: 0
    }).format(value || 0);
};

const InstallmentTracker = ({
    sessions = [], classes = [], studentList = [],
    studentDetail = null, installments = [], filters = {}
}) => {
    const [localFilters, setLocalFilters] = useState({
        session_id: filters.session_id || '',
        term: filters.term || '1st Term',
        class_id: filters.class_id || '',
        search: filters.search || '',
        student_id: filters.student_id || '',
    });
    const [showStudentDropdown, setShowStudentDropdown] = useState(false);
    const [expandedFee, setExpandedFee] = useState(null);

    const applyFilters = () => {
        router.get('/installments', localFilters, { preserveState: true, replace: true });
    };

    const selectStudent = (id) => {
        setLocalFilters({ ...localFilters, student_id: id, search: '' });
        setShowStudentDropdown(false);
        router.get('/installments', { ...localFilters, student_id: id, search: '' }, { preserveState: true, replace: true });
    };

    const clearStudent = () => {
        setLocalFilters({ ...localFilters, student_id: '', search: '' });
        router.get('/installments', { ...localFilters, student_id: '', search: '' }, { preserveState: true, replace: true });
    };

    const totalFeeAmount = installments
        .filter(i => !i.is_adjustment)
        .reduce((s, i) => s + i.fee_amount, 0);
    const totalPaid = installments
        .filter(i => !i.is_adjustment)
        .reduce((s, i) => s + i.total_paid, 0);
    const totalRemaining = installments
        .filter(i => !i.is_adjustment)
        .reduce((s, i) => s + i.remaining, 0);
    const totalAdjustments = installments
        .filter(i => i.is_adjustment)
        .reduce((s, i) => s + i.total_paid, 0);

    const filteredStudents = studentList.filter(s =>
        !localFilters.search ||
        s.name.toLowerCase().includes(localFilters.search.toLowerCase()) ||
        s.admission_number.toLowerCase().includes(localFilters.search.toLowerCase())
    );

    return (
        <Layout>
            <Head title="Installment Tracker" />
            <div className="installment-container">
                <div className="installment-header">
                    <div>
                        <h1>Installment Payment Tracker</h1>
                        <p>Track partial payments, remaining balances, and payment history per fee item</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="installment-filters">
                    <div className="filter-group">
                        <label><Calendar size={14} /> Session</label>
                        <select value={localFilters.session_id} onChange={e => setLocalFilters({ ...localFilters, session_id: e.target.value })}>
                            {sessions.map(s => (
                                <option key={s.id} value={s.id}>{s.name} {s.is_current ? '(Current)' : ''}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label><Calendar size={14} /> Term</label>
                        <select value={localFilters.term} onChange={e => setLocalFilters({ ...localFilters, term: e.target.value })}>
                            <option value="1st Term">1st Term</option>
                            <option value="2nd Term">2nd Term</option>
                            <option value="3rd Term">3rd Term</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <label><Filter size={14} /> Class</label>
                        <select value={localFilters.class_id} onChange={e => setLocalFilters({ ...localFilters, class_id: e.target.value })}>
                            <option value="">All Classes</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="filter-group student-search-group">
                        <label><User size={14} /> Student</label>
                        <div className="student-search-wrapper">
                            <input
                                type="text"
                                placeholder="Search student name or admission..."
                                value={localFilters.search}
                                onChange={e => setLocalFilters({ ...localFilters, search: e.target.value, student_id: '' })}
                                onFocus={() => setShowStudentDropdown(true)}
                                onBlur={() => setTimeout(() => setShowStudentDropdown(false), 200)}
                            />
                            {showStudentDropdown && filteredStudents.length > 0 && (
                                <div className="student-dropdown">
                                    {filteredStudents.map(s => (
                                        <div key={s.id} className="student-dropdown-item" onMouseDown={() => selectStudent(s.id)}>
                                            <span className="sdi-name">{s.name}</span>
                                            <span className="sdi-adm">{s.admission_number} — {s.class_name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <button className="apply-btn" onClick={applyFilters}><Search size={16} /> Search</button>
                </div>

                {/* Student Detail Header */}
                {studentDetail && (
                    <div className="student-detail-card">
                        <div className="student-detail-left">
                            <div className="student-avatar-lg">{studentDetail.name.charAt(0)}</div>
                            <div className="student-detail-info">
                                <h2>{studentDetail.name}</h2>
                                <div className="student-detail-meta">
                                    <span>{studentDetail.admission_number}</span>
                                    <span className="meta-divider">•</span>
                                    <span>{studentDetail.class_name}</span>
                                    {studentDetail.guardian_phone && (
                                        <>
                                            <span className="meta-divider">•</span>
                                            <a href={`tel:${studentDetail.guardian_phone}`} className="guardian-phone">
                                                <Phone size={12} /> {studentDetail.guardian_phone}
                                            </a>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="student-detail-right">
                            <button className="clear-student-btn" onClick={clearStudent}>Change Student</button>
                        </div>
                    </div>
                )}

                {/* Summary Bar */}
                {studentDetail && installments.length > 0 && (
                    <div className="installment-summary-bar">
                        <div className="isb-item">
                            <span className="isb-label">Total Fees</span>
                            <span className="isb-value">{formatCurrency(totalFeeAmount)}</span>
                        </div>
                        <div className="isb-item">
                            <span className="isb-label">Total Paid</span>
                            <span className="isb-value green">{formatCurrency(totalPaid)}</span>
                        </div>
                        <div className="isb-item">
                            <span className="isb-label">Remaining</span>
                            <span className={`isb-value ${totalRemaining > 0 ? 'red' : 'green'}`}>
                                {formatCurrency(totalRemaining)}
                            </span>
                        </div>
                        <div className="isb-item">
                            <span className="isb-label">Adjustments</span>
                            <span className={`isb-value ${totalAdjustments >= 0 ? 'orange' : 'green'}`}>
                                {formatCurrency(Math.abs(totalAdjustments))}
                                {totalAdjustments < 0 ? ' discount' : ' charges'}
                            </span>
                        </div>
                    </div>
                )}

                {/* Fee Installments */}
                {studentDetail && installments.length > 0 ? (
                    <div className="fee-installment-list">
                        {installments.map((item, idx) => (
                            <div key={idx} className={`fee-installment-card ${item.status} ${item.is_adjustment ? 'adjustment-card' : ''}`}>
                                <div className="fic-header" onClick={() => setExpandedFee(expandedFee === idx ? null : idx)}>
                                    <div className="fic-header-left">
                                        <div className={`fic-status-icon ${item.status}`}>
                                            {item.status === 'paid' ? <CheckCircle size={18} /> :
                                             item.status === 'partial' ? <Clock size={18} /> :
                                             item.status === 'adjustment' ? <Wallet size={18} /> :
                                             <AlertCircle size={18} />}
                                        </div>
                                        <div className="fic-title-section">
                                            <span className="fic-title">{item.fee_title}</span>
                                            {item.is_adjustment && <span className="adj-tag">Adjustment</span>}
                                            {!item.is_adjustment && (
                                                <span className={`fic-status-tag ${item.status}`}>
                                                    {item.status === 'paid' ? 'Fully Paid' :
                                                     item.status === 'partial' ? 'Partial' : 'Pending'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="fic-header-right">
                                        {!item.is_adjustment && (
                                            <>
                                                <div className="fic-amount-col">
                                                    <span className="fic-amount-label">Fee</span>
                                                    <span className="fic-amount-value">{formatCurrency(item.fee_amount)}</span>
                                                </div>
                                                <div className="fic-amount-col">
                                                    <span className="fic-amount-label">Paid</span>
                                                    <span className="fic-amount-value green">{formatCurrency(item.total_paid)}</span>
                                                </div>
                                                <div className="fic-amount-col">
                                                    <span className="fic-amount-label">Left</span>
                                                    <span className={`fic-amount-value ${item.remaining > 0 ? 'red' : 'green'}`}>
                                                        {formatCurrency(item.remaining)}
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                        {item.is_adjustment && (
                                            <div className="fic-amount-col">
                                                <span className="fic-amount-label">Amount</span>
                                                <span className={`fic-amount-value ${item.total_paid < 0 ? 'green' : 'orange'}`}>
                                                    {formatCurrency(item.total_paid)}
                                                </span>
                                            </div>
                                        )}
                                        <div className="fic-expand-icon">
                                            {expandedFee === idx ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                        </div>
                                    </div>
                                </div>

                                {/* Payment History (expandable) */}
                                {expandedFee === idx && (
                                    <div className="fic-body">
                                        {!item.is_adjustment && (
                                            <div className="fic-progress-section">
                                                <div className="fic-progress-bar-bg">
                                                    <div
                                                        className="fic-progress-bar-fill"
                                                        style={{ width: `${item.fee_amount > 0 ? Math.min((item.total_paid / item.fee_amount) * 100, 100) : 0}%` }}
                                                    />
                                                </div>
                                                <span className="fic-progress-pct">
                                                    {item.fee_amount > 0 ? Math.round((item.total_paid / item.fee_amount) * 100) : 0}% paid
                                                </span>
                                            </div>
                                        )}

                                        {item.payments.length > 0 ? (
                                            <div className="fic-payments">
                                                <h4>Payment History ({item.payments.length} installments)</h4>
                                                <table className="fic-payments-table">
                                                    <thead>
                                                        <tr>
                                                            <th>#</th>
                                                            <th>Reference</th>
                                                            <th>Amount</th>
                                                            <th>Channel</th>
                                                            <th>Gateway</th>
                                                            <th>Date</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {item.payments.map((p, pi) => (
                                                            <tr key={p.id}>
                                                                <td>{pi + 1}</td>
                                                                <td className="tx-ref-cell">{p.reference ? p.reference.substring(0, 16) + '...' : '—'}</td>
                                                                <td className="tx-amount-cell">{formatCurrency(p.amount)}</td>
                                                                <td>
                                                                    <span className={`channel-tag ${p.channel === 'manual' ? 'manual' : 'online'}`}>
                                                                        {p.channel}
                                                                    </span>
                                                                </td>
                                                                <td className="tx-gateway-cell">{p.gateway}</td>
                                                                <td className="tx-date-cell">{p.paid_at}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            !item.is_adjustment && (
                                                <div className="fic-no-payments">
                                                    <Clock size={16} />
                                                    No payments recorded yet for this fee
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : studentDetail ? (
                    <div className="empty-installments">
                        <CreditCard size={48} />
                        <h3>No fees found</h3>
                        <p>No fees configured for this student in the selected session/term.</p>
                    </div>
                ) : (
                    <div className="empty-installments">
                        <Search size={48} />
                        <h3>Select a Student</h3>
                        <p>Search for a student above to view their installment payment breakdown.</p>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default InstallmentTracker;
