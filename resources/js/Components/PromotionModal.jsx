import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { X, AlertCircle } from 'lucide-react';
import './PromotionModal.css';

const PromotionModal = ({ show, onClose, selectedStudentIds = [], classes = [] }) => {
    if (!show) return null;

    const { data, setData, post, processing, errors, reset } = useForm({
        student_ids: selectedStudentIds,
        target_class_id: '',
        target_session_id: '',
        retain_debt: true
    });

    React.useEffect(() => {
        if (show) {
            setData('student_ids', selectedStudentIds);
        }
    }, [show, selectedStudentIds]);

    const isBulk = selectedStudentIds.length > 1;

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/students/promote', {
            onSuccess: () => {
                onClose();
                // Optionally show toast or success message
            }
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content promotion-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="header-title">
                        <h3>Promote Students</h3>
                        <p>Move {selectedStudentIds.length} selected student{isBulk ? 's' : ''} to a new class</p>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="warning-banner">
                    <AlertCircle size={18} />
                    <span>This action will update the class for all selected students.</span>
                </div>

                <form onSubmit={handleSubmit} className="promotion-form">
                    <div className="form-group">
                        <label>Target Class</label>
                        <select
                            value={data.target_class_id}
                            onChange={e => setData('target_class_id', e.target.value)}
                            required
                        >
                            <option value="">Select Class</option>
                            {classes.map(cls => (
                                <option key={cls.id} value={cls.id}>{cls.name}</option>
                            ))}
                        </select>
                        {errors.target_class_id && <span className="error-msg">{errors.target_class_id}</span>}
                    </div>

                    <div className="form-footer-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-promote" disabled={processing}>
                            {processing ? 'Promoting...' : 'Promote Students'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PromotionModal;
