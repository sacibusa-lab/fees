import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import Layout from '../../Components/Layout';
import { 
    Calendar, 
    ChevronDown, 
    ChevronUp, 
    CreditCard, 
    ArrowRightLeft, 
    CheckCircle, 
    AlertCircle, 
    HelpCircle,
    Copy,
    ExternalLink
} from 'lucide-react';
import './Settlements.css';

const Settlements = ({ groupedSettlements = {}, stats = {}, auth, flash }) => {
    console.log('Settlements Component Rendered', { stats, groupedCount: Object.keys(groupedSettlements || {}).length });
    
    const [expandedDate, setExpandedDate] = useState(null);
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    
    // Manage expansion for Sessions, Terms, and Months
    const [expandedSessions, setExpandedSessions] = useState([]);
    const [expandedTerms, setExpandedTerms] = useState([]);
    const [expandedMonths, setExpandedMonths] = useState([]);

    const canManage = auth?.permissions?.includes('payments.manage') || false;

    const toggleSession = (session) => {
        setExpandedSessions(prev => 
            prev.includes(session) ? prev.filter(s => s !== session) : [...prev, session]
        );
    };

    const toggleTerm = (session, term) => {
        const key = `${session}|${term}`;
        setExpandedTerms(prev => 
            prev.includes(key) ? prev.filter(t => t !== key) : [...prev, key]
        );
    };

    const toggleMonth = (session, term, month) => {
        const key = `${session}|${term}|${month}`;
        setExpandedMonths(prev => 
            prev.includes(key) ? prev.filter(m => m !== key) : [...prev, key]
        );
    };

    // Calculate total settlements across all groups
    const totalSettlementsCount = Object.values(groupedSettlements || {}).reduce(
        (acc, terms) => acc + Object.values(terms || {}).reduce(
            (acc2, months) => acc2 + Object.values(months || {}).reduce(
                (acc3, days) => acc3 + Object.keys(days || {}).length, 0
            ), 0
        ), 0
    );

    const fetchDetails = async (date) => {
        if (expandedDate === date) {
            setExpandedDate(null);
            return;
        }

        setLoading(true);
        setExpandedDate(date);
        try {
            const response = await fetch(`/api/settlements/${date}`);
            const data = await response.json();
            setDetails(data);
        } catch (error) {
            console.error('Error fetching settlement details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkDisbursed = (date, total, payouts, remainder) => {
        if (!confirm('Have you manually transferred these funds via your bank app? This will mark the batch as disbursed.')) {
            return;
        }

        setProcessing(true);
        router.post('/settlements/mark-disbursed', {
            date: date,
            total_collected: total,
            split_breakdown: {
                payouts: payouts,
                remainder: remainder
            }
        }, {
            onSuccess: () => {
                setProcessing(false);
                setExpandedDate(null);
                setDetails(null);
            },
            onError: (errors) => {
                setProcessing(false);
                alert('Something went wrong. Please check the logs.');
            },
            onFinish: () => {
                setProcessing(false);
            }
        });
    };

    const formatCurrency = (amt) => {
        try {
            const value = typeof amt === 'string' ? parseFloat(amt.replace(/,/g, '')) : amt;
            return new Intl.NumberFormat('en-NG', {
                style: 'currency',
                currency: 'NGN',
                minimumFractionDigits: 0
            }).format(value || 0);
        } catch (e) {
            return '₦0';
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard: ' + text);
    };

    return (
        <Layout>
            <Head title="Settlements & Payouts" />
            
            <div className="settlements-container">
                <div className="settlements-header">
                    <div>
                        <h1>Settlements & Payouts</h1>
                        <p>Organize collections by session, term, and month. Click to expand.</p>
                    </div>
                </div>

                {stats && (
                    <div className="settlement-stats-grid">
                        <div className="stat-card">
                            <span className="stat-label">Total Collections</span>
                            <span className="stat-value">{formatCurrency(stats?.total_collected)}</span>
                            <div className="stat-footer">Cumulative Disbursed</div>
                        </div>
                        <div className="stat-card highlight-zenith">
                            <span className="stat-label">Zenith Total</span>
                            <span className="stat-value">{formatCurrency(stats?.total_zenith)}</span>
                            <div className="stat-footer">Paid to Zenith Accounts</div>
                        </div>
                        <div className="stat-card highlight-keystone">
                            <span className="stat-label">Keystone Total</span>
                            <span className="stat-value">{formatCurrency(stats?.total_keystone)}</span>
                            <div className="stat-footer">Paid to Keystone Accounts</div>
                        </div>
                        <div className="stat-card highlight-it">
                            <span className="stat-label">IT Maintenance</span>
                            <span className="stat-value">{formatCurrency(stats?.total_it)}</span>
                            <div className="stat-footer">Total Platform Fees</div>
                        </div>
                    </div>
                )}

                {totalSettlementsCount === 0 ? (
                    <div className="empty-state">
                        <Calendar size={48} color="#cbd5e1" />
                        <h3>No collections found</h3>
                        <p>When students start paying, daily settlement batches will appear here.</p>
                    </div>
                ) : (
                    <div className="settlements-grouped-list">
                        {Object.entries(groupedSettlements || {}).map(([session, terms]) => (
                            <div key={session} className="session-section">
                                <h2 
                                    className="group-heading session-heading clickable"
                                    onClick={() => toggleSession(session)}
                                >
                                    {expandedSessions.includes(session) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    {session}
                                </h2>
                                
                                {expandedSessions.includes(session) && Object.entries(terms || {}).map(([term, months]) => (
                                    <div key={term} className="term-section">
                                        <h3 
                                            className="group-heading term-heading clickable"
                                            onClick={() => toggleTerm(session, term)}
                                        >
                                            {expandedTerms.includes(`${session}|${term}`) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                            {term}
                                        </h3>
                                        
                                        {expandedTerms.includes(`${session}|${term}`) && Object.entries(months || {}).map(([month, days]) => {
                                            const dayEntries = Object.values(days || {});
                                            const allDisbursed = dayEntries.length > 0 && dayEntries.every(d => d.status === 'disbursed');
                                            const monthStatus = allDisbursed ? 'complete' : 'pending';
                                            
                                            return (
                                            <div key={month} className="month-section">
                                                <h4 
                                                    className={`group-heading month-heading month-status-${monthStatus} clickable`}
                                                    onClick={() => toggleMonth(session, term, month)}
                                                >
                                                    {expandedMonths.includes(`${session}|${term}|${month}`) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                    <span className={`month-status-dot month-dot-${monthStatus}`} />
                                                    {month}
                                                    <span className={`month-status-label`}>
                                                        {allDisbursed ? 'All disbursed' : `${dayEntries.filter(d => d.status !== 'disbursed').length} pending`}
                                                    </span>
                                                </h4>
                                                
                                                {expandedMonths.includes(`${session}|${term}|${month}`) && (
                                                    <div className="settlements-list">
                                                        {Object.values(days || {}).map((s) => (
                                                            <div key={s.date} className="settlement-card">
                                                                <div 
                                                                    className="settlement-card-header"
                                                                    onClick={() => fetchDetails(s.date)}
                                                                >
                                                                    <div className="settlement-info">
                                                                        <div className="settlement-date">
                                                                            <span className="date-label">Collection Day</span>
                                                                            <span className="date-value">
                                                                                {s.date ? new Date(s.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Unknown Date'}
                                                                            </span>
                                                                        </div>
                                                                        <div className="settlement-amount">
                                                                            <span className="amount-label">Lump Sum Total</span>
                                                                            <span className="amount-value">{formatCurrency(s.total_collected)}</span>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                                        <span className={`status-badge status-${s.status}`}>
                                                                            {s.status === 'awaiting_bank_settlement' && 'Awaiting Settlement'}
                                                                            {s.status === 'ready_for_split' && 'Ready for Split'}
                                                                            {s.status === 'disbursed' && 'Fully Disbursed'}
                                                                        </span>
                                                                        {expandedDate === s.date ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                                    </div>
                                                                </div>

                                                                {expandedDate === s.date && (
                                                                    <div className="settlement-card-body">
                                                                        {loading ? (
                                                                            <div className="loading-inline">
                                                                                <div className="spinner">Calculating splits...</div>
                                                                            </div>
                                                                        ) : details ? (
                                                                            <>
                                                                                {/* INSTRUCTIONS AREA */}
                                                                                <div className="split-section">
                                                                                    <div className="section-title">
                                                                                        <ArrowRightLeft size={18} />
                                                                                        MANUAL TRANSFER INSTRUCTIONS
                                                                                    </div>
                                                                                    
                                                                                    <div className="payouts-grid">
                                                                                        {(details.payouts || []).map((p, idx) => (
                                                                                            <div key={idx} className="payout-item highlight">
                                                                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                                                    <span className="payout-bank">{(p.bank_name || '').toUpperCase()}</span>
                                                                                                    <button 
                                                                                                        onClick={(e) => { e.stopPropagation(); copyToClipboard(p.account_number); }}
                                                                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                                                                                                        title="Copy Account Number"
                                                                                                    >
                                                                                                        <Copy size={14} />
                                                                                                    </button>
                                                                                                </div>
                                                                                                <div className="payout-account">{p.account_name}</div>
                                                                                                <div className="payout-account" style={{ fontSize: '12px', color: '#64748b' }}>{p.account_number}</div>
                                                                                                <div className="payout-amount">{formatCurrency(p.amount)}</div>
                                                                                            </div>
                                                                                        ))}
                                                                                        
                                                                                        {/* REMAINDER / IT MAINTENANCE */}
                                                                                        {details.remainder && (
                                                                                            <div className="payout-item">
                                                                                                <div className="payout-bank">REMAINDER / {(details.remainder.label || '').toUpperCase()}</div>
                                                                                                <div className="payout-account">Keep in Main Kuda Account</div>
                                                                                                <div className="payout-amount" style={{ color: '#1e293b' }}>
                                                                                                    {formatCurrency(details.remainder.amount)}
                                                                                                </div>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>

                                                                                {/* TRANSACTIONS BREAKDOWN */}
                                                                                <div className="split-section">
                                                                                    <div className="section-title">
                                                                                        <CreditCard size={18} />
                                                                                        TRANSACTION BREAKDOWN ({(details.transactions || []).length})
                                                                                    </div>
                                                                                    <div className="transactions-table-container">
                                                                                        <table className="transactions-table">
                                                                                            <thead>
                                                                                                <tr>
                                                                                                    <th>Student Name</th>
                                                                                                    <th>Amount</th>
                                                                                                    <th>Time</th>
                                                                                                </tr>
                                                                                            </thead>
                                                                                            <tbody>
                                                                                                {(details.transactions || []).map((tx) => (
                                                                                                    <tr key={tx.id}>
                                                                                                        <td>{tx.student_name}</td>
                                                                                                        <td>{formatCurrency(tx.amount)}</td>
                                                                                                        <td>{tx.paid_at ? new Date(tx.paid_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</td>
                                                                                                    </tr>
                                                                                                ))}
                                                                                            </tbody>
                                                                                        </table>
                                                                                    </div>
                                                                                </div>

                                                                                {/* ACTION COLUMN */}
                                                                                {s.status === 'ready_for_split' && canManage && (
                                                                                    <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                                                                                        <button 
                                                                                            className="btn-confirm-split"
                                                                                            disabled={processing}
                                                                                            onClick={() => handleMarkDisbursed(s.date, s.total_collected, details.payouts, details.remainder)}
                                                                                        >
                                                                                            {processing ? (
                                                                                                <div className="spinner-small" />
                                                                                            ) : (
                                                                                                <CheckCircle size={18} />
                                                                                            )}
                                                                                            {processing ? 'Processing...' : 'I Have Completed These Manual Transfers'}
                                                                                        </button>
                                                                                    </div>
                                                                                )}

                                                                                {s.status === 'ready_for_split' && !canManage && (
                                                                                    <div style={{ marginTop: '16px', color: '#dc2626', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                                        <AlertCircle size={16} />
                                                                                        You do not have permission to mark this batch as disbursed.
                                                                                    </div>
                                                                                )}

                                                                                {s.status === 'disbursed' && (
                                                                                    <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '14px' }}>
                                                                                        <CheckCircle size={18} color="#10b981" />
                                                                                        Marked as disbursed by {s.disbursed_by} on {s.disbursed_at ? new Date(s.disbursed_at).toLocaleString() : 'Unknown'}
                                                                                    </div>
                                                                                )}
                                                                            </>
                                                                        ) : (
                                                                            <div className="loading-inline">Failed to load details.</div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                        })}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Settlements;
