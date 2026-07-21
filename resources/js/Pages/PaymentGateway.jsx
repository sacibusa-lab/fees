import React from 'react';
import { Head } from '@inertiajs/react';
import Layout from '../Components/Layout';
import {
    CreditCard, Activity, CheckCircle, XCircle, Clock,
    AlertTriangle, BarChart3, TrendingUp, Users, Wallet,
    RefreshCw, ExternalLink, Settings
} from 'lucide-react';
import './PaymentGateway.css';

const formatCurrency = (amt) => {
    const value = typeof amt === 'string' ? parseFloat(amt.replace(/,/g, '')) : amt;
    return new Intl.NumberFormat('en-NG', {
        style: 'currency', currency: 'NGN', minimumFractionDigits: 0
    }).format(value || 0);
};

const PaymentGateway = ({
    stats = {},
    webhookStats = {},
    dvaStats = {},
    trend = [],
    channelBreakdown = {},
    paystackBalance = null,
    paystackConfigured = false,
    recentWebhooks = [],
    recentTransactions = [],
}) => {
    const maxTrend = Math.max(...trend.map(t => t.successful + t.failed), 1);

    return (
        <Layout>
            <Head title="Payment Gateway" />

            <div className="gateway-container">
                <div className="gateway-header">
                    <div>
                        <h1>Payment Gateway</h1>
                        <p>Paystack integration health and transaction monitoring</p>
                    </div>
                    <div className="gateway-header-actions">
                        <span className={`gateway-status-badge ${paystackConfigured ? 'configured' : 'not-configured'}`}>
                            <span className="status-dot" />
                            {paystackConfigured ? 'Paystack Connected' : 'Not Configured'}
                        </span>
                        {paystackBalance && (
                            <span className="gateway-balance-badge">
                                <Wallet size={16} />
                                Balance: {formatCurrency(paystackBalance.balance)}
                                {paystackBalance.pending > 0 && (
                                    <span className="balance-pending">
                                        (₦{paystackBalance.pending.toLocaleString()} pending)
                                    </span>
                                )}
                            </span>
                        )}
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="gateway-stats-grid">
                    <div className="gw-stat-card highlight-purple">
                        <div className="gw-stat-icon">
                            <TrendingUp size={22} />
                        </div>
                        <div className="gw-stat-body">
                            <span className="gw-stat-value">{formatCurrency(stats.total_volume)}</span>
                            <span className="gw-stat-label">Total Volume Collected</span>
                        </div>
                    </div>
                    <div className="gw-stat-card highlight-green">
                        <div className="gw-stat-icon">
                            <CheckCircle size={22} />
                        </div>
                        <div className="gw-stat-body">
                            <span className="gw-stat-value">{stats.successful}</span>
                            <span className="gw-stat-label">Successful Transactions</span>
                            <span className="gw-stat-sub">{stats.success_rate}% success rate</span>
                        </div>
                    </div>
                    <div className="gw-stat-card highlight-red">
                        <div className="gw-stat-icon">
                            <XCircle size={22} />
                        </div>
                        <div className="gw-stat-body">
                            <span className="gw-stat-value">{stats.failed}</span>
                            <span className="gw-stat-label">Failed Transactions</span>
                        </div>
                    </div>
                    <div className="gw-stat-card highlight-orange">
                        <div className="gw-stat-icon">
                            <Clock size={22} />
                        </div>
                        <div className="gw-stat-body">
                            <span className="gw-stat-value">{stats.pending}</span>
                            <span className="gw-stat-label">Pending Transactions</span>
                        </div>
                    </div>
                    <div className="gw-stat-card highlight-blue">
                        <div className="gw-stat-icon">
                            <Activity size={22} />
                        </div>
                        <div className="gw-stat-body">
                            <span className="gw-stat-value">{stats.online}</span>
                            <span className="gw-stat-label">Online (Paystack)</span>
                            <span className="gw-stat-sub">{stats.manual} manual entries</span>
                        </div>
                    </div>
                    <div className="gw-stat-card highlight-teal">
                        <div className="gw-stat-icon">
                            <Users size={22} />
                        </div>
                        <div className="gw-stat-body">
                            <span className="gw-stat-value">{dvaStats.total}</span>
                            <span className="gw-stat-label">Virtual Accounts</span>
                        </div>
                    </div>
                </div>

                <div className="gateway-dashboard-grid">
                    {/* 7-Day Trend */}
                    <div className="gw-card trend-card">
                        <div className="gw-card-header">
                            <BarChart3 size={18} />
                            <h3>7-Day Transaction Trend</h3>
                        </div>
                        <div className="trend-chart">
                            {trend.map((day, i) => (
                                <div key={i} className="trend-bar-group">
                                    <div className="trend-bars">
                                        <div
                                            className="trend-bar success-bar"
                                            style={{ height: `${(day.successful / maxTrend) * 100}%` }}
                                            title={`${day.successful} successful`}
                                        />
                                        <div
                                            className="trend-bar failed-bar"
                                            style={{ height: `${(day.failed / maxTrend) * 100}%` }}
                                            title={`${day.failed} failed`}
                                        />
                                    </div>
                                    <span className="trend-label">{day.date}</span>
                                    <span className="trend-count">{day.successful + day.failed}</span>
                                </div>
                            ))}
                        </div>
                        <div className="trend-legend">
                            <span className="legend-item"><span className="legend-dot success" /> Successful</span>
                            <span className="legend-item"><span className="legend-dot failed" /> Failed</span>
                        </div>
                    </div>

                    {/* Channel Breakdown */}
                    <div className="gw-card channel-card">
                        <div className="gw-card-header">
                            <CreditCard size={18} />
                            <h3>Payment Channels</h3>
                        </div>
                        <div className="channel-list">
                            {Object.entries(channelBreakdown).length > 0 ? (
                                Object.entries(channelBreakdown).map(([channel, count]) => {
                                    const total = Object.values(channelBreakdown).reduce((a, b) => a + b, 0);
                                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                                    return (
                                        <div key={channel} className="channel-row">
                                            <div className="channel-info">
                                                <span className="channel-name">{channel === 'manual' ? 'Manual Entry' : channel || 'N/A'}</span>
                                                <span className="channel-count">{count} txns</span>
                                            </div>
                                            <div className="channel-bar-bg">
                                                <div className="channel-bar-fill" style={{ width: `${pct}%` }} />
                                            </div>
                                            <span className="channel-pct">{pct}%</span>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="empty-channel">No transaction data yet</div>
                            )}
                        </div>
                    </div>

                    {/* Webhook Health */}
                    <div className="gw-card webhook-card">
                        <div className="gw-card-header">
                            <Activity size={18} />
                            <h3>Webhook Health</h3>
                            <RefreshCw size={16} className="refresh-hint" title="Auto-updates from Paystack" />
                        </div>
                        <div className="webhook-stats-row">
                            <div className="wh-stat">
                                <span className="wh-stat-value">{webhookStats.total}</span>
                                <span className="wh-stat-label">Total Events</span>
                            </div>
                            <div className="wh-stat">
                                <span className="wh-stat-value green">{webhookStats.processed}</span>
                                <span className="wh-stat-label">Processed</span>
                            </div>
                            <div className="wh-stat">
                                <span className="wh-stat-value red">{webhookStats.failed}</span>
                                <span className="wh-stat-label">Failed</span>
                            </div>
                            <div className="wh-stat">
                                <span className="wh-stat-value orange">{webhookStats.pending}</span>
                                <span className="wh-stat-label">Pending</span>
                            </div>
                        </div>
                        <div className="webhook-list">
                            <h4>Recent Webhook Events</h4>
                            {recentWebhooks.length > 0 ? (
                                recentWebhooks.map((w) => (
                                    <div key={w.id} className="webhook-item">
                                        <span className={`wh-event-badge ${w.status}`}>
                                            {w.status}
                                        </span>
                                        <span className="wh-event-type">{w.event_type}</span>
                                        <span className="wh-event-ref">{w.reference ? w.reference.substring(0, 16) + '...' : '—'}</span>
                                        <span className="wh-event-time">{w.created_at}</span>
                                        {w.error_message && (
                                            <span className="wh-event-error" title={w.error_message}>
                                                <AlertTriangle size={12} /> Error
                                            </span>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="empty-webhooks">No webhook events received yet</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Transactions Table */}
                <div className="gw-card recent-tx-card">
                    <div className="gw-card-header">
                        <CreditCard size={18} />
                        <h3>Recent Transactions</h3>
                    </div>
                    <div className="recent-tx-table-wrapper">
                        <table className="recent-tx-table">
                            <thead>
                                <tr>
                                    <th>Reference</th>
                                    <th>Amount</th>
                                    <th>Channel</th>
                                    <th>Gateway</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentTransactions.length > 0 ? (
                                    recentTransactions.map((tx) => (
                                        <tr key={tx.id}>
                                            <td className="tx-ref-cell">{tx.reference ? tx.reference.substring(0, 20) + '...' : '—'}</td>
                                            <td className="tx-amount-cell">{formatCurrency(tx.amount)}</td>
                                            <td>
                                                <span className={`channel-tag ${tx.channel === 'manual' ? 'manual' : 'online'}`}>
                                                    {tx.channel}
                                                </span>
                                            </td>
                                            <td>{tx.gateway || '—'}</td>
                                            <td>
                                                <span className={`tx-status-dot ${tx.status}`} />
                                                {tx.status}
                                            </td>
                                            <td className="tx-date-cell">{tx.paid_at || tx.created_at}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="empty-tx">No transactions found</td>
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

export default PaymentGateway;
