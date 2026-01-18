import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { X } from 'lucide-react';
import './PromotionModal.css'; // Reusing base modal styles
import './AddStudentModal.css'; // Reusing form styles

const EditStudentModal = ({ show, onClose, student, classes = [], subClasses = [] }) => {
    if (!show || !student) return null;

    const { data, setData, put, processing, errors, reset } = useForm({
        name: '',
        gender: '',
        class_id: '',
        sub_class_id: '',
    });

    useEffect(() => {
        if (student) {
            setData({
                name: student.name || '',
                gender: student.gender || '',
                class_id: student.class_id || '',
                sub_class_id: student.sub_class_id || '',
            });
        }
    }, [student]);

    // Use all sub-classes globally as per user request
    const filteredSubClasses = subClasses;

    const handleSubmit = (e) => {
        e.preventDefault();
        put(`/students/${student.id}`, {
            onSuccess: () => {
                onClose();
                reset();
            }
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content add-student-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="header-title">
                        <h3>Edit Student</h3>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="student-form">
                    <div className="form-group">
                        <label>Full Name</label>
                        <input
                            type="text"
                            placeholder="Student full name"
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            className={errors.name ? 'error-input' : ''}
                        />
                        {errors.name && <span className="error-msg">{errors.name}</span>}
                    </div>

                    <div className="form-group">
                        <label>Gender</label>
                        <select
                            value={data.gender}
                            onChange={e => setData('gender', e.target.value)}
                            className={errors.gender ? 'error-input' : ''}
                        >
                            <option value="">Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                        {errors.gender && <span className="error-msg">{errors.gender}</span>}
                    </div>

                    <div className="form-group">
                        <label>Class</label>
                        <select
                            value={data.class_id}
                            onChange={e => {
                                setData(arg => ({
                                    ...arg,
                                    class_id: e.target.value,
                                    sub_class_id: '' // Reset subclass on class change
                                }));
                            }}
                            className={errors.class_id ? 'error-input' : ''}
                        >
                            <option value="">--Select class--</option>
                            {classes.map(cls => (
                                <option key={cls.id} value={cls.id}>{cls.name}</option>
                            ))}
                        </select>
                        {errors.class_id && <span className="error-msg">{errors.class_id}</span>}
                    </div>

                    <div className="form-group">
                        <label>Subclass</label>
                        <select
                            value={data.sub_class_id}
                            onChange={e => setData('sub_class_id', e.target.value)}
                            className={errors.sub_class_id ? 'error-input' : ''}
                        >
                            <option value="">Select Subclass</option>
                            {filteredSubClasses.map(sc => (
                                <option key={sc.id} value={sc.id}>{sc.name}</option>
                            ))}
                        </select>
                        {errors.sub_class_id && <span className="error-msg">{errors.sub_class_id}</span>}
                    </div>

                    <div className="modal-footer-actions mt-6">
                        <button
                            type="submit"
                            className="btn-promote full-width"
                            disabled={processing}
                        >
                            {processing ? 'Saving Changes...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditStudentModal;
