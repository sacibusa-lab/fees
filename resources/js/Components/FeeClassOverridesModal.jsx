import React, { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { X, Trash2, Plus, Check } from 'lucide-react';
import './FeeClassOverridesModal.css';

const FeeClassOverridesModal = ({ fee, classes, onClose }) => {
    // We want to manage a list of overrides
    // Initial state: any existing overrides for this fee
    const { data, setData, post, processing, errors } = useForm({
        overrides: fee.overrides || []
    });

    const addOverride = () => {
        // Find a class that isn't already overridden
        const existingClassIds = data.overrides.map(o => parseInt(o.class_id));
        const availableClass = classes.find(c => !existingClassIds.includes(c.id));

        if (!availableClass) {
            alert('All classes already have specific amounts set.');
            return;
        }

        setData('overrides', [
            ...data.overrides,
            { class_id: availableClass.id, amount: fee.raw_amount, status: 'active' }
        ]);
    };

    const removeOverride = (index) => {
        const newOverrides = [...data.overrides];
        newOverrides.splice(index, 1);
        setData('overrides', newOverrides);
    };

    const updateOverride = (index, field, value) => {
        const newOverrides = [...data.overrides];
        newOverrides[index] = { ...newOverrides[index], [field]: value };
        setData('overrides', newOverrides);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(`/fees/${fee.id}/overrides`, {
            onSuccess: () => {
                onClose();
            },
        });
    };

    return (
        <div className="override-modal-overlay" onClick={onClose}>
            <div className="override-modal-content" onClick={e => e.stopPropagation()}>
                <div className="override-modal-header">
                    <div>
                        <h3>Class Specific Amounts</h3>
                        <p className="subtitle">{fee.title} (Default: ₦{fee.raw_amount.toLocaleString()})</p>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="override-form">
                    <div className="overrides-list">
                        {data.overrides.length === 0 ? (
                            <div className="empty-overrides">
                                <p>No specific class amounts set. All classes pay the default amount.</p>
                            </div>
                        ) : (
                            <table className="overrides-table">
                                <thead>
                                    <tr>
                                        <th>Class</th>
                                        <th>Amount (₦)</th>
                                        <th>Status</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.overrides.map((override, index) => (
                                        <tr key={index}>
                                            <td>
                                                <select
                                                    value={override.class_id}
                                                    onChange={(e) => updateOverride(index, 'class_id', e.target.value)}
                                                    className="override-select"
                                                >
                                                    {classes.map(c => {
                                                        const isSelectedByOther = data.overrides.some((o, idx) => parseInt(o.class_id) === c.id && idx !== index);
                                                        return (
                                                            <option key={c.id} value={c.id} disabled={isSelectedByOther}>
                                                                {c.name}
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    value={override.amount}
                                                    onChange={(e) => updateOverride(index, 'amount', e.target.value)}
                                                    className="override-input"
                                                    placeholder="0"
                                                />
                                            </td>
                                            <td>
                                                <select
                                                    value={override.status}
                                                    onChange={(e) => updateOverride(index, 'status', e.target.value)}
                                                    className="override-select status-select"
                                                >
                                                    <option value="active">Active</option>
                                                    <option value="inactive">Inactive</option>
                                                </select>
                                            </td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className="remove-btn"
                                                    onClick={() => removeOverride(index)}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <button type="button" className="add-override-btn" onClick={addOverride}>
                        <Plus size={16} /> Add Class Amount
                    </button>

                    <div className="modal-footer">
                        <button type="button" className="cancel-btn" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="save-btn" disabled={processing}>
                            {processing ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FeeClassOverridesModal;
