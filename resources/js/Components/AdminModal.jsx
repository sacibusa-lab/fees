import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { X, Save } from 'lucide-react';
import './RoleModal.css'; // Reusing generic modal styles

const AdminModal = ({ isOpen, onClose, roles }) => {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        phone: '',
        role_id: '',
        pin: '',
    });

    useEffect(() => {
        if (!isOpen) reset();
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/admin-care/all-admins', {
            onSuccess: () => {
                onClose();
                reset();
            },
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Add New Admin</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label>Full Name</label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            className={`form-input ${errors.name ? 'error' : ''}`}
                            placeholder="Enter full name"
                        />
                        {errors.name && <span className="error-text">{errors.name}</span>}
                    </div>

                    <div className="form-group">
                        <label>Phone Number</label>
                        <input
                            type="text"
                            value={data.phone}
                            onChange={e => setData('phone', e.target.value)}
                            className={`form-input ${errors.phone ? 'error' : ''}`}
                            placeholder="Enter phone number"
                        />
                        {errors.phone && <span className="error-text">{errors.phone}</span>}
                    </div>

                    <div className="form-group">
                        <label>Role</label>
                        <select
                            value={data.role_id}
                            onChange={e => setData('role_id', e.target.value)}
                            className={`form-input ${errors.role_id ? 'error' : ''}`}
                        >
                            <option value="">Select Role</option>
                            {roles.map(role => (
                                <option key={role.id} value={role.id}>{role.name}</option>
                            ))}
                        </select>
                        {errors.role_id && <span className="error-text">{errors.role_id}</span>}
                    </div>

                    <div className="form-group">
                        <label>Login PIN</label>
                        <input
                            type="password"
                            value={data.pin}
                            onChange={e => setData('pin', e.target.value)}
                            className={`form-input ${errors.pin ? 'error' : ''}`}
                            placeholder="Create 4-6 digit numeric PIN"
                            maxLength={6}
                        />
                        {errors.pin && <span className="error-text">{errors.pin}</span>}
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-save" disabled={processing}>
                            <Save size={18} />
                            {processing ? 'Saving...' : 'Create Admin'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminModal;
