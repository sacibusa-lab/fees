import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { X, Upload, ChevronRight, ChevronLeft, User, Phone } from 'lucide-react';
import './PromotionModal.css'; // Reusing base modal styles
import './AddStudentModal.css'; // New styles for tabs and specific form inputs

const AddStudentModal = ({ show, onClose, classes = [], subClasses = [] }) => {
    if (!show) return null;

    const [activeTab, setActiveTab] = useState('single'); // 'single' or 'multiple'
    const [step, setStep] = useState(1); // 1 = Student Info, 2 = Contact Details

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
        guardian_name: '',
        guardian_phone: '',
        address: '',
    });

    // Multiple Student (CSV) Form
    const { data: multiData, setData: setMultiData, post: postMulti, processing: multiProcessing, errors: multiErrors, reset: resetMulti } = useForm({
        file: null,
        class_id: '',
        sub_class_id: '',
    });

    // Use all sub-classes globally
    const filteredSubClasses = subClasses;

    const handleNext = () => {
        // Basic validation before proceeding
        if (!singleData.name || !singleData.gender || !singleData.class_id || !singleData.sub_class_id) return;
        if (!singleData.auto_reg && !singleData.admission_number) return;
        setStep(2);
    };

    const handleBack = () => {
        setStep(1);
    };

    const handleSingleSubmit = (e) => {
        e.preventDefault();
        postSingle('/students', {
            onSuccess: () => {
                resetSingle();
                setStep(1);
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

    const handleTabSwitch = (tab) => {
        setActiveTab(tab);
        setStep(1);
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
                        onClick={() => handleTabSwitch('single')}
                    >
                        Single Student
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'multiple' ? 'active' : ''}`}
                        onClick={() => handleTabSwitch('multiple')}
                    >
                        Multiple Students (CSV)
                    </button>
                </div>

                {activeTab === 'single' ? (
                    <form onSubmit={handleSingleSubmit} className="student-form">
                        {/* Step Indicator */}
                        <div className="step-indicator">
                            <div className={`step-item ${step === 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                                <div className="step-circle">
                                    {step > 1 ? <span className="step-check">&#10003;</span> : <User size={14} />}
                                </div>
                                <span className="step-label">Student Info</span>
                            </div>
                            <div className="step-line">
                                <div className={`step-line-fill ${step > 1 ? 'filled' : ''}`}></div>
                            </div>
                            <div className={`step-item ${step === 2 ? 'active' : ''}`}>
                                <div className="step-circle">
                                    <Phone size={14} />
                                </div>
                                <span className="step-label">Contact Details</span>
                            </div>
                        </div>

                        {/* Step 1: Student Info */}
                        {step === 1 && (
                            <div className="step-content">
                                <div className="form-group">
                                    <label>Full Name <span className="required">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="Student full name"
                                        value={singleData.name}
                                        onChange={e => setSingleData('name', e.target.value)}
                                        className={singleErrors.name ? 'error-input' : ''}
                                    />
                                    {singleErrors.name && <span className="error-msg">{singleErrors.name}</span>}
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Gender <span className="required">*</span></label>
                                        <select
                                            value={singleData.gender}
                                            onChange={e => setSingleData('gender', e.target.value)}
                                            className={singleErrors.gender ? 'error-input' : ''}
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </select>
                                        {singleErrors.gender && <span className="error-msg">{singleErrors.gender}</span>}
                                    </div>

                                    <div className="form-group">
                                        <label>Class <span className="required">*</span></label>
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
                                </div>

                                <div className="form-group">
                                    <label>Subclass <span className="required">*</span></label>
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
                                        <label>Reg Number <span className="required">*</span></label>
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

                                <div className="step-actions">
                                    <button
                                        type="button"
                                        className="btn-next"
                                        onClick={handleNext}
                                    >
                                        Next <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Contact Details */}
                        {step === 2 && (
                            <div className="step-content">
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input
                                        type="text"
                                        placeholder="Student phone number"
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

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Guardian Name</label>
                                        <input
                                            type="text"
                                            placeholder="Parent or guardian full name"
                                            value={singleData.guardian_name}
                                            onChange={e => setSingleData('guardian_name', e.target.value)}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Guardian Phone</label>
                                        <input
                                            type="tel"
                                            placeholder="Parent or guardian phone"
                                            value={singleData.guardian_phone}
                                            onChange={e => setSingleData('guardian_phone', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Address</label>
                                    <textarea
                                        placeholder="Residential address"
                                        value={singleData.address}
                                        onChange={e => setSingleData('address', e.target.value)}
                                        rows={2}
                                    />
                                </div>

                                <div className="step-actions">
                                    <button
                                        type="button"
                                        className="btn-back"
                                        onClick={handleBack}
                                    >
                                        <ChevronLeft size={18} /> Back
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-promote full-width"
                                        disabled={singleProcessing}
                                    >
                                        {singleProcessing ? 'Saving...' : 'Save Student'}
                                    </button>
                                </div>
                            </div>
                        )}
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
