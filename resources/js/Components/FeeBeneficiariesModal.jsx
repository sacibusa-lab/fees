import React, { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { Trash2, Plus, AlertCircle, Save } from 'lucide-react';

const FeeBeneficiariesModal = ({ fee, onClose, bankAccounts = [] }) => {
    // Transform existing beneficiaries or init with blank
    // specific logic: if beneficiaries exist, calculate their nominal amount from percentage
    const initialBeneficiaries = fee.beneficiaries && fee.beneficiaries.length > 0
        ? fee.beneficiaries.map(b => ({
            ...b,
            amount: Math.round((parseFloat(b.percentage) / 100) * fee.raw_amount)
        }))
        : [{ account_name: '', account_number: '', bank_name: '', amount: '' }];

    const { data, setData, post, processing, errors } = useForm({
        beneficiaries: initialBeneficiaries
    });

    const addBeneficiary = () => {
        setData('beneficiaries', [
            ...data.beneficiaries,
            { account_name: '', account_number: '', bank_name: '', amount: '' } // default amount empty
        ]);
    };

    const removeBeneficiary = (index) => {
        const newBen = [...data.beneficiaries];
        newBen.splice(index, 1);
        setData('beneficiaries', newBen);
    };

    const updateBeneficiary = (index, field, value) => {
        const newBen = [...data.beneficiaries];

        if (field === 'amount') {
            const amt = parseFloat(value) || 0;
            newBen[index]['amount'] = value; // keep as string for input
            // Update percentage based on amount
            newBen[index]['percentage'] = fee.raw_amount > 0 ? ((amt / fee.raw_amount) * 100).toFixed(2) : 0;
        } else {
            newBen[index][field] = value;
        }

        setData('beneficiaries', newBen);
    };

    // Helper to find account details
    const handleAccountSelect = (index, accountId) => {
        const selectedAccount = bankAccounts.find(acc => acc.id == accountId);
        if (selectedAccount) {
            const newBen = [...data.beneficiaries];
            newBen[index] = {
                ...newBen[index],
                bank_account_id: selectedAccount.id,
                account_name: selectedAccount.account_name,
                account_number: selectedAccount.account_number,
                bank_name: selectedAccount.bank_name
            };
            setData('beneficiaries', newBen);
        }
    };

    const totalAmount = data.beneficiaries.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);
    // tolerance of 1.0 for rounding issues, or just check Exact if integers
    const isTotalValid = Math.abs(totalAmount - fee.raw_amount) < 1.0;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!isTotalValid) {
            alert(`Total amount must equal ₦${fee.raw_amount.toLocaleString()}`);
            return;
        }
        post(`/fees/${fee.id}/beneficiaries`, {
            onSuccess: () => {
                onClose();
            }
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose} style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{
                background: 'white', borderRadius: '12px', width: '90%', maxWidth: '800px',
                maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
            }}>
                <div className="modal-header" style={{
                    padding: '20px 24px', borderBottom: '1px solid #eee',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1a1a1a' }}>Split Beneficiaries</h3>
                        <p style={{ margin: '4px 0 0', color: '#666', fontSize: '0.9rem' }}>
                            Total Fee Amount: <strong>₦{fee.raw_amount.toLocaleString()}</strong>
                        </p>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999'
                    }}>×</button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '24px' }}>

                    {!isTotalValid && (
                        <div style={{
                            display: 'flex', gap: '10px', padding: '12px', background: '#ffebee',
                            borderRadius: '8px', color: '#c62828', marginBottom: '20px', fontSize: '0.9rem'
                        }}>
                            <AlertCircle size={20} />
                            <div>
                                <strong>Invalid Total Allocation</strong>
                                <p style={{ margin: 0 }}>
                                    Total split must equal ₦{fee.raw_amount.toLocaleString()}.
                                    Current: ₦{totalAmount.toLocaleString()} (Diff: ₦{(fee.raw_amount - totalAmount).toLocaleString()})
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="beneficiaries-list">
                        <div style={{
                            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 120px 40px', gap: '12px',
                            paddingBottom: '8px', borderBottom: '1px solid #eee', marginBottom: '12px',
                            fontWeight: '600', fontSize: '0.85rem', color: '#666'
                        }}>
                            <div>Account Name</div>
                            <div>Account Number</div>
                            <div>Bank Name</div>
                            <div>Amount (₦)</div>
                            <div></div>
                        </div>

                        {data.beneficiaries.map((ben, index) => (
                            <div key={index} style={{
                                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 120px 40px', gap: '12px', marginBottom: '12px', alignItems: 'start'
                            }}>
                                {/* Account Selection Dropdown - Replaces manual input if accounts exist */}
                                <div style={{ gridColumn: '1 / span 3', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                    {bankAccounts.length > 0 ? (
                                        <select
                                            onChange={(e) => handleAccountSelect(index, e.target.value)}
                                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', gridColumn: 'span 3', marginBottom: '8px' }}
                                            value={ben.bank_account_id || ''}
                                        >
                                            <option value="">-- Select Bank Account --</option>
                                            {bankAccounts.map(acc => (
                                                <option key={acc.id} value={acc.id}>
                                                    {acc.bank_name} - {acc.account_name} ({acc.account_number})
                                                </option>
                                            ))}
                                        </select>
                                    ) : null}

                                    {/* Read-only fields populated by selection */}
                                    <input
                                        type="text"
                                        value={ben.account_name}
                                        readOnly
                                        placeholder="Account Name"
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #eee', background: '#f9f9f9', color: '#666' }}
                                    />
                                    <input
                                        type="text"
                                        value={ben.account_number}
                                        readOnly
                                        placeholder="Account Number"
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #eee', background: '#f9f9f9', color: '#666' }}
                                    />
                                    <input
                                        type="text"
                                        value={ben.bank_name}
                                        readOnly
                                        placeholder="Bank Name"
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #eee', background: '#f9f9f9', color: '#666' }}
                                    />
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="number"
                                        value={ben.amount}
                                        onChange={e => updateBeneficiary(index, 'amount', e.target.value)}
                                        placeholder="0"
                                        required
                                        min="0"
                                        max={fee.raw_amount}
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                                    />
                                    {/* Calculated % hint */}
                                    <span style={{
                                        position: 'absolute', right: '0', top: '42px',
                                        color: '#999', fontSize: '0.75rem', width: '100%', textAlign: 'right'
                                    }}>
                                        {ben.percentage ? `${parseFloat(ben.percentage).toFixed(1)}%` : '0%'}
                                    </span>
                                </div>

                                <button type="button" onClick={() => removeBeneficiary(index)} style={{
                                    height: '40px', color: '#d32f2f', background: '#ffebee', border: 'none',
                                    borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <button type="button" className="add-row-btn" onClick={addBeneficiary} style={{
                        marginTop: '20px', color: '#E91E63', fontWeight: '500', background: 'transparent',
                        border: '1px dashed #E91E63', padding: '10px', width: '100%', borderRadius: '6px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}>
                        <Plus size={18} /> Add Another Account
                    </button>

                    <div style={{
                        marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #eee',
                        display: 'flex', justifyContent: 'flex-end', gap: '12px'
                    }}>
                        <button type="button" onClick={onClose} style={{
                            padding: '10px 20px', borderRadius: '6px', border: '1px solid #ddd',
                            background: 'white', color: '#666', cursor: 'pointer', fontWeight: '500'
                        }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={processing || !isTotalValid} style={{
                            padding: '10px 24px', borderRadius: '6px', border: 'none',
                            background: isTotalValid ? '#E91E63' : '#ccc', color: 'white',
                            cursor: isTotalValid ? 'pointer' : 'not-allowed', fontWeight: '500',
                            display: 'flex', alignItems: 'center', gap: '8px'
                        }}>
                            <Save size={18} /> Save Splits
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FeeBeneficiariesModal;
