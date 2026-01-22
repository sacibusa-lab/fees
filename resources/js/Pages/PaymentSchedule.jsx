import React, { useState } from 'react';
import Layout from '../Components/Layout';
import { Head } from '@inertiajs/react';
import { Search, Download, Printer, FileText, Loader2, Building2, User as UserIcon } from 'lucide-react';
import axios from 'axios';
import './PaymentSchedule.css';

const PaymentSchedule = ({ sessions = [], classes = [], subClasses = [], fees = [] }) => {
    const [selectedSession, setSelectedSession] = useState('');
    const [selectedTerm, setSelectedTerm] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSubClass, setSelectedSubClass] = useState('');
    const [selectedFeeTitle, setSelectedFeeTitle] = useState('all');
    const [isSearching, setIsSearching] = useState(false);
    const [previewData, setPreviewData] = useState(null);

    // Use global subclasses instead of class-specific ones
    const availableSubClasses = subClasses;

    const handleSearch = async () => {
        if (!selectedSession || !selectedTerm) {
            alert('Please select both Academic Year and Term');
            return;
        }

        setIsSearching(true);
        try {
            const response = await axios.get('/payments/schedule/preview', {
                params: {
                    session_id: selectedSession,
                    term: selectedTerm,
                    class_id: selectedClass,
                    sub_class_id: selectedSubClass,
                    fee_title: selectedFeeTitle
                }
            });
            setPreviewData(response.data);
        } catch (error) {
            console.error('Error fetching preview:', error);
            alert('Failed to fetch schedule preview. Please try again.');
        } finally {
            setIsSearching(false);
        }
    };

    const [selectedStudentIds, setSelectedStudentIds] = useState([]);
    const [showModifyModal, setShowModifyModal] = useState(false);
    const [modifyData, setModifyData] = useState({ amount: '', type: 'subtract', description: '' });

    // Payment Modal State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentData, setPaymentData] = useState({ mode: 'full', amount: '', description: '' });

    const [isProcessingBulk, setIsProcessingBulk] = useState(false);

    // Filter students by status if we had that data in preview
    // For now, let's just use the previewData as is.

    const toggleStudentSelection = (studentId) => {
        const id = Number(studentId);
        setSelectedStudentIds(prev =>
            prev.includes(id)
                ? prev.filter(v => v !== id)
                : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedStudentIds.length === previewData.notices.length) {
            setSelectedStudentIds([]);
        } else {
            setSelectedStudentIds(previewData.notices.map(n => Number(n.student.id)));
        }
    };

    const handleBulkModify = async () => {
        if (!modifyData.amount) return;
        setIsProcessingBulk(true);
        try {
            await axios.post('/payments/schedule/bulk-modify', {
                student_ids: selectedStudentIds,
                amount: modifyData.amount,
                type: modifyData.type,
                description: modifyData.description,
                session_id: selectedSession,
                term: selectedTerm
            });
            setShowModifyModal(false);
            setModifyData({ amount: '', type: 'subtract', description: '' });
            setSelectedStudentIds([]);
            handleSearch(); // Refresh preview
            alert('Bulk amounts modified successfully');
        } catch (error) {
            console.error('Bulk modify error:', error);
            alert('Failed to modify amounts');
        } finally {
            setIsProcessingBulk(false);
        }
    };

    const handleBulkMarkPaid = () => {
        setShowPaymentModal(true);
        setPaymentData({ mode: 'full', amount: '', description: '' });
    };

    const submitBulkPayment = async () => {
        if (paymentData.mode === 'partial' && !paymentData.amount) return;

        setIsProcessingBulk(true);
        try {
            await axios.post('/payments/schedule/bulk-mark-paid', {
                student_ids: selectedStudentIds,
                session_id: selectedSession,
                term: selectedTerm,
                fee_title: selectedFeeTitle,
                payment_mode: paymentData.mode,
                amount: paymentData.amount,
                description: paymentData.description
            });
            setShowPaymentModal(false);
            setSelectedStudentIds([]);
            handleSearch(); // Refresh preview
            alert('Payments recorded successfully');
        } catch (error) {
            console.error('Bulk payment error:', error);
            alert('Failed to record payments');
        } finally {
            setIsProcessingBulk(false);
        }
    };

    const handleDownloadPdf = () => {
        if (!selectedSession || !selectedTerm) return;
        let url = `/payments/schedule/download?session_id=${selectedSession}&term=${selectedTerm}`;
        if (selectedClass) url += `&class_id=${selectedClass}`;
        if (selectedSubClass) url += `&sub_class_id=${selectedSubClass}`;
        url += `&fee_title=${selectedFeeTitle}`;
        window.open(url, '_blank');
    };

    const handleExport = (status = 'all') => {
        if (!selectedSession || !selectedTerm) return;
        let url = `/payments/schedule/export?session_id=${selectedSession}&term=${selectedTerm}&status=${status}`;
        if (selectedClass) url += `&class_id=${selectedClass}`;
        if (selectedSubClass) url += `&sub_class_id=${selectedSubClass}`;
        url += `&fee_title=${selectedFeeTitle}`;
        window.open(url, '_blank');
    };

    return (
        <Layout>
            <Head title="Payment Schedule" />

            <div className="payment-schedule-container">
                <div className="payment-schedule-header">
                    <h1 className="page-heading">Payment Schedule</h1>
                    <div className="header-actions">
                        {previewData && (
                            <div className="export-dropdown">
                                <button className="export-main-btn">
                                    <Download size={18} />
                                    Export List
                                </button>
                                <div className="export-menu">
                                    <button onClick={() => handleExport('all')}>All Students</button>
                                    <button onClick={() => handleExport('paid')}>Paid Only</button>
                                    <button onClick={() => handleExport('pending')}>Pending Only</button>
                                    <button onClick={() => handleExport('partial')}>Part Payment</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="schedule-filter-card card">
                    <div className="filter-row">
                        <div className="filter-group">
                            <label>Academic Year <span className="required">*</span></label>
                            <select
                                value={selectedSession}
                                onChange={(e) => {
                                    setSelectedSession(e.target.value);
                                    setPreviewData(null);
                                }}
                                className="schedule-select"
                            >
                                <option value="">Select Session</option>
                                {sessions.map(s => (
                                    <option key={s.id} value={s.id}>{s.name || s.year}</option>
                                ))}
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>Term <span className="required">*</span></label>
                            <select
                                value={selectedTerm}
                                onChange={(e) => {
                                    setSelectedTerm(e.target.value);
                                    setPreviewData(null);
                                }}
                                className="schedule-select"
                            >
                                <option value="">Select Term</option>
                                <option value="1st Term">1st Term</option>
                                <option value="2nd Term">2nd Term</option>
                                <option value="3rd Term">3rd Term</option>
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>Class</label>
                            <select
                                value={selectedClass}
                                onChange={(e) => {
                                    setSelectedClass(e.target.value);
                                    setSelectedSubClass('');
                                    setPreviewData(null);
                                }}
                                className="schedule-select"
                            >
                                <option value="">All Classes</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>Subclass</label>
                            <select
                                value={selectedSubClass}
                                onChange={(e) => {
                                    setSelectedSubClass(e.target.value);
                                    setPreviewData(null);
                                }}
                                className="schedule-select"
                                disabled={!selectedClass}
                            >
                                <option value="">All Subclasses</option>
                                {availableSubClasses.filter(sc =>
                                    !selectedClass ||
                                    sc.class_id == selectedClass ||
                                    !sc.class_id
                                ).map(sc => (
                                    <option key={sc.id} value={sc.id}>{sc.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>Payment Type</label>
                            <select
                                value={selectedFeeTitle}
                                onChange={(e) => {
                                    setSelectedFeeTitle(e.target.value);
                                    setPreviewData(null);
                                }}
                                className="schedule-select"
                            >
                                <option value="all">All Payments</option>
                                {fees.map(title => (
                                    <option key={title} value={title}>{title}</option>
                                ))}
                            </select>
                        </div>
                        <div className="filter-action">
                            <button
                                className="schedule-search-btn"
                                onClick={handleSearch}
                                disabled={isSearching}
                            >
                                {isSearching ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                            </button>
                        </div>
                    </div>
                </div>

                {isSearching && (
                    <div className="preview-loading">
                        <Loader2 className="animate-spin" size={48} color="var(--primary)" />
                        <p>Generating schedule preview...</p>
                    </div>
                )}

                {previewData && !isSearching && (
                    <div className="schedule-results">
                        <div className="selection-info-bar">
                            <div className="selection-stats">
                                <input
                                    type="checkbox"
                                    checked={selectedStudentIds.length === previewData.notices.length && previewData.notices.length > 0}
                                    onChange={toggleSelectAll}
                                    className="bulk-checkbox"
                                />
                                <span>{selectedStudentIds.length} students selected</span>
                            </div>
                            {selectedStudentIds.length > 0 && (
                                <div className="bulk-actions">
                                    <button className="bulk-modify-btn" onClick={() => setShowModifyModal(true)}>
                                        Modify Amount
                                    </button>
                                    <button className="bulk-paid-btn" onClick={handleBulkMarkPaid}>
                                        Mark as Paid
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="preview-grid">
                            {previewData.notices.map((notice, index) => (
                                <div
                                    className={`notice-preview-card ${selectedStudentIds.includes(Number(notice.student.id)) ? 'selected' : ''}`}
                                    key={index}
                                    onClick={() => toggleStudentSelection(notice.student.id)}
                                >
                                    <div className="selection-handler">
                                        <input
                                            type="checkbox"
                                            checked={selectedStudentIds.includes(Number(notice.student.id))}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                toggleStudentSelection(notice.student.id);
                                            }}
                                            className="student-checkbox"
                                        />
                                    </div>
                                    <div className="notice-card-header">
                                        <div className="institution-info">
                                            <div className="inst-logo">
                                                {previewData.institution.logo ? (
                                                    <img src={previewData.institution.logo} alt="Logo" />
                                                ) : (
                                                    <Building2 size={24} />
                                                )}
                                            </div>
                                            <div className="inst-details">
                                                <h3>{previewData.institution.name}</h3>
                                                <p>{previewData.term} School Fees</p>
                                            </div>
                                        </div>
                                        <div className="notice-badge">Payment Notice</div>
                                    </div>

                                    <div className="student-info-row">
                                        <div className="info-item">
                                            <label>Name</label>
                                            <span>{notice.student.name}</span>
                                        </div>
                                        <div className="info-item">
                                            <label>Reg No</label>
                                            <span>{notice.student.admission_number}</span>
                                        </div>
                                        <div className="info-item">
                                            <label>Class</label>
                                            <span>{notice.student.school_class?.name}</span>
                                        </div>
                                    </div>

                                    <div className="account-info-box">
                                        <div className="account-item">
                                            <label>Account Number</label>
                                            <span>{notice.student.virtual_account?.account_number || 'N/A'}</span>
                                        </div>
                                        <div className="account-item">
                                            <label>Bank Name</label>
                                            <span>{notice.student.virtual_account?.bank_name || 'N/A'}</span>
                                        </div>
                                    </div>

                                    <table className="preview-fees-table">
                                        <thead>
                                            <tr>
                                                <th>Fee Description</th>
                                                <th>Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {notice.fees.map((fee, fIdx) => (
                                                <tr key={fIdx} className={fee.is_adjustment ? 'fee-adjustment-row' : ''}>
                                                    <td>
                                                        {fee.title}
                                                        {fee.is_adjustment && <span className="adj-tag">Adj</span>}
                                                    </td>
                                                    <td className={fee.amount < 0 ? 'negative-amount' : ''}>
                                                        {fee.amount < 0 ? '-' : ''}₦{Math.abs(parseFloat(fee.amount)).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <th>Total Due</th>
                                                <th>₦{parseFloat(notice.total_due).toLocaleString()}</th>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            ))}
                        </div>

                        {showModifyModal && (
                            <div className="modal-overlay">
                                <div className="modal-content bulk-modify-modal">
                                    <h2>Modify Amount for {selectedStudentIds.length} Students</h2>
                                    <p className="modal-subtitle">Add extra charges or apply discounts in bulk.</p>

                                    <div className="form-group">
                                        <label>Action Type</label>
                                        <div className="type-toggle">
                                            <button
                                                className={modifyData.type === 'add' ? 'active add' : ''}
                                                onClick={() => setModifyData({ ...modifyData, type: 'add' })}
                                            >
                                                Add (Charge)
                                            </button>
                                            <button
                                                className={modifyData.type === 'subtract' ? 'active subtract' : ''}
                                                onClick={() => setModifyData({ ...modifyData, type: 'subtract' })}
                                            >
                                                Subtract (Discount)
                                            </button>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Amount (₦)</label>
                                        <input
                                            type="number"
                                            value={modifyData.amount}
                                            onChange={(e) => setModifyData({ ...modifyData, amount: e.target.value })}
                                            placeholder="Enter amount"
                                            className="modal-input"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Description (Optional)</label>
                                        <input
                                            type="text"
                                            value={modifyData.description}
                                            onChange={(e) => setModifyData({ ...modifyData, description: e.target.value })}
                                            placeholder="e.g. Bus Fee, Late Payment Discount"
                                            className="modal-input"
                                        />
                                    </div>

                                    <div className="modal-footer">
                                        <button className="cancel-btn" onClick={() => setShowModifyModal(false)}>Cancel</button>
                                        <button
                                            className="submit-btn"
                                            onClick={handleBulkModify}
                                            disabled={!modifyData.amount || isProcessingBulk}
                                        >
                                            {isProcessingBulk ? <Loader2 className="animate-spin" size={20} /> : 'Apply Adjustments'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showPaymentModal && (
                            <div className="modal-overlay">
                                <div className="modal-content bulk-modify-modal">
                                    <h2>Record Payment for {selectedStudentIds.length} Students</h2>
                                    <p className="modal-subtitle">Mark selected students as paid manually.</p>

                                    <div className="form-group">
                                        <label>Payment Mode</label>
                                        <div className="type-toggle">
                                            <button
                                                className={paymentData.mode === 'full' ? 'active add' : ''}
                                                onClick={() => setPaymentData({ ...paymentData, mode: 'full' })}
                                            >
                                                Full Payment
                                            </button>
                                            <button
                                                className={paymentData.mode === 'partial' ? 'active partial' : ''}
                                                onClick={() => setPaymentData({ ...paymentData, mode: 'partial' })}
                                            >
                                                Partial / Custom
                                            </button>
                                        </div>
                                    </div>

                                    {paymentData.mode === 'partial' && (
                                        <div className="form-group">
                                            <label>Amount to Pay (₦) <span className="required">*</span></label>
                                            <input
                                                type="number"
                                                value={paymentData.amount}
                                                onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                                                placeholder="Enter amount to record for EACH student"
                                                className="modal-input"
                                            />
                                            <p className="field-hint">This amount will be recorded for <strong>each</strong> selected student.</p>
                                        </div>
                                    )}

                                    <div className="form-group">
                                        <label>Description (Optional)</label>
                                        <input
                                            type="text"
                                            value={paymentData.description}
                                            onChange={(e) => setPaymentData({ ...paymentData, description: e.target.value })}
                                            placeholder="e.g. Cash Payment, Bank Transfer"
                                            className="modal-input"
                                        />
                                    </div>

                                    <div className="modal-footer">
                                        <button className="cancel-btn" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                                        <button
                                            className="submit-btn"
                                            onClick={submitBulkPayment}
                                            disabled={(paymentData.mode === 'partial' && !paymentData.amount) || isProcessingBulk}
                                        >
                                            {isProcessingBulk ? <Loader2 className="animate-spin" size={20} /> : 'Record Payments'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {previewData.notices.length === 0 && (
                            <div className="empty-results card">
                                <FileText size={48} color="var(--text-secondary)" />
                                <h3>No students found</h3>
                                <p>Try adjusting your filters to find students for this period.</p>
                            </div>
                        )}

                        {previewData.notices.length > 0 && (
                            <div className="schedule-footer-actions card">
                                <div className="actions-info">
                                    <h3>Ready to Export</h3>
                                    <p>{previewData.notices.length} payment notices generated for {previewData.session_name} - {previewData.term}</p>
                                </div>
                                <div className="actions-buttons">
                                    <button className="download-pdf-btn" onClick={handleDownloadPdf}>
                                        <FileText size={20} />
                                        Download PDF
                                    </button>
                                    <button className="print-btn" onClick={handleDownloadPdf}>
                                        <Printer size={20} />
                                        Print Notices
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {!previewData && !isSearching && (
                    <div className="payment-schedule-card card">
                        <div className="empty-state">
                            <div className="empty-icon">📅</div>
                            <h2>Generate Payment Notices</h2>
                            <p>Select an Academic Year and Term above to generate and download payment schedules for all students.</p>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default PaymentSchedule;
