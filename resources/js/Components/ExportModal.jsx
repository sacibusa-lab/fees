import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import './PromotionModal.css'; // Reuse base styles

const ExportModal = ({ show, onClose, onExport, hasActiveFilters }) => {
    if (!show) return null;

    const [exportType, setExportType] = useState(hasActiveFilters ? 'filtered' : 'all');

    const handleExport = () => {
        onExport(exportType);
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content promotion-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="header-title">
                        <h3>Export student records</h3>
                        <p>Which records do you want to export?</p>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="promotion-form">
                    <div className="form-group">
                        <label className="radio-option">
                            <input
                                type="radio"
                                name="exportType"
                                value="filtered"
                                checked={exportType === 'filtered'}
                                onChange={() => setExportType('filtered')}
                                disabled={!hasActiveFilters}
                            />
                            <div className="radio-content">
                                <span className={`radio-label ${!hasActiveFilters ? 'disabled' : ''}`}>With current filters</span>
                            </div>
                        </label>

                        <label className="radio-option mt-4">
                            <input
                                type="radio"
                                name="exportType"
                                value="all"
                                checked={exportType === 'all'}
                                onChange={() => setExportType('all')}
                            />
                            <div className="radio-content">
                                <span className="radio-label">All student records</span>
                            </div>
                        </label>
                    </div>

                    <div className="form-footer-actions">
                        <button type="button" className="btn-promote full-width" onClick={handleExport}>
                            Export
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExportModal;
