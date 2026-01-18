import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Head, useForm, router } from '@inertiajs/react'; // Import router
import Layout from '../Components/Layout';
import { Plus, MoreVertical, Edit, Trash2, Split, Power, Info, RefreshCcw } from 'lucide-react';
import FeeBeneficiariesModal from '../Components/FeeBeneficiariesModal';
import './FeesManagement.css';

const FeesManagement = ({ fees = [], feeCount = 0, bankAccounts = [] }) => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'set-amount'
    const [editingFee, setEditingFee] = useState(null);
    const [showBeneficiaryModal, setShowBeneficiaryModal] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);

    // Form for Add/Edit
    const { data, setData, post, put, processing, reset, errors, clearErrors } = useForm({
        title: '',
        revenue_code: '',
        cycle: 'termly',
        type: 'compulsory',
        payee_allowed: 'students',
        amount: '',
        charge_bearer: 'self',
        status: 'active'
    });

    const openAddModal = () => {
        setModalMode('add');
        setEditingFee(null);
        reset();
        clearErrors();
        setShowAddModal(true);
    };

    const openEditModal = (fee) => {
        setModalMode('edit');
        setEditingFee(fee);
        setFormData(fee);
        clearErrors();
        setShowAddModal(true);
        setActiveDropdown(null);
    };

    const openSetAmountModal = (fee) => {
        setModalMode('set-amount');
        setEditingFee(fee);
        setFormData(fee);
        clearErrors();
        setShowAddModal(true);
        setActiveDropdown(null);
    };

    const setFormData = (fee) => {
        setData({
            title: fee.title,
            revenue_code: fee.revenueCode,
            cycle: fee.cycle.toLowerCase(),
            type: fee.type.toLowerCase(),
            payee_allowed: fee.payeeAllowed.toLowerCase(),
            amount: fee.raw_amount,
            charge_bearer: fee.chargeBear.toLowerCase(),
            status: fee.status.toLowerCase()
        });
    };

    const openBeneficiaryModal = (fee) => {
        setEditingFee(fee);
        setShowBeneficiaryModal(true);
        setActiveDropdown(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (modalMode === 'add') {
            post('/fees', {
                onSuccess: () => {
                    setShowAddModal(false);
                    reset();
                },
            });
        } else {
            put(`/fees/${editingFee.id}`, {
                onSuccess: () => {
                    setShowAddModal(false);
                    reset();
                },
            });
        }
    };

    const handleDelete = (fee) => {
        if (confirm('Are you sure you want to delete this fee?')) {
            router.delete(`/fees/${fee.id}`);
        }
        setActiveDropdown(null);
    };

    const handleToggleStatus = (fee) => {
        router.put(`/fees/${fee.id}/toggle-status`);
        setActiveDropdown(null);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (activeDropdown && !event.target.closest('.actions-cell') && !event.target.closest('.action-menu-portal')) {
                setActiveDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeDropdown]);

    return (
        <Layout>
            <Head title={`Fees - ${feeCount}`} />
            <div className="fees-page-container">
                <div className="fees-top-bar">
                    <h1 className="page-heading">Fees - <span className="count">{feeCount}</span></h1>
                    <button className="add-fee-btn-outline" onClick={openAddModal}>
                        <Plus size={18} />
                        Add Fee
                    </button>
                </div>

                <div className="fees-table-wrapper card">
                    <div className="table-scroll-area">
                        <table className="fees-data-table">
                            <thead>
                                <tr>
                                    <th>S/N</th>
                                    <th>Title</th>
                                    <th>Revenue Code</th>
                                    <th>Cycle</th>
                                    <th>Type</th>
                                    <th>Payers Allowed</th>
                                    <th>Amount</th>
                                    <th>Charge Bearer</th>
                                    <th className="status-col">Status</th>
                                    <th className="actions-col"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {fees.map((fee, index) => (
                                    <tr key={fee.id} onClick={() => router.visit(`/fees/${fee.id}`)} style={{ cursor: 'pointer' }}>
                                        <td>{index + 1}</td>
                                        <td className="title-cell-accent">
                                            {fee.title}
                                            {fee.beneficiaries && fee.beneficiaries.length > 0 && (
                                                <span className="split-badge">Split ({fee.beneficiaries.length})</span>
                                            )}
                                        </td>
                                        <td>{fee.revenueCode}</td>
                                        <td>{fee.cycle}</td>
                                        <td>{fee.type}</td>
                                        <td>{fee.payeeAllowed}</td>
                                        <td>{fee.amount}</td>
                                        <td>{fee.chargeBear}</td>
                                        <td>
                                            <span className={`status-pill ${fee.status.toLowerCase()}`}>
                                                <span className="pill-dot"></span>
                                                {fee.status}
                                            </span>
                                        </td>
                                        <td className="actions-cell">
                                            {/* Action column removed as per request, entire row is clickable */}
                                        </td>
                                    </tr>
                                ))}
                                {fees.length === 0 && (
                                    <tr>
                                        <td colSpan="10" className="no-records">No fees found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Add/Edit Fee Modal */}
                {showAddModal && (
                    <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                        <div className={`modal-content ${modalMode === 'set-amount' ? '' : 'wide-modal'}`} onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>
                                    {modalMode === 'add' ? 'Add New Fee' :
                                        modalMode === 'edit' ? 'Edit Fee' :
                                            'Set Fee Amount'}
                                </h3>
                                <button className="close-btn" onClick={() => setShowAddModal(false)}>×</button>
                            </div>

                            <form onSubmit={handleSubmit} className="modern-fee-form">
                                {modalMode === 'set-amount' ? (
                                    <div className="input-group">
                                        <label>Amount (₦) *</label>
                                        <input
                                            type="number"
                                            value={data.amount}
                                            onChange={e => setData('amount', e.target.value)}
                                            placeholder="0"
                                            required
                                            autoFocus
                                        />
                                        {errors.amount && <span className="error-msg">{errors.amount}</span>}
                                        <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>
                                            This will update the fee amount for all students.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="form-layout-grid">
                                        <div className="input-group">
                                            <label>Fee Title *</label>
                                            <input
                                                type="text"
                                                value={data.title}
                                                onChange={e => setData('title', e.target.value)}
                                                placeholder="e.g., 2nd Term School Fees"
                                                required
                                            />
                                            {errors.title && <span className="error-msg">{errors.title}</span>}
                                        </div>

                                        <div className="input-group">
                                            <label>Revenue Code *</label>
                                            <input
                                                type="text"
                                                value={data.revenue_code}
                                                onChange={e => setData('revenue_code', e.target.value)}
                                                placeholder="e.g., FNG7244210"
                                                required
                                            />
                                            {errors.revenue_code && <span className="error-msg">{errors.revenue_code}</span>}
                                        </div>

                                        <div className="input-group">
                                            <label>Cycle *</label>
                                            <select value={data.cycle} onChange={e => setData('cycle', e.target.value)}>
                                                <option value="termly">Termly</option>
                                                <option value="annually">Annually</option>
                                            </select>
                                        </div>

                                        <div className="input-group">
                                            <label>Type *</label>
                                            <select value={data.type} onChange={e => setData('type', e.target.value)}>
                                                <option value="compulsory">Compulsory</option>
                                                <option value="optional">Optional</option>
                                            </select>
                                        </div>

                                        <div className="input-group">
                                            <label>Payee Allowed *</label>
                                            <select value={data.payee_allowed} onChange={e => setData('payee_allowed', e.target.value)}>
                                                <option value="students">Students</option>
                                                <option value="all">All</option>
                                            </select>
                                        </div>

                                        <div className="input-group">
                                            <label>Amount (₦) *</label>
                                            <input
                                                type="number"
                                                value={data.amount}
                                                onChange={e => setData('amount', e.target.value)}
                                                placeholder="0"
                                                required
                                            />
                                            {errors.amount && <span className="error-msg">{errors.amount}</span>}
                                        </div>

                                        <div className="input-group">
                                            <label>Charge Bearer *</label>
                                            <select value={data.charge_bearer} onChange={e => setData('charge_bearer', e.target.value)}>
                                                <option value="self">Self</option>
                                                <option value="institution">Institution</option>
                                            </select>
                                        </div>

                                        <div className="input-group">
                                            <label>Status *</label>
                                            <select value={data.status} onChange={e => setData('status', e.target.value)}>
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                <div className="modal-footer-actions">
                                    <button type="button" className="secondary-btn" onClick={() => setShowAddModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="primary-btn" disabled={processing}>
                                        {processing ? 'Processing...' : (modalMode === 'add' ? 'Add Fee' : 'Save Changes')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Beneficiaries Modal */}
                {showBeneficiaryModal && editingFee && (
                    <FeeBeneficiariesModal
                        fee={editingFee}
                        onClose={() => setShowBeneficiaryModal(false)}
                        bankAccounts={bankAccounts}
                    />
                )}
            </div>
        </Layout>
    );
};

export default FeesManagement;
