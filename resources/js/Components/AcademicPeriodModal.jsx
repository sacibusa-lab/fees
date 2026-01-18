import React, { useState } from 'react';
import './AcademicPeriodModal.css';

const AcademicPeriodModal = ({ isOpen, onClose, sessions, currentSession, currentTerm, onApply }) => {
    if (!isOpen) return null;

    const [selectedSession, setSelectedSession] = useState(currentSession);
    const [selectedTerm, setSelectedTerm] = useState(currentTerm || '1st');

    // Derived from provided image: 1st, 2nd, 3rd
    const terms = ['1st', '2nd', '3rd'];

    const handleApply = () => {
        onApply(selectedSession, selectedTerm);
        onClose();
    };

    return (
        <div className="period-modal-overlay" onClick={onClose}>
            <div className="period-modal-content" onClick={e => e.stopPropagation()}>
                <div className="period-modal-header">
                    <h3>Select academic period</h3>
                </div>

                <div className="period-selection-container">
                    {/* Session Column */}
                    <div className="period-column">
                        {sessions.map(session => (
                            <button
                                key={session.id || session.name}
                                className={`period-option-btn ${selectedSession === session.name ? 'active' : ''}`}
                                onClick={() => setSelectedSession(session.name)}
                            >
                                {session.name}
                            </button>
                        ))}
                    </div>

                    {/* Term Column */}
                    <div className="period-column">
                        {terms.map(term => (
                            <button
                                key={term}
                                className={`period-option-btn ${selectedTerm === term ? 'active' : ''}`}
                                onClick={() => setSelectedTerm(term)}
                            >
                                {term}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="period-modal-footer">
                    <button className="period-dismiss-btn" onClick={onClose}>Dismiss</button>
                    <button className="period-apply-btn" onClick={handleApply}>Apply</button>
                </div>
            </div>
        </div>
    );
};

export default AcademicPeriodModal;
