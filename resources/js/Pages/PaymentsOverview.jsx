import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import Layout from '../Components/Layout';
import { ChevronRight } from 'lucide-react';
import './PaymentsOverview.css';
import AcademicPeriodModal from '../Components/AcademicPeriodModal';

const PaymentsOverview = ({
    initialExpandedStats = [],
    initialPaymentBreakdown = [],
    sessions = [],
    fees = []
}) => {
    const [selectedFee, setSelectedFee] = useState(fees[0]?.title || 'School Fees');

    // State for Session/Term filter
    const [selectedSession, setSelectedSession] = useState(sessions.find(s => s.is_current)?.name || '2023/2024');
    const [selectedTerm, setSelectedTerm] = useState('1st Term'); // Default
    const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);

    // Dummy sessionOptions for now, assuming it would be derived from 'sessions' prop
    // const sessionOptions = sessions.length > 0 ? sessions.map(s => s.name) : ['2023/2024'];

    const handlePeriodApply = (session, term) => {
        setSelectedSession(session);
        setSelectedTerm(`${term} Term`); // Append 'Term' for display if needed
    };

    return (
        <Layout>
            <Head title="Payments Overview" />
            <div className="payments-overview">

                <div className="expanded-view-content">
                    {/* Filter Bar */}
                    <div className="filter-bar">
                        <h3 className="section-title">Expanded Summary</h3>
                        <div className="filter-controls">
                            <select
                                className="filter-select"
                                value={selectedFee}
                                onChange={(e) => setSelectedFee(e.target.value)}
                            >
                                {fees.length > 0 ? (
                                    fees.map(f => <option key={f.id}>{f.title}</option>)
                                ) : (
                                    <option>School Fees</option>
                                )}
                            </select>

                            {/* Replaced simple dropdown with Modal Trigger */}
                            <button
                                className="filter-select period-trigger-btn"
                                onClick={() => setIsPeriodModalOpen(true)}
                                style={{ textAlign: 'left', minWidth: '180px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            >
                                <span>{selectedSession} - {selectedTerm}</span>
                                <ChevronRight size={14} style={{ transform: 'rotate(90deg)' }} />
                            </button>
                        </div>
                    </div>

                    <AcademicPeriodModal
                        isOpen={isPeriodModalOpen}
                        onClose={() => setIsPeriodModalOpen(false)}
                        sessions={sessions.length > 0 ? sessions : [{ name: '2023/2024' }, { name: '2024/2025' }]} // Fallback
                        currentSession={selectedSession}
                        currentTerm={selectedTerm.replace(' Term', '')}
                        onApply={handlePeriodApply}
                    />

                    {/* Metric Cards Grid */}
                    <div className="metrics-grid">
                        {initialExpandedStats.map((stat, index) => (
                            <div key={index} className="metric-card">
                                <div className="metric-header">
                                    <span className="metric-label">{stat.label}</span>
                                </div>
                                <div className="metric-body">
                                    <span className="metric-amount">{stat.amount}</span>
                                    <span className="metric-count">{stat.count}</span>
                                </div>
                            </div>
                        ))}
                        {initialExpandedStats.length === 0 && (
                            <div className="metric-card no-data">No metrics available.</div>
                        )}
                    </div>

                    {/* Breakdown Table */}
                    <div className="breakdown-table-section card">
                        <div className="table-responsive">
                            <table className="stats-table">
                                <thead>
                                    <tr>
                                        <th>S/N</th>
                                        <th>Title</th>
                                        <th>Flat Amount</th>
                                        <th>Expected</th>
                                        <th>Total Received</th>
                                        <th>Completed</th>
                                        <th>Part Payment</th>
                                        <th>Debt</th>
                                        <th>Progress (%)</th>
                                        <th>Discount</th>
                                        <th>Extra Charge</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {initialPaymentBreakdown.map((item, index) => (
                                        <tr key={item.id}>
                                            <td>{index + 1}</td>
                                            <td className="title-cell">{item.title}</td>
                                            <td>{item.flatAmount.toLocaleString()}</td>
                                            <td>
                                                <div className="amount-col">
                                                    <span className="amount-val">{item.expected.split(' (')[0]}</span>
                                                    <span className="count-val">({item.expected.split(' (')[1]?.replace(')', '') || 0})</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="amount-col">
                                                    <span className="amount-val">{item.totalReceived.split(' (')[0]}</span>
                                                    <span className="count-val">({item.totalReceived.split(' (')[1]?.replace(')', '') || 0})</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="amount-col">
                                                    <span className="amount-val">{item.completed.split(' (')[0]}</span>
                                                    <span className="count-val">({item.completed.split(' (')[1]?.replace(')', '') || 0})</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="amount-col">
                                                    <span className="amount-val">{item.partPayment.split(' (')[0]}</span>
                                                    <span className="count-val">({item.partPayment.split(' (')[1]?.replace(')', '') || 0})</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="amount-col">
                                                    <span className="amount-val">{item.debt.split(' (')[0]}</span>
                                                    <span className="count-val">({item.debt.split(' (')[1]?.replace(')', '') || 0})</span>
                                                </div>
                                            </td>
                                            <td>{item.progress}%</td>
                                            <td>{item.discount}</td>
                                            <td>{item.extraCharge.toLocaleString()}</td>
                                            <td>
                                                <button className="row-action-btn">
                                                    <ChevronRight size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {initialPaymentBreakdown.length === 0 && (
                                        <tr>
                                            <td colSpan="12" style={{ textAlign: 'center', padding: '2rem' }}>No breakdown data found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="table-pagination">
                            <button className="page-nav-btn disabled">« Previous</button>
                            <div className="page-numbers">
                                <button className="page-num-btn active">1</button>
                            </div>
                            <button className="page-nav-btn disabled">Next »</button>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default PaymentsOverview;
