import React from 'react';
import { X, Check, Edit2 } from 'lucide-react';
import './PromotionModal.css'; // Reusing base modal styles
import './StudentDetailsModal.css'; // Specific styles

const StudentDetailsModal = ({ show, onClose, student }) => {
    if (!show || !student) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content student-details-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header no-border">
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="details-scroll-content">
                    {/* Header Profile Section */}
                    <div className="profile-header-section">
                        <div className="profile-avatar-wrapper">
                            <div className="large-avatar">
                                {student.name.charAt(0)}
                            </div>
                            <div className="verify-badge">
                                <Check size={12} color="white" />
                            </div>
                        </div>
                        <div className="profile-identity">
                            <h3>{student.name}</h3>
                            <span className="reg-no">{student.admission_number || 'No Reg No'}</span>
                        </div>
                    </div>

                    {/* Basic Info Table */}
                    <div className="info-grid-section">
                        <div className="info-row">
                            <span className="info-label">Gender</span>
                            <span className="info-value">{student.gender}</span>
                            <span className="info-label">Class</span>
                            <span className="info-value">{student.class_name}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">School Name:</span>
                            <span className="info-value full-width">{student.school_name}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Added On</span>
                            <span className="info-value full-width">{student.added_on}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Session Added</span>
                            <span className="info-value full-width">{student.session_added}</span>
                        </div>
                    </div>

                    {/* Academic History */}
                    <div className="detail-section">
                        <div className="section-header">
                            <h4>Academic History</h4>
                            <button className="edit-icon-btn">
                                <Edit2 size={12} />
                            </button>
                        </div>
                        <div className="history-cards">
                            {student.academic_history && student.academic_history.length > 0 ? (
                                student.academic_history.map((history, idx) => (
                                    <div key={idx} className="history-card">
                                        <div className="history-title">Class: {history.class}</div>
                                        <div className="history-session">Session {history.session}</div>
                                    </div>
                                ))
                            ) : (
                                <div className="history-card">
                                    <div className="history-title">Current Class</div>
                                    <div className="history-session">{student.class_name}</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Account Numbers */}
                    <div className="detail-section">
                        <h4>Account Numbers</h4>
                        <div className="accounts-list">
                            {student.account_numbers && student.account_numbers.length > 0 ? (
                                student.account_numbers.map((acc, idx) => (
                                    <div key={idx} className="account-card">
                                        <div className="acc-label">Account {idx + 1}</div>
                                        <div className="acc-row">Account Number: <span className="acc-val">{acc.number}</span></div>
                                        <div className="acc-row">Account Name: <span className="acc-val">{acc.name}</span></div>
                                        <div className="acc-row">Account Bank: <span className="acc-val">{acc.bank}</span></div>
                                    </div>
                                ))
                            ) : (
                                <div className="account-card">
                                    <div className="acc-label">No Account Assigned</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDetailsModal;
