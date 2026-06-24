import React, { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react'; // Actually, we'll use useForm for submission, but for validation loop we might use axios or fetch
import axios from 'axios';
import { X, Info } from 'lucide-react';
import './AddSubAccountModal.css';

const AddSubAccountModal = ({ isOpen, onClose, banks = [] }) => {
    if (!isOpen) return null;

    const { data, setData, post, processing, reset, errors } = useForm({
        bank_name: '',
        bank_code: '',
        account_number: '',
        account_name: '',
        type: 'Sub Account'
    });

    const [isValidating, setIsValidating] = useState(false);
    const [resolvedName, setResolvedName] = useState(null);
    const [validationError, setValidationError] = useState(null);

    // Auto-validate when bank and account number (10 digits) are present
    useEffect(() => {
        if (data.bank_code && data.account_number.length === 10) {
            validateAccount();
        } else {
            setResolvedName(null);
            setValidationError(null);
        }
    }, [data.bank_code, data.account_number]);

    const validateAccount = async () => {
        setIsValidating(true);
        setValidationError(null);
        try {
            const response = await axios.post('/business/bank-accounts/validate', {
                bank_code: data.bank_code,
                account_number: data.account_number
            });

            if (response.data.status) {
                setResolvedName(response.data.account_name);
                setData('account_name', response.data.account_name);
            } else {
                setResolvedName(null);
                setValidationError('Could not resolve account details.');
            }
        } catch (error) {
            setResolvedName(null);
            setValidationError('Validation failed. Please check details.');
        } finally {
            setIsValidating(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!resolvedName) return; // Prevent submission if not validated

        post('/business/bank-accounts', {
            onSuccess: () => {
                reset();
                onClose();
            }
        });
    };

    const handleBankChange = (e) => {
        const selectedBankName = e.target.value;
        const bank = banks.find(b => b.name === selectedBankName);
        setData(values => ({
            ...values,
            bank_name: selectedBankName,
            bank_code: bank ? bank.code : ''
        }));
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-close-container">
                    <button className="modal-close-btn" onClick={onClose}>
                        <X size={20} color="#EF4444" />
                    </button>
                </div>

                <div className="modal-body">
                    <h2 className="modal-title">Add Sub Account</h2>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Bank</label>
                            <select
                                className="form-select"
                                value={data.bank_name}
                                onChange={handleBankChange}
                            >
                                <option value="">Select Bank</option>
                                {banks.map(bank => (
                                    <option key={bank.code} value={bank.name}>
                                        {bank.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Account Number</label>
                            <input
                                type="text"
                                className="form-input"
                                value={data.account_number}
                                onChange={e => setData('account_number', e.target.value)}
                                placeholder="10 digit bank account number"
                                maxLength={10}
                            />
                        </div>

                        {isValidating && (
                            <div className="validation-status validating">
                                Validating account details...
                            </div>
                        )}

                        {resolvedName && (
                            <div className="validation-success">
                                <div className="success-icon">
                                    <Info size={18} color="white" fill="#10B981" />
                                    {/* Using Info icon with fill to simulate the green circle-i look */}
                                </div>
                                <span className="account-name">{resolvedName}</span>
                            </div>
                        )}

                        {validationError && (
                            <div className="validation-error">
                                {validationError}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="save-btn"
                            disabled={!resolvedName || processing || isValidating}
                        >
                            {processing ? 'Saving...' : 'Save'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddSubAccountModal;
