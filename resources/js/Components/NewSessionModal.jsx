import React, { useState } from 'react';
import { X } from 'lucide-react';
import './NewSessionModal.css';

const NewSessionModal = ({ isOpen, onClose, onSave }) => {
    if (!isOpen) return null;

    const [sessionYear, setSessionYear] = useState('2026/2027');

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
                        <input
                            type="text"
                            className="session-input"
                            value={sessionYear}
                            onChange={(e) => setSessionYear(e.target.value)}
                            placeholder="YYYY/YYYY"
                        />
                    </div>

                    <button className="save-session-btn" onClick={() => onSave(sessionYear)}>
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NewSessionModal;
