import React, { useState, useEffect } from 'react';
import Layout from '../Components/Layout';
import { Head, router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import './Transactions.css';

const Transactions = ({ transactions = [], filters = {} }) => {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchTerm !== (filters.search || '')) {
                router.get('/payments/transactions', 
                    { search: searchTerm }, 
                    { 
                        preserveState: true, 
                        replace: true,
                        only: ['transactions', 'filters']
                    }
                );
            }
        }, 400);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const handleRowClick = (id) => {
        router.visit(`/payments/transactions/${id}`);
    };

    const getStatusClass = (status) => {
        switch (status.toLowerCase()) {
            case 'success':
            case 'approved':
                return 'status-success';
            case 'pending':
                return 'status-pending';
            case 'failed':
                return 'status-failed';
            default:
                return '';
        }
    };

    return (
        <Layout>
            <Head title="Transactions" />

            <div className="transactions-container">
                <div className="transactions-header">
                    <h1 className="page-heading">Transactions</h1>
                    <div className="header-actions">
                        <div className="search-wrapper">
                            <Search size={18} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search student name, ref or reg number..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="export-btn">
                            Export
                        </button>
                    </div>
                </div>

                <div className="transactions-card card">
                    <div className="table-scroll-area">
                        <table className="transactions-table">
                            <thead>
                                <tr>
                                    <th>Reference</th>
                                    <th>Student</th>
                                    <th>Fee</th>
                                    <th>Amount</th>
                                    <th>Method</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.length > 0 ? (
                                    transactions.map((transaction) => (
                                        <tr
                                            key={transaction.id}
                                            onClick={() => handleRowClick(transaction.id)}
                                            className="clickable-row"
                                        >
                                            <td className="ref-cell">{transaction.reference}</td>
                                            <td>{transaction.student_name}</td>
                                            <td>{transaction.fee_title}</td>
                                            <td className="amount-cell">{transaction.amount}</td>
                                            <td>{transaction.payment_method}</td>
                                            <td>
                                                <span className={`status-badge ${getStatusClass(transaction.status)}`}>
                                                    {transaction.status}
                                                </span>
                                            </td>
                                            <td className="date-cell">{transaction.date}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="no-records">
                                            No transactions found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Transactions;
