import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowLeft, Search, Grid, List, Download, Calendar, UserCheck } from 'lucide-react';
import axios from 'axios';
import './PromotionModal.css';
import './ClassPaymentDetailModal.css';

const ClassPaymentDetailModal = ({ isOpen, onClose, classData, feeId }) => {
    console.log('ClassPaymentDetailModal Render:', { isOpen, classData, feeId });
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [subClassFilter, setSubClassFilter] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [metadata, setMetadata] = useState({ className: '', feeTitle: '' });

    useEffect(() => {
        if (isOpen && classData?.id && feeId) {
            fetchClassDetails();
        }
    }, [isOpen, classData, feeId]);

    const fetchClassDetails = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/payments/class-detail/${classData.id}?fee_id=${feeId}`);
            setStudents(response.data.students || []);
            setMetadata({
                className: response.data.class_name || '',
                feeTitle: response.data.fee_title || ''
            });
        } catch (error) {
            console.error('Error fetching class details:', error);
            setStudents([]);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const filteredStudents = students.filter(student => {
        const name = student.name || '';
        const regNo = student.reg_no || '';
        const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            regNo.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSubClass = subClassFilter ? student.sub_class === subClassFilter : true;
        return matchesSearch && matchesSubClass;
    });

    const subClasses = [...new Set(students.map(s => s.sub_class).filter(Boolean))];


    const modalContent = (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
            <div className="modal-content class-payment-detail-modal" onClick={e => e.stopPropagation()}>
                <div className="detail-modal-header">
                    <div className="header-top-row">
                        <h2 className="class-title">{metadata.className || classData?.title || 'Class Detail'}</h2>
                        {metadata.feeTitle && <span className="header-fee-badge">{metadata.feeTitle}</span>}
                    </div>
                    <div className="header-actions-row">
                        <button className="back-btn" onClick={onClose} title="Go Back">
                            <ArrowLeft size={20} />
                        </button>
                        <div className="main-actions-group">
                            <button className="action-outline-btn schedule">
                                <Calendar size={16} />
                                Schedule
                            </button>
                            <button className="action-outline-btn exemption">
                                <UserCheck size={16} />
                                Exemption
                            </button>
                            <button className="action-outline-btn export">
                                <Download size={16} />
                                Export
                            </button>
                            <button className="action-outline-btn bulk-modify">
                                Modify Bulk Amount
                            </button>
                        </div>
                    </div>
                </div>

                <div className="detail-modal-body">
                    <div className="modal-filters-row">
                        <select
                            className="modal-filter-select"
                            value={subClassFilter}
                            onChange={(e) => setSubClassFilter(e.target.value)}
                        >
                            <option value="">Filter by subclass</option>
                            {subClasses.map(sc => (
                                <option key={sc} value={sc}>{sc}</option>
                            ))}
                        </select>
                        <div className="modal-search-wrapper">
                            <input
                                type="text"
                                className="modal-search-input"
                                placeholder="Search by name or reg number"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="selection-info-bar">
                        <span className="selection-count">0 Selected</span>
                        <button className="switch-view-btn" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
                            <span>switch view</span>
                            <Grid size={18} />
                        </button>
                    </div>

                    {loading ? (
                        <div className="modal-loading">
                            <div className="spinner"></div>
                            <p>Loading student data...</p>
                        </div>
                    ) : (
                        <div className={`student-status-grid ${viewMode}`}>
                            {filteredStudents.map(student => (
                                viewMode === 'grid' ? (
                                    <div key={student.id} className="student-status-card">
                                        <div className="status-icon-wrapper">
                                            <svg
                                                viewBox="0 0 24 24"
                                                width="32"
                                                height="32"
                                                stroke="currentColor"
                                                strokeWidth="3"
                                                fill="none"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className={`status-icon ${student.status}`}
                                            >
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                <circle cx="12" cy="7" r="4"></circle>
                                            </svg>
                                        </div>
                                        <span className="card-student-name">{student.name}</span>
                                        <span className="card-reg-no">{student.reg_no}</span>
                                    </div>
                                ) : (
                                    <div key={student.id} className={`status-card-dense ${student.status || 'pending'}`}>
                                        <div className="dense-reg-no">{student.reg_no || 'N/A'}</div>
                                        <div className="dense-student-name">{student.name}</div>
                                        <div className="dense-info-row">
                                            <span className="label">Discount:</span>
                                            <span className="value">{student.discount || 'None'}</span>
                                        </div>
                                        <div className="dense-info-row">
                                            <span className="label">Status:</span>
                                            <span className="value capitalize">{student.status || 'Pending'}</span>
                                        </div>
                                        <div className="dense-info-row">
                                            <span className="label">Received:</span>
                                            <span className="value">₦{(student.received_amount || 0).toLocaleString()}</span>
                                        </div>
                                    </div>
                                )
                            ))}
                            {filteredStudents.length === 0 && (
                                <div className="no-results-msg" style={{ gridColumn: '1/-1', padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    No students found matching your filters.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="detail-modal-footer">
                    <button className="close-action-btn" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default ClassPaymentDetailModal;
