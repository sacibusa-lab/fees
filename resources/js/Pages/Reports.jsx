import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import Layout from '../Components/Layout';
import {
    BarChart3, Download, TrendingUp, AlertTriangle,
    User, Phone, Search, Filter, DollarSign, Target,
    PieChart, Calendar
} from 'lucide-react';
import './Reports.css';

const formatCurrency = (amt) => {
    const value = typeof amt === 'string' ? parseFloat(amt.replace(/,/g, '')) : amt;
    return new Intl.NumberFormat('en-NG', {
        style: 'currency', currency: 'NGN', minimumFractionDigits: 0
    }).format(value || 0);
};

const Reports = ({ sessions = [], classes = [], filters = {}, summary = {}, classBreakdown = [], trendData = [], topDefaulters = [] }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [localFilters, setLocalFilters] = useState({
        session_id: filters.session_id || '',
        term: filters.term || '1st Term',
        class_id: filters.class_id || '',
    });

    const applyFilters = () => {
        router.get('/reports', localFilters, { preserveState: true, replace: true });
    };

    const exportCsv = (type) => {
        const params = new URLSearchParams({
            type,
            session_id: localFilters.session_id,
            term: localFilters.term,
            class_id: localFilters.class_id,
        });
        window.open(`/reports/export?${params}`, '_blank');
    };

    const maxClassRate = Math.max(...classBreakdown.map(c => c.rate), 1);
    const maxTrend = Math.max(...trendData.map(t => Math.max(t.expected, t.actual)), 1);

    return (
        <Layout>
            <Head title="Collection Reports" />
            <div className="reports-container">
                <div className="reports-header">
                    <div>
                        <h1>Collection Reports & Analytics</h1>
                        <p>Track expected vs actual revenue, collection rates, and defaulters</p>
                    </div>
                    <div className="reports-header-actions">
                        <button className="export-btn" onClick={() => exportCsv('summary')}>
                            <Download size={16} /> Export Summary
                        </button>
                        <button className="export-btn" onClick={() => exportCsv('class-breakdown')}>
                            <Download size={16} /> Export Classes
                        </button>
                        <button className="export-btn" onClick={() => exportCsv('defaulters')}>
                            <Download size={16} /> Export Defaulters
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="reports-filters">
                    <div className="filter-group">
                        <label><Calendar size={14} /> Session</label>
                        <select value={localFilters.session_id} onChange={e => setLocalFilters({ ...localFilters, session_id: e.target.value })}>
                            {sessions.map(s => (
                                <option key={s.id} value={s.id}>{s.name} {s.is_current ? '(Current)' : ''}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label><Target size={14} /> Term</label>
                        <select value={localFilters.term} onChange={e => setLocalFilters({ ...localFilters, term: e.target.value })}>
                            <option value="1st Term">1st Term</option>
                            <option value="2nd Term">2nd Term</option>
                            <option value="3rd Term">3rd Term</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <label><Filter size={14} /> Class</label>
                        <select value={localFilters.class_id} onChange={e => setLocalFilters({ ...localFilters, class_id: e.target.value })}>
                            <option value="">All Classes</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <button className="apply-btn" onClick={applyFilters}><Search size={16} /> Apply</button>
                </div>

                {/* Tab Navigation */}
                <div className="reports-tabs">
                    <button className={`tab-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                        <BarChart3 size={18} /> Overview
                    </button>
                    <button className={`tab-item ${activeTab === 'classes' ? 'active' : ''}`} onClick={() => setActiveTab('classes')}>
                        <PieChart size={18} /> By Class
                    </button>
                    <button className={`tab-item ${activeTab === 'trend' ? 'active' : ''}`} onClick={() => setActiveTab('trend')}>
                        <TrendingUp size={18} /> Trend
                    </button>
                    <button className={`tab-item ${activeTab === 'defaulters' ? 'active' : ''}`} onClick={() => setActiveTab('defaulters')}>
                        <AlertTriangle size={18} /> Top Defaulters
                    </button>
                </div>

                {/* === OVERVIEW TAB === */}
                {activeTab === 'overview' && (
                    <div className="report-tab-content">
                        <div className="summary-stats-grid">
                            <div className="summary-card expected">
                                <div className="sc-icon"><DollarSign size={22} /></div>
                                <div className="sc-body">
                                    <span className="sc-label">Expected Revenue</span>
                                    <span className="sc-value">{formatCurrency(summary.expected_total)}</span>
                                    <span className="sc-sub">{summary.total_students} students</span>
                                </div>
                            </div>
                            <div className="summary-card received">
                                <div className="sc-icon"><TrendingUp size={22} /></div>
                                <div className="sc-body">
                                    <span className="sc-label">Actual Collected</span>
                                    <span className="sc-value">{formatCurrency(summary.actual_total)}</span>
                                    <span className="sc-sub">{summary.paid_count} fully paid</span>
                                </div>
                            </div>
                            <div className="summary-card outstanding">
                                <div className="sc-icon"><AlertTriangle size={22} /></div>
                                <div className="sc-body">
                                    <span className="sc-label">Outstanding</span>
                                    <span className="sc-value">{formatCurrency(summary.outstanding)}</span>
                                    <span className="sc-sub">{summary.pending_count} not paid</span>
                                </div>
                            </div>
                            <div className="summary-card rate">
                                <div className="sc-icon"><Target size={22} /></div>
                                <div className="sc-body">
                                    <span className="sc-label">Collection Rate</span>
                                    <span className="sc-value rate-value">{summary.collection_rate}%</span>
                                    <span className="sc-sub">{summary.partial_count} partial</span>
                                </div>
                            </div>
                        </div>

                        {/* Collection Progress Bar */}
                        <div className="collection-progress-card">
                            <h3>Collection Progress</h3>
                            <div className="progress-stats-row">
                                <span>{formatCurrency(summary.actual_total)} collected</span>
                                <span>of {formatCurrency(summary.expected_total)}</span>
                            </div>
                            <div className="progress-bar-bg">
                                <div className="progress-bar-fill" style={{ width: `${Math.min(summary.collection_rate, 100)}%` }} />
                            </div>
                            <div className="progress-legend">
                                <span><span className="legend-dot green" /> Paid ({summary.paid_count})</span>
                                <span><span className="legend-dot orange" /> Partial ({summary.partial_count})</span>
                                <span><span className="legend-dot red" /> Pending ({summary.pending_count})</span>
                            </div>
                            <div className="extra-stats-row">
                                <span>Discounts: {formatCurrency(summary.total_discount)}</span>
                                <span>Extra Charges: {formatCurrency(summary.total_extra)}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* === BY CLASS TAB === */}
                {activeTab === 'classes' && (
                    <div className="report-tab-content">
                        <div className="class-breakdown-list">
                            {classBreakdown.length > 0 ? (
                                classBreakdown.map((cls, i) => (
                                    <div key={i} className="class-breakdown-card">
                                        <div className="class-bd-header">
                                            <h3>{cls.class_name}</h3>
                                            <span className="class-student-count">{cls.students} students</span>
                                        </div>
                                        <div className="class-bd-stats">
                                            <div className="class-stat">
                                                <span className="cs-label">Expected</span>
                                                <span className="cs-value">{formatCurrency(cls.expected)}</span>
                                            </div>
                                            <div className="class-stat">
                                                <span className="cs-label">Received</span>
                                                <span className="cs-value green">{formatCurrency(cls.received)}</span>
                                            </div>
                                            <div className="class-stat">
                                                <span className="cs-label">Outstanding</span>
                                                <span className="cs-value red">{formatCurrency(cls.outstanding)}</span>
                                            </div>
                                            <div className="class-stat">
                                                <span className="cs-label">Rate</span>
                                                <span className="cs-value rate">{cls.rate}%</span>
                                            </div>
                                        </div>
                                        <div className="class-bar-bg">
                                            <div className="class-bar-fill" style={{ width: `${Math.min((cls.rate / maxClassRate) * 100, 100)}%` }} />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-reports">No class data for the selected filters</div>
                            )}
                        </div>
                    </div>
                )}

                {/* === TREND TAB === */}
                {activeTab === 'trend' && (
                    <div className="report-tab-content">
                        <div className="trend-card">
                            <h3>Monthly Collection Trend (12 Months)</h3>
                            <div className="trend-chart-container">
                                <div className="trend-chart-bars">
                                    {trendData.map((t, i) => (
                                        <div key={i} className="trend-bar-col">
                                            <div className="trend-bar-group">
                                                <div className="trend-bar expected-bar" style={{ height: `${(t.expected / maxTrend) * 100}%` }} title={`Expected: ${formatCurrency(t.expected)}`} />
                                                <div className="trend-bar actual-bar" style={{ height: `${(t.actual / maxTrend) * 100}%` }} title={`Actual: ${formatCurrency(t.actual)}`} />
                                            </div>
                                            <span className="trend-month-label">{t.month}</span>
                                            <span className="trend-rate-label">{t.rate}%</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="trend-legend">
                                    <span><span className="legend-dot purple" /> Expected</span>
                                    <span><span className="legend-dot green" /> Actual</span>
                                    <span className="trend-avg">
                                        Avg Rate: {trendData.length > 0
                                            ? Math.round(trendData.reduce((s, t) => s + t.rate, 0) / trendData.length)
                                            : 0}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* === DEFAULTERS TAB === */}
                {activeTab === 'defaulters' && (
                    <div className="report-tab-content">
                        <div className="defaulters-toolbar">
                            <span className="def-count">{topDefaulters.length} students with outstanding balance</span>
                            <button className="export-btn" onClick={() => exportCsv('defaulters')}>
                                <Download size={16} /> CSV
                            </button>
                        </div>
                        <div className="defaulters-table-wrapper">
                            <table className="defaulters-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Student</th>
                                        <th>Admission</th>
                                        <th>Class</th>
                                        <th>Guardian</th>
                                        <th>Phone</th>
                                        <th>Expected</th>
                                        <th>Paid</th>
                                        <th>Outstanding</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topDefaulters.length > 0 ? (
                                        topDefaulters.map((d, i) => (
                                            <tr key={d.id}>
                                                <td>{i + 1}</td>
                                                <td className="def-name">{d.name}</td>
                                                <td className="def-adm">{d.admission_no}</td>
                                                <td>{d.class_name}</td>
                                                <td>{d.guardian_name}</td>
                                                <td>
                                                    {d.guardian_phone ? (
                                                        <a href={`tel:${d.guardian_phone}`} className="phone-link">
                                                            <Phone size={12} /> {d.guardian_phone}
                                                        </a>
                                                    ) : '—'}
                                                </td>
                                                <td className="amount-cell">{formatCurrency(d.expected)}</td>
                                                <td className="amount-cell green">{formatCurrency(d.paid)}</td>
                                                <td className="amount-cell red bold">{formatCurrency(d.outstanding)}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="9" className="empty-def">No defaulters found 🎉</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Reports;
