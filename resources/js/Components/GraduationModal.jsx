import React from 'react';
import { useForm } from '@inertiajs/react';

const GraduationModal = ({ show, onClose, selectedStudentIds = [] }) => {
    if (!show) return null;

    const { post, processing } = useForm({
        student_ids: selectedStudentIds,
    });

    const isBulk = selectedStudentIds.length > 1;

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/students/bulk-graduate', {
            onSuccess: () => {
                onClose();
            }
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose} style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{
                background: 'white', padding: '40px', borderRadius: '32px',
                width: '90%', maxWidth: '500px', textAlign: 'center',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
            }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '1.5rem', fontWeight: '800' }}>
                    You are about to graduate {selectedStudentIds.length} selected student{isBulk ? 's' : ''}
                </h3>
                <p style={{ margin: '0 0 32px', color: '#666', fontSize: '1.1rem', lineHeight: '1.5' }}>
                    They will no longer appear in the list of students required to pay fees
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '16px', borderRadius: '12px', border: '1px solid #000',
                            background: 'white', color: '#000', fontSize: '1.1rem',
                            fontWeight: '600', cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={processing}
                        style={{
                            padding: '16px', borderRadius: '12px', border: 'none',
                            background: '#D1127B', color: 'white', fontSize: '1.1rem',
                            fontWeight: '600', cursor: 'pointer'
                        }}
                    >
                        {processing ? 'Processing...' : 'Proceed'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GraduationModal;
