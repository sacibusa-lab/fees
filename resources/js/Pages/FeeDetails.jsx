import React, { useState } from 'react';
import { Head, useForm, Link, router } from '@inertiajs/react';
const number_format = (num) => new Intl.NumberFormat().format(num);
import Layout from '../Components/Layout';
import { CreditCard, Activity, Settings, Save, Trash2, ArrowLeft, Info, Split, Power, RefreshCcw, Edit } from 'lucide-react';
import FeeBeneficiariesModal from '../Components/FeeBeneficiariesModal';
import FeeClassOverridesModal from '../Components/FeeClassOverridesModal';
import '../Pages/StudentProfile.css'; // Reusing Student Profile CSS

const FeeDetails = ({ fee, bankAccounts = [], classes = [] }) => {
    const [activeTab, setActiveTab] = useState('details');
    const [showBeneficiaryModal, setShowBeneficiaryModal] = useState(false);
    const [showOverridesModal, setShowOverridesModal] = useState(false);
    const [modalMode, setModalMode] = useState('edit'); // 'edit', 'set-amount', note: we are just reusing the form logic if needed, but here we can just do inline forms or modals

    // Reuse the form logic from FeesManagement, simplified for single fee update
    const { data, setData, put, processing, errors } = useForm({
        title: fee.title,
        revenue_code: fee.revenueCode,
        cycle: fee.cycle.toLowerCase(),
        type: fee.type.toLowerCase(),
        payee_allowed: fee.payeeAllowed.toLowerCase(),
        amount: fee.raw_amount,
        charge_bearer: fee.chargeBear.toLowerCase(),
        status: fee.status.toLowerCase()
    });

    const handleUpdate = (e) => {
        e.preventDefault();
        put(`/fees/${fee.id}`, {
            onSuccess: () => alert('Fee updated successfully!')
        });
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this fee?')) {
            router.delete(`/fees/${fee.id}`);
        }
    };

    const handleToggleStatus = () => {
        router.put(`/fees/${fee.id}/toggle-status`);
    };

    return (
        <Layout>
            <Head title={`${fee.title} - Details`} />

            <div className="student-profile-container">
                {/* Header */}
                <div className="profile-header">
                    <Link href="/fees" className="back-link">
                        <ArrowLeft size={20} /> Back to Fees
                    </Link>

                    <div className="profile-summary">
                        <div className="profile-avatar-large" style={{ background: '#e3f2fd', color: '#1565c0' }}>
                            <CreditCard size={32} />
                        </div>
                        <div className="profile-info-primary">
                            <h1>{fee.title}</h1>
                            <div className="profile-meta">
                                <span className="meta-item">{fee.revenueCode}</span>
                                <span className="meta-dot">•</span>
                                <span className="meta-item">{fee.cycle}</span>
                                <span className="meta-dot">•</span>
                                <span className={`status-pill ${fee.status.toLowerCase()}`}>
                                    {fee.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="profile-tabs">
                        <button
                            className={`tab-item ${activeTab === 'details' ? 'active' : ''}`}
                            onClick={() => setActiveTab('details')}
                        >
                            <Info size={18} /> Details
                        </button>
                        <button
                            className={`tab-item ${activeTab === 'beneficiaries' ? 'active' : ''}`}
                            onClick={() => setActiveTab('beneficiaries')}
                        >
                            <Split size={18} /> Beneficiaries
                        </button>
                        <button
                            className={`tab-item ${activeTab === 'overrides' ? 'active' : ''}`}
                            onClick={() => setActiveTab('overrides')}
                        >
                            <CreditCard size={18} /> Class Amounts
                        </button>
                        <button
                            className={`tab-item ${activeTab === 'activity' ? 'active' : ''}`}
                            onClick={() => setActiveTab('activity')}
                        >
                            <Activity size={18} /> Transactions
                        </button>
                        <button
                            className={`tab-item ${activeTab === 'settings' ? 'active' : ''}`}
                            onClick={() => setActiveTab('settings')}
                        >
                            <Settings size={18} /> Settings
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="profile-content">

                    {/* DETAILS TAB */}
                    {activeTab === 'details' && (
                        <div className="content-card">
                            <div className="card-header">
                                <h3>Fee Overview</h3>
                                <p>Manage fee configuration and pricing.</p>
                            </div>
                            <form onSubmit={handleUpdate} className="profile-form">
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Fee Title</label>
                                        <input
                                            type="text"
                                            value={data.title}
                                            onChange={e => setData('title', e.target.value)}
                                            className={errors.title ? 'error' : ''}
                                        />
                                        {errors.title && <span className="error-msg">{errors.title}</span>}
                                    </div>

                                    <div className="form-group">
                                        <label>Revenue Code</label>
                                        <input
                                            type="text"
                                            value={data.revenue_code}
                                            onChange={e => setData('revenue_code', e.target.value)}
                                            className={errors.revenue_code ? 'error' : ''}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Amount (₦)</label>
                                        <input
                                            type="number"
                                            value={data.amount}
                                            onChange={e => setData('amount', e.target.value)}
                                            className={errors.amount ? 'error' : ''}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Cycle</label>
                                        <select value={data.cycle} onChange={e => setData('cycle', e.target.value)}>
                                            <option value="termly">Termly</option>
                                            <option value="annually">Annually</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Type</label>
                                        <select value={data.type} onChange={e => setData('type', e.target.value)}>
                                            <option value="compulsory">Compulsory</option>
                                            <option value="optional">Optional</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Payee Allowed</label>
                                        <select value={data.payee_allowed} onChange={e => setData('payee_allowed', e.target.value)}>
                                            <option value="students">Students</option>
                                            <option value="all">All</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Charge Bearer</label>
                                        <select value={data.charge_bearer} onChange={e => setData('charge_bearer', e.target.value)}>
                                            <option value="self">Self</option>
                                            <option value="institution">Institution</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button type="submit" className="btn-save" disabled={processing}>
                                        <Save size={18} />
                                        {processing ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* BENEFICIARIES TAB */}
                    {activeTab === 'beneficiaries' && (
                        <div className="content-card">
                            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3>Split Beneficiaries</h3>
                                    <p>Configure how revenue is distributed.</p>
                                </div>
                                <button className="secondary-btn" onClick={() => setShowBeneficiaryModal(true)}>
                                    <Edit size={16} style={{ marginRight: '6px' }} /> Manage Splits
                                </button>
                            </div>

                            {fee.beneficiaries && fee.beneficiaries.length > 0 ? (
                                <div className="accounts-list">
                                    {fee.beneficiaries.map((ben, idx) => (
                                        <div key={idx} className="account-item">
                                            <div className="bank-logo" style={{ fontSize: '0.8rem', width: '40px', height: '40px' }}>
                                                {ben.percentage}%
                                            </div>
                                            <div className="account-details">
                                                <h4>{ben.account_name} ({ben.account_number})</h4>
                                                <div className="account-number-row">
                                                    <span className="acc-name">{ben.bank_name}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <Split size={48} className="text-gray-300" />
                                    <p>No beneficiaries configured. Fee goes 100% to main account.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* CLASS OVERRIDES TAB */}
                    {activeTab === 'overrides' && (
                        <div className="content-card">
                            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3>Class Specific Amounts</h3>
                                    <p>Set unique payment amounts for different classes.</p>
                                </div>
                                <button className="secondary-btn" onClick={() => setShowOverridesModal(true)}>
                                    <Edit size={16} style={{ marginRight: '6px' }} /> Manage Overrides
                                </button>
                            </div>

                            {fee.overrides && fee.overrides.length > 0 ? (
                                <table className="modern-table" style={{ width: '100%', marginTop: '20px' }}>
                                    <thead>
                                        <tr>
                                            <th>Class</th>
                                            <th>Amount (₦)</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {fee.overrides.map((override, idx) => {
                                            const classObj = classes.find(c => c.id === override.class_id);
                                            return (
                                                <tr key={idx}>
                                                    <td>{classObj ? classObj.name : 'Unknown Class'}</td>
                                                    <td>₦{number_format(override.amount)}</td>
                                                    <td>
                                                        <span className={`status-pill ${override.status}`}>
                                                            {override.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="empty-state">
                                    <CreditCard size={48} className="text-gray-300" />
                                    <p>No class overrides set. All classes pay the default amount (₦{fee.raw_amount.toLocaleString()}).</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ACTIVITY TAB */}
                    {activeTab === 'activity' && (
                        <div className="content-card">
                            <div className="card-header">
                                <h3>Transactions</h3>
                                <p>Recent payments for this fee.</p>
                            </div>
                            <div className="empty-state">
                                <Activity size={48} className="text-gray-300" />
                                <p>No transactions found.</p>
                            </div>
                        </div>
                    )}

                    {/* SETTINGS TAB */}
                    {activeTab === 'settings' && (
                        <div className="content-card">
                            <div className="card-header">
                                <h3>Actions</h3>
                                <p>Manage fee status and existence.</p>
                            </div>

                            <div className="danger-actions" style={{ borderBottom: '1px solid #eee', paddingBottom: '20px', marginBottom: '20px' }}>
                                <h4 style={{ fontSize: '1rem', marginBottom: '8px', color: '#444' }}>Fee Status</h4>
                                <p className="warning-text" style={{ color: '#666', marginBottom: '12px' }}>
                                    Currently <strong>{fee.status}</strong>. {fee.status === 'Active' ? 'Deactivating will prevent new payments.' : 'Activating will allow payments.'}
                                </p>
                                <button className="secondary-btn" onClick={handleToggleStatus} style={{ borderColor: '#ccc' }}>
                                    <RefreshCcw size={18} style={{ marginRight: '8px' }} />
                                    {fee.status === 'Active' ? 'Deactivate Fee' : 'Activate Fee'}
                                </button>
                            </div>

                            <div className="danger-actions">
                                <h4 style={{ fontSize: '1rem', marginBottom: '8px', color: '#d32f2f' }}>Delete Fee</h4>
                                <p className="warning-text">Once deleted, this action cannot be undone.</p>
                                <button className="btn-delete" onClick={handleDelete}>
                                    <Trash2 size={18} /> Delete Fee
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Beneficiaries Modal */}
                {showBeneficiaryModal && (
                    <FeeBeneficiariesModal
                        fee={{ ...fee, id: fee.id }} // pass fee object with id
                        onClose={() => setShowBeneficiaryModal(false)}
                        bankAccounts={bankAccounts}
                    />
                )}
                {/* Overrides Modal */}
                {showOverridesModal && (
                    <FeeClassOverridesModal
                        fee={fee}
                        classes={classes}
                        onClose={() => setShowOverridesModal(false)}
                    />
                )}
            </div>
        </Layout>
    );
};

export default FeeDetails;
