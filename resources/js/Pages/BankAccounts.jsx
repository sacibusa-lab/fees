import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import Layout from '../Components/Layout';
import { Plus, Building2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import './BankAccounts.css';

const BankAccounts = ({ accounts = [] }) => {
    const [showAddModal, setShowAddModal] = useState(false);

    const { data, setData, post, delete: destroy, processing, reset, errors } = useForm({
        bank_name: '',
        account_number: '',
        account_name: '',
        is_active: true
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/business/bank-accounts', {
            onSuccess: () => {
                setShowAddModal(false);
                reset();
            },
        });
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this bank account?')) {
            destroy(`/business/bank-accounts/${id}`);
        }
    };

    return (
        <Layout>
            <Head title="Bank Accounts" />
            <div className="bank-accounts">
                <div className="page-header">
                    <h1 className="page-title">Institution Bank Accounts</h1>
                    <button className="btn-add" onClick={() => setShowAddModal(true)}>
                        <Plus size={18} />
                        Add New Account
                    </button>
                </div>

                <div className="accounts-grid">
                    {accounts.map((account) => (
                        <div key={account.id} className="account-card card">
                            <div className="card-header">
                                <div className="bank-icon">
                                    <Building2 size={24} />
                                </div>
                                <div className="status-indicator">
                                    {account.is_active ? (
                                        <CheckCircle size={18} className="active" />
                                    ) : (
                                        <XCircle size={18} className="inactive" />
                                    )}
                                </div>
                            </div>
                            <div className="card-body">
                                <h3 className="bank-name">{account.bank_name}</h3>
                                <div className="account-number">{account.account_number}</div>
                                <div className="account-name">{account.account_name}</div>
                            </div>
                            <div className="card-footer">
                                <button
                                    className="btn-delete"
                                    onClick={() => handleDelete(account.id)}
                                    title="Delete Account"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {accounts.length === 0 && (
                        <div className="empty-state card">
                            <Building2 size={48} />
                            <h3>No Bank Accounts Found</h3>
                            <p>You haven't added any institutional bank accounts yet.</p>
                            <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                                Add First Account
                            </button>
                        </div>
                    )}
                </div>

                {/* Add Modal */}
                {showAddModal && (
                    <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Add Bank Account</h3>
                                <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
                            </div>

                            <form onSubmit={handleSubmit} className="bank-form">
                                <div className="form-group">
                                    <label>Bank Name *</label>
                                    <input
                                        type="text"
                                        value={data.bank_name}
                                        onChange={e => setData('bank_name', e.target.value)}
                                        placeholder="e.g., Access Bank, Zenith Bank"
                                        required
                                    />
                                    {errors.bank_name && <span className="error">{errors.bank_name}</span>}
                                </div>

                                <div className="form-group">
                                    <label>Account Number *</label>
                                    <input
                                        type="text"
                                        value={data.account_number}
                                        onChange={e => setData('account_number', e.target.value)}
                                        placeholder="10-digit account number"
                                        maxLength="10"
                                        required
                                    />
                                    {errors.account_number && <span className="error">{errors.account_number}</span>}
                                </div>

                                <div className="form-group">
                                    <label>Account Name *</label>
                                    <input
                                        type="text"
                                        value={data.account_name}
                                        onChange={e => setData('account_name', e.target.value)}
                                        placeholder="Official account name"
                                        required
                                    />
                                    {errors.account_name && <span className="error">{errors.account_name}</span>}
                                </div>

                                <div className="form-actions">
                                    <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary" disabled={processing}>
                                        {processing ? 'Saving...' : 'Save Account'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default BankAccounts;
