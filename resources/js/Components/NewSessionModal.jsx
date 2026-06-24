import React, { useState } from 'react';
import { X } from 'lucide-react';
import './NewSessionModal.css';

const NewSessionModal = ({ isOpen, onClose, onSave }) => {
    if (!isOpen) return null;

    const [sessionYear, setSessionYear] = useState('2026/2027');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const handleSave = () => {
        onSave(sessionYear, startDate, endDate);
    };

    return (
        <div className="new-session-modal-overlay" onClick={onClose}>
            <div className="new-session-modal-content" onClick={e => e.stopPropagation()}>
                <div className="new-session-modal-close">
                    <button className="close-btn-circle" onClick={onClose}>
                        <X size={20} color="#EF4444" /> {/* Red X matching screenshot */}
                    </button>
                </div>

                <div className="new-session-modal-body">
                    <h2 className="modal-title">Next Session</h2>

                    <div className="form-group">
                        <label className="input-label">Session Year</label>
                        <input
                            type="text"
                            className="session-input"
                            value={sessionYear}
                            onChange={(e) => setSessionYear(e.target.value)}
                            placeholder="YYYY/YYYY"
                        />
                    </div>

                    <div className="form-group-row" style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="input-label" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Start Date</label>
                            <input
                                type="date"
                                className="session-input"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="input-label" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>End Date</label>
                            <input
                                type="date"
                                className="session-input"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <button className="save-session-btn" onClick={handleSave} style={{ marginTop: '24px' }}>
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NewSessionModal;
