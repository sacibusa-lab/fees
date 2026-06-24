import React from 'react';
import { useForm } from '@inertiajs/react';
import { X, Upload, FileText, AlertCircle } from 'lucide-react';
import './PromotionModal.css'; // Reusing modal styles for consistency

const ImportModal = ({ show, onClose }) => {
    if (!show) return null;

    const { data, setData, post, processing, errors, reset } = useForm({
        file: null,
    });

    const handleFileChange = (e) => {
        setData('file', e.target.files[0]);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/students/import', {
            onSuccess: () => {
                reset();
                onClose();
            },
            forceFormData: true,
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content promotion-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="header-title">
                        <h3>Import Students</h3>
                        <p>Upload a CSV file to bulk add students.</p>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="promotion-form">
                    <div className="file-upload-area">
                        <input
                            type="file"
                            id="csv-upload"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="hidden-file-input"
                        />
                        <label htmlFor="csv-upload" className="upload-label">
                            <div className="upload-icon-wrapper">
                                <Upload size={24} />
                            </div>
                            <span className="upload-text">
                                {data.file ? data.file.name : "Click to upload CSV file"}
                            </span>
                            <span className="upload-subtext">Max size: 2MB</span>
                        </label>
                        {errors.file && <div className="error-msg mt-2">{errors.file}</div>}
                    </div>

                    <div className="template-link">
                        <FileText size={16} />
                        <a href="/students/template" target="_blank" className="text-sm text-pink-600 hover:underline">
                            Download Template CSV
                        </a>
                    </div>

                    <div className="form-footer-actions mt-6">
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                        <button
                            type="submit"
                            className="btn-promote"
                            disabled={processing || !data.file}
                        >
                            {processing ? 'Importing...' : 'Import Students'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ImportModal;
