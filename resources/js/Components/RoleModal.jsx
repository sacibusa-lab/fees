import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { X, Save } from 'lucide-react';
import './RoleModal.css';

const RoleModal = ({ isOpen, onClose, role = null }) => {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        description: '',
    });

    useEffect(() => {
        if (role) {
            setData({
                name: role.name,
                description: role.description || '',
            });
        } else {
            reset();
        }
    }, [role, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (role) {
            put(`/admin-care/roles/${role.id}`, {
                onSuccess: () => {
                    onClose();
                    reset();
                },
            });
        } else {
            post('/admin-care/roles', {
                onSuccess: () => {
                    onClose();
                    reset();
                },
            });
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{role ? 'Edit Role' : 'Add New Role'}</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label>Role Name</label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            placeholder="e.g. Super Admin"
                            className={`form-input ${errors.name ? 'error' : ''}`}
                        />
                        {errors.name && <span className="error-text">{errors.name}</span>}
                    </div>

                    <div className="form-group">
                        <label>Description (Optional)</label>
                        <textarea
                            value={data.description}
                            onChange={e => setData('description', e.target.value)}
                            placeholder="Brief description of the role..."
                            className="form-textarea"
                            rows={3}
                        />
                        {errors.description && <span className="error-text">{errors.description}</span>}
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-save" disabled={processing}>
                            <Save size={18} />
                            {processing ? 'Saving...' : 'Save Role'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RoleModal;
