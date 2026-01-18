import React from 'react';
import Layout from '../Components/Layout';
import { Head, router } from '@inertiajs/react';
import './Transactions.css';

const Transactions = ({ transactions = [] }) => {
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
