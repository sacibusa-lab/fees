import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import Layout from '../Components/Layout';
import { ChevronRight, Wallet, TrendingUp, AlertCircle, CheckCircle, PlusCircle } from 'lucide-react';
import './PaymentsOverview.css';
import AcademicPeriodModal from '../Components/AcademicPeriodModal';
import ClassPaymentDetailModal from '../Components/ClassPaymentDetailModal';

const PaymentsOverview = ({
    initialExpandedStats = [],
    initialPaymentBreakdown = [],
    sessions = [],
    fees = [],
    filters = {}
}) => {
    const [selectedFeeId, setSelectedFeeId] = useState(filters.fee_id || fees[0]?.id || 'all');
    const [selectedClassForDetail, setSelectedClassForDetail] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    // State for Session/Term filter
    const initialSession = sessions.find(s => s.id == filters.session_id)?.name || sessions.find(s => s.is_current)?.name || '2023/2024';
    const [selectedSession, setSelectedSession] = useState(initialSession);
    const [selectedTerm, setSelectedTerm] = useState(filters.term || '1st Term');
    const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);

    // Filter refresh logic
    const refreshFilters = (newFilters) => {
        const query = {
            fee_id: newFilters.fee_id || selectedFeeId,
            session_id: newFilters.session_id || filters.session_id,
            term: newFilters.term || selectedTerm
        };

        router.get('/payments/overview', query, {
            preserveState: true,
            replace: true
        });
    };

    const handleFeeChange = (e) => {
        const feeId = e.target.value;
        setSelectedFeeId(feeId);
        refreshFilters({ fee_id: feeId });
    };

    const handlePeriodApply = (sessionName, termLabel) => {
        const fullTerm = `${termLabel} Term`;
        const session = sessions.find(s => s.name === sessionName);

        setSelectedSession(sessionName);
        setSelectedTerm(fullTerm);
        refreshFilters({ session_id: session?.id, term: fullTerm });
    };

    const handleRowClick = (item) => {
        let feeToUse = selectedFeeId;
        if (feeToUse === 'all' && fees.length > 0) {
            feeToUse = fees[0].id;
        }

        if (feeToUse && feeToUse !== 'all') {
            setSelectedClassForDetail(item);
            setIsDetailModalOpen(true);
        }
    };

    const getMetricConfig = (label) => {
        switch (label.toUpperCase()) {
            case 'RECEIVED': return { icon: <TrendingUp size={20} />, color: 'blue' };
            case 'EXPECTED': return { icon: <Wallet size={20} />, color: 'purple' };
            case 'DEBT': return { icon: <AlertCircle size={20} />, color: 'red' };
            case 'DISCOUNT APPLIED': return { icon: <CheckCircle size={20} />, color: 'green' };
            case 'EXTRA APPLIED': return { icon: <PlusCircle size={20} />, color: 'orange' };
            default: return { icon: <Wallet size={20} />, color: 'blue' };
        }
    };

    return (
        <Layout>
            <Head title="Payments Overview" />
            <div className="payments-overview">

                <div className="expanded-view-content">
                    {/* Filter Bar */}
                    <div className="filter-bar">
                        <h3 className="section-title">Payments Overview</h3>
                        <div className="filter-controls">
                            <select
                                className="filter-select"
                                value={selectedFeeId}
                                onChange={handleFeeChange}
                            >
                                <option value="all">All Fees</option>
                                {fees.length > 0 && fees.map(f => (
                                    <option key={f.id} value={f.id}>{f.title}</option>
                                ))}
                            </select>

                            <button
                                className="filter-select period-trigger-btn"
                                onClick={() => setIsPeriodModalOpen(true)}
                                style={{ textAlign: 'left', minWidth: '200px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            >
                                <span>{selectedSession} - {selectedTerm}</span>
                                <ChevronRight size={14} style={{ transform: 'rotate(90deg)' }} />
                            </button>
                        </div>
                    </div>

                    <AcademicPeriodModal
                        isOpen={isPeriodModalOpen}
                        onClose={() => setIsPeriodModalOpen(false)}
                        sessions={sessions.length > 0 ? sessions : [{ name: '2023/2024' }, { name: '2024/2025' }]}
                        currentSession={selectedSession}
                        currentTerm={selectedTerm.replace(' Term', '')}
                        onApply={handlePeriodApply}
                    />

                    {/* Metric Cards Grid */}
                    <div className="metrics-grid">
                        {initialExpandedStats.map((stat, index) => {
                            const config = getMetricConfig(stat.label);
                            return (
                                <div key={index} className="metric-card">
                                    <div className={`metric-icon-box ${config.color}`}>
                                        {config.icon}
                                    </div>
                                    <div className="metric-header">
                                        <span className="metric-label">{stat.label}</span>
                                    </div>
                                    <div className="metric-body">
                                        <span className="metric-amount">{stat.amount}</span>
                                        <span className="metric-count">{stat.count} students</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Breakdown Table */}
                    <div className="breakdown-table-section">
                        <div className="table-responsive">
                            <table className="stats-table">
                                <thead>
                                    <tr>
                                        <th>S/N</th>
                                        <th>Class Name</th>
                                        <th>Flat Fee</th>
                                        <th>Expected</th>
                                        <th>Total Received</th>
                                        <th>Debt</th>
                                        <th>Collection Progress</th>
                                        <th>Extra/Disc</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {initialPaymentBreakdown.map((item, index) => (
                                        <tr
                                            key={item.id}
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => handleRowClick(item)}
                                        >
                                            <td>{index + 1}</td>
                                            <td className="title-cell">{item.title}</td>
                                            <td>₦{item.flatAmount.toLocaleString()}</td>
                                            <td>
                                                <div className="amount-col">
                                                    <span className="amount-val">₦{item.expected.split(' (')[0]}</span>
                                                    <span className="count-val">{item.expected.split(' (')[1]?.replace(')', '') || 0} students</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="amount-col">
                                                    <span className="amount-val">₦{item.totalReceived.split(' (')[0]}</span>
                                                    <span className="count-val">{item.totalReceived.split(' (')[1]?.replace(')', '') || 0} paid</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="amount-col">
                                                    <span className="amount-val">₦{item.debt.split(' (')[0]}</span>
                                                    <span className="count-val">{item.debt.split(' (')[1]?.replace(')', '') || 0} pending</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="progress-container">
                                                    <div className="progress-track">
                                                        <div
                                                            className="progress-fill"
                                                            style={{
                                                                width: `${item.progress}%`,
                                                                backgroundColor: item.progress >= 100 ? '#16a34a' : (item.progress > 50 ? '#7c3aed' : '#f59e0b')
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <span className="progress-text">{item.progress}%</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="amount-col">
                                                    <span className="amount-val" style={{ color: item.extraCharge > 0 ? '#ea580c' : '#0f172a' }}>
                                                        {item.extraCharge > 0 ? `+₦${item.extraCharge.toLocaleString()}` : (item.discount > 0 ? `-₦${item.discount.toLocaleString()}` : '—')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <button className="row-action-btn">
                                                    <ChevronRight size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {initialPaymentBreakdown.length === 0 && (
                                        <tr>
                                            <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                                                No breakdown data found for this selection.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <ClassPaymentDetailModal
                    isOpen={isDetailModalOpen}
                    onClose={() => setIsDetailModalOpen(false)}
                    classData={selectedClassForDetail}
                    feeId={selectedFeeId === 'all' ? fees[0]?.id : selectedFeeId}
                />
            </div>
        </Layout>
    );
};

export default PaymentsOverview;
