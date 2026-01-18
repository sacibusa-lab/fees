import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { X, Upload, FileText, AlertCircle, Check } from 'lucide-react';
import './PromotionModal.css'; // Reusing base modal styles
import './AddStudentModal.css'; // New styles for tabs and specific form inputs

const AddStudentModal = ({ show, onClose, classes = [], subClasses = [] }) => {
    if (!show) return null;

    const [activeTab, setActiveTab] = useState('single'); // 'single' or 'multiple'

    // Single Student Form
    const { data: singleData, setData: setSingleData, post: postSingle, processing: singleProcessing, errors: singleErrors, reset: resetSingle } = useForm({
        name: '',
        gender: '',
        class_id: '',
        sub_class_id: '',
        auto_reg: false,
        admission_number: '',
        phone: '',
        email: '',
    });

    // Multiple Student (CSV) Form
    const { data: multiData, setData: setMultiData, post: postMulti, processing: multiProcessing, errors: multiErrors, reset: resetMulti } = useForm({
        file: null,
        class_id: '',
        sub_class_id: '',
    });

    // Use all sub-classes globally
    const filteredSubClasses = subClasses;

    const handleSingleSubmit = (e) => {
        e.preventDefault();
        postSingle('/students', {
            onSuccess: () => {
                resetSingle();
                onClose();
            }
        });
    };

    const handleMultiSubmit = (e) => {
        e.preventDefault();
        postMulti('/students/import', {
            onSuccess: () => {
                resetMulti();
                onClose();
            },
            forceFormData: true,
        });
    };

    const handleFileChange = (e) => {
        setMultiData('file', e.target.files[0]);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content add-student-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="header-title">
                        <h3>Add Student</h3>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'single' ? 'active' : ''}`}
                        onClick={() => setActiveTab('single')}
                    >
                        Single Student
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'multiple' ? 'active' : ''}`}
                        onClick={() => setActiveTab('multiple')}
                    >
                        Multiple Students (CSV)
                    </button>
                </div>

                {activeTab === 'single' ? (
                    <form onSubmit={handleSingleSubmit} className="student-form">
                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                placeholder="Student full name"
                                value={singleData.name}
                                onChange={e => setSingleData('name', e.target.value)}
                                className={singleErrors.name ? 'error-input' : ''}
                            />
                            {singleErrors.name && <span className="error-msg">{singleErrors.name}</span>}
                        </div>

                        <div className="form-group">
                            <label>Gender</label>
                            <input
                                type="text"
                                placeholder="Gender"
                                value={singleData.gender}
                                onChange={e => setSingleData('gender', e.target.value)}
                                // Ideally a select but the request implies text input or specific format
                                // Let's use select for better UX
                                className={singleErrors.gender ? 'hidden' : 'hidden'}
                            />
                            <select
                                value={singleData.gender}
                                onChange={e => setSingleData('gender', e.target.value)}
                                className={singleErrors.gender ? 'error-input' : ''}
                            >
                                <option value="">Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                            {singleErrors.gender && <span className="error-msg">{singleErrors.gender}</span>}
                        </div>

                        <div className="form-group">
                            <label>Class</label>
                            <select
                                value={singleData.class_id}
                                onChange={e => setSingleData('class_id', e.target.value)}
                                className={singleErrors.class_id ? 'error-input' : ''}
                            >
                                <option value="">--Select class--</option>
                                {classes.map(cls => (
                                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                                ))}
                            </select>
                            {singleErrors.class_id && <span className="error-msg">{singleErrors.class_id}</span>}
                        </div>

                        <div className="form-group">
                            <label>Subclass</label>
                            <select
                                value={singleData.sub_class_id}
                                onChange={e => setSingleData('sub_class_id', e.target.value)}
                                className={singleErrors.sub_class_id ? 'error-input' : ''}
                            >
                                <option value="">Select Subclass</option>
                                {filteredSubClasses.map(sc => (
                                    <option key={sc.id} value={sc.id}>{sc.name}</option>
                                ))}
                            </select>
                            {singleErrors.sub_class_id && <span className="error-msg">{singleErrors.sub_class_id}</span>}
                        </div>

                        <div className="form-group">
                            <label>Phone Number</label>
                            <input
                                type="text"
                                placeholder="Student or Parent phone"
                                value={singleData.phone}
                                onChange={e => setSingleData('phone', e.target.value)}
                                className={singleErrors.phone ? 'error-input' : ''}
                            />
                            {singleErrors.phone && <span className="error-msg">{singleErrors.phone}</span>}
                        </div>

                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                placeholder="For virtual account generation"
                                value={singleData.email}
                                onChange={e => setSingleData('email', e.target.value)}
                                className={singleErrors.email ? 'error-input' : ''}
                            />
                            {singleErrors.email && <span className="error-msg">{singleErrors.email}</span>}
                        </div>

                        <div className="form-checkbox-group">
                            <label className="checkbox-container">
                                <input
                                    type="checkbox"
                                    checked={singleData.auto_reg}
                                    onChange={e => setSingleData('auto_reg', e.target.checked)}
                                />
                                <span className="checkmark"></span>
                                Auto generate reg number ?
                            </label>
                        </div>

                        {!singleData.auto_reg && (
                            <div className="form-group">
                                <label>Reg Number</label>
                                <input
                                    type="text"
                                    placeholder="Enter Reg Number"
                                    value={singleData.admission_number}
                                    onChange={e => setSingleData('admission_number', e.target.value)}
                                    className={singleErrors.admission_number ? 'error-input' : ''}
                                />
                                {singleErrors.admission_number && <span className="error-msg">{singleErrors.admission_number}</span>}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn-promote full-width mt-6"
                            disabled={singleProcessing}
                        >
                            {singleProcessing ? 'Saving...' : 'Save'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleMultiSubmit} className="student-form">
                        <div className="download-template-area">
                            <a href="/students/template" target="_blank" className="download-link">
                                Download Sample File Here. Do not change the headers !
                            </a>                        </div>

                        <div className="file-upload-area">
                            <input
                                type="file"
                                id="csv-upload-tab"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="hidden-file-input"
                            />
                            <label htmlFor="csv-upload-tab" className="upload-label">
                                <div className="upload-icon-wrapper">
                                    <Upload size={32} />
                                </div>
                                <span className="upload-text">
                                    Drop your students file here or <span className="highlight-text">Browse</span>
                                </span>
                                <span className="upload-subtext">Supports: CSV, XLS, XLSX</span>
                                {multiData.file && <div className="file-name-tag">{multiData.file.name}</div>}
                            </label>
                            {multiErrors.file && <div className="error-msg mt-2">{multiErrors.file}</div>}
                        </div>

                        <div className="form-group">
                            <label>Class</label>
                            <select
                                value={multiData.class_id}
                                onChange={e => setMultiData('class_id', e.target.value)}
                                className={multiErrors.class_id ? 'error-input' : ''}
                            >
                                <option value="">--Select class--</option>
                                {classes.map(cls => (
                                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                                ))}
                            </select>
                            {multiErrors.class_id && <span className="error-msg">{multiErrors.class_id}</span>}
                        </div>

                        <div className="form-group">
                            <label>Subclass</label>
                            <select
                                value={multiData.sub_class_id}
                                onChange={e => setMultiData('sub_class_id', e.target.value)}
                                className={multiErrors.sub_class_id ? 'error-input' : ''}
                            >
                                <option value="">Select Subclass</option>
                                {filteredSubClasses.map(sc => (
                                    <option key={sc.id} value={sc.id}>{sc.name}</option>
                                ))}
                            </select>
                            {multiErrors.sub_class_id && <span className="error-msg">{multiErrors.sub_class_id}</span>}
                        </div>

                        <button
                            type="submit"
                            className="btn-promote full-width"
                            disabled={multiProcessing || !multiData.file}
                        >
                            {multiProcessing ? 'Saving...' : 'Save'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AddStudentModal;
