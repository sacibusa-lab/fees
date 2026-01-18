import React, { useState } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import Layout from '../../Components/Layout';
import AddSubAccountModal from '../../Components/AddSubAccountModal';
import { Trash2 } from 'lucide-react';
import './BankAccounts.css';

const BankAccounts = ({ accounts = [], banks = [] }) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this bank account?')) {
            router.delete(`/business/bank-accounts/${id}`);
        }
    };

    return (
        <Layout>
            <Head title="Bank Accounts" />
            <div className="bank-accounts-page">
                <div className="page-header">
                    <h1 className="page-title">Bank Accounts</h1>
                    <button
                        className="add-account-btn"
                        onClick={() => setIsAddModalOpen(true)}
                    >
                        + Add Sub Account
                    </button>
                </div>

                <div className="accounts-table-container card">
                    <table className="accounts-table">
                        <thead>
                            <tr>
                                <th>S/N</th>
                                <th>Sub Account Code</th>
                                <th>Bank Name</th>
                                <th>Account Name</th>
                                <th>Account Number</th>
                                <th>Type</th>
                                <th className="actions-col">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {accounts.map((account, index) => (
                                <tr key={account.id}>
                                    <td>{index + 1}</td>
                                    <td>{account.sub_account_code || '-'}</td>
                                    <td>{account.bank_name}</td>
                                    <td>{account.account_name}</td>
                                    <td>{account.account_number}</td>
                                    <td>{account.sub_account_code ? 'Sub Account' : 'Primary Account'}</td>
                                    <td className="actions-cell">
                                        <button
                                            className="delete-btn"
                                            onClick={() => handleDelete(account.id)}
                                            title="Delete Account"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {accounts.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="empty-state">No bank accounts found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    <div className="table-pagination">
                        <button className="page-nav-btn disabled">« Previous</button>
                        <div className="page-numbers">
                            <button className="page-num-btn active">1</button>
                        </div>
                        <button className="page-nav-btn disabled">Next »</button>
                    </div>
                </div>

                <AddSubAccountModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    banks={banks}
                />
            </div>
        </Layout>
    );
};

export default BankAccounts;
