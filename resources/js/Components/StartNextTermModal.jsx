import React, { useState } from 'react';
import './StartNextTermModal.css';
import { CheckCircle2, X } from 'lucide-react';

const StartNextTermModal = ({ isOpen, onClose, currentTerm, onNext }) => {
    if (!isOpen) return null;

    const [paymentAction, setPaymentAction] = useState('keep'); // 'waive' or 'keep'

    return (
        <div className="term-modal-overlay" onClick={onClose}>
            <div className="term-modal-content" onClick={e => e.stopPropagation()}>
                <div className="term-modal-header">
                    <h3>Start Next Term</h3>
                    {/* Optional Close Icon if needed, but design has Close button below */}
                </div>

                <div className="term-modal-body">
                    <div className="term-info-row">
                        <div className="term-check-icon">
                            <CheckCircle2 size={20} color="#10B981" />
                        </div>
                        <p className="term-info-text">
                            Starting a new term advances the academic session accordingly.
                        </p>
                    </div>

                    <p className="term-question">
                        How do you want to handle outstanding payments in the current term ( {currentTerm || '1st Term'} )
                    </p>

                    <div className="term-radio-group">
                        <label className="term-radio-label">
                            <input
                                type="radio"
                                name="paymentAction"
                                value="waive"
                                checked={paymentAction === 'waive'}
                                onChange={() => setPaymentAction('waive')}
                            />
                            <span className="radio-text">Waive All Outstanding Payments</span>
                        </label>

                        <label className="term-radio-label">
                            <input
                                type="radio"
                                name="paymentAction"
                                value="keep"
                                checked={paymentAction === 'keep'}
                                onChange={() => setPaymentAction('keep')}
                            />
                            <span className="radio-text">Keep All Outstanding Payments</span>
                        </label>
                    </div>
                </div>

                <div className="term-modal-footer">
                    <button className="term-next-btn" onClick={() => onNext(paymentAction)}>
                        Next
                    </button>
                    <button className="term-close-btn" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StartNextTermModal;
