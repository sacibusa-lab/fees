import React, { useState } from 'react';
import { X, Calendar, CreditCard, Search, Loader2 } from 'lucide-react';
import axios from 'axios';
import './VerifyPaymentModal.css';

const VerifyPaymentModal = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const handleCheck = async () => {
        if (!query.trim()) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await axios.get(`/api/payments/verify?query=${query}`);
            setResult(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Transaction not found. Please check the ID and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="verify-modal-overlay" onClick={onClose}>
            <div className="verify-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>
                    <X size={24} />
                </button>

                <h2 className="modal-title">Check Payment Status</h2>

                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Reg Number or Payer ID"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleCheck()}
                    />
                </div>

                {error && <div className="error-message">{error}</div>}

                {loading && (
                    <div className="loading-state">
                        <Loader2 className="animate-spin" size={32} />
                        <span>Checking status...</span>
                    </div>
                )}

                {result && (
                    <div className="result-container">
                        <h3 className="student-name">{result.student_name}</h3>

                        <div className="result-card">
                            <div className="result-header">
                                <span className="fee-title">{result.fee_title}</span>
                                <span className="session-info">{result.session} - {result.term}</span>
                            </div>

                            <div className="ref-id">{result.reference}</div>

                            <div className="result-details">
                                <div className="detail-item">
                                    <Calendar size={16} />
                                    <span>{result.date}</span>
                                </div>
                                <div className="detail-item">
                                    <CreditCard size={16} />
                                    <span>{result.amount}</span>
                                </div>
                            </div>

                            <div className={`status-badge ${result.status.toLowerCase()}`}>
                                {result.status}
                            </div>
                        </div>
                    </div>
                )}

                <button
                    className="check-btn"
                    onClick={handleCheck}
                    disabled={loading || !query.trim()}
                >
                    {loading ? 'Checking...' : 'Check'}
                </button>
            </div>
        </div>
    );
};

export default VerifyPaymentModal;
