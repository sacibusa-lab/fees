import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { X } from 'lucide-react';
import './CustomizeClassModal.css'; // We'll create this CSS next

const CustomizeClassModal = ({ isOpen, onClose, classData }) => {
    const { data, setData, put, processing, errors, reset } = useForm({
        name: '',
    });

    useEffect(() => {
        if (classData) {
            setData({
                name: classData.name
            });
        }
    }, [classData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        put(`/students/classes/${classData.id}`, {
            onSuccess: () => {
                onClose();
                reset();
            }
        });
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Customize Class</h3>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <input
                                type="text"
                                className="modal-input"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                placeholder="Enter class name"
                            />
                            {errors.name && <div className="text-red-500 text-sm mt-1">{errors.name}</div>}
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="submit" className="save-btn" disabled={processing}>
                            {processing ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CustomizeClassModal;
